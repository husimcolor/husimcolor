/**
 * 커플 세션 카드 선택 화면
 * premium-select.tsx와 동일한 UX:
 * - 베이지 뒷면 카드 그리드 (63장 셔플)
 * - 탭하면 앞면 공개 → 다시 탭하면 선택 확정
 * - 3장 자유 선택 후 한 번에 확인
 * - 1번: 무의식·내면 에너지 / 2번: 현재 현실 에너지 / 3번: 미래·회복·희망 에너지
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Dimensions, TouchableOpacity, Animated, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CARD_DATA, type CardData } from '@/constants/cardData';
import type { CoupleSessionData } from '@/constants/coupleData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 32) / 5;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const POSITION_LABELS = ['무의식 · 내면 에너지', '현재 현실 에너지', '미래 · 회복 · 희망 에너지'];
const POSITION_COLORS = ['#3D6B3D', '#B5A0C8', '#C4956A'];

const CARD_BACK_COLOR = '#D8CEBC';
const CARD_BACK_BORDER = '#B8A898';
const CARD_BACK_SYMBOL_COLOR = 'rgba(120, 105, 88, 0.60)';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── CSS 주입 (웹 전용) ──────────────────────────────────────────────────────
let coupleCSSInjected = false;
function injectCoupleCSS() {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  if (coupleCSSInjected) return;
  coupleCSSInjected = true;

  const existing = document.getElementById('hyusim-couple-anim');
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = 'hyusim-couple-anim';
  style.textContent = `
    @keyframes coupleCardEnter {
      0%   { opacity: 0; transform: translateY(20px) scale(0.96); }
      60%  { opacity: 1; }
      100% { opacity: 1; transform: translateY(0px) scale(1); }
    }
    @keyframes coupleCardShuffle {
      0%   { opacity: 0; transform: translateY(28px) rotate(-2deg) scale(0.93); }
      40%  { opacity: 0.7; transform: translateY(8px) rotate(0.5deg) scale(0.98); }
      70%  { opacity: 1; transform: translateY(-3px) rotate(-0.3deg) scale(1.01); }
      100% { opacity: 1; transform: translateY(0px) rotate(0deg) scale(1); }
    }
    @keyframes coupleFlipOut {
      0%   { transform: scaleX(1); }
      100% { transform: scaleX(0); }
    }
    @keyframes coupleFlipIn {
      0%   { transform: scaleX(0); }
      100% { transform: scaleX(1); }
    }
    .couple-card-wrapper { display: inline-block; opacity: 0; }
    .couple-card-wrapper.entering { animation: coupleCardEnter 0.9s ease both; }
    .couple-card-wrapper.shuffling { animation: coupleCardShuffle 1.1s cubic-bezier(0.22, 1, 0.36, 1) both; }
    .couple-flip-inner { display: block; width: 100%; height: 100%; }
    .couple-flip-inner.flip-out { animation: coupleFlipOut 0.28s ease forwards; }
    .couple-flip-inner.flip-in { animation: coupleFlipIn 0.28s ease forwards; }
    .couple-flip-inner.selected { transform: scale(1.06); }
  `;
  document.head.appendChild(style);
}

// ─── 웹 카드 컴포넌트 ────────────────────────────────────────────────────────
interface WebCardProps {
  card: CardData;
  isFlipped: boolean;
  isSelected: boolean;
  onPress: () => void;
  entryDelay: number;
  isShuffle?: boolean; // B 진입 시 셔플 애니메이션 사용
}

function WebCard({ card, isFlipped, isSelected, onPress, entryDelay, isShuffle }: WebCardProps) {
  const wrapperRef = useRef<any>(null);
  const flipRef = useRef<any>(null);
  const prevFlipped = useRef(isFlipped);
  const [showFront, setShowFront] = useState(isFlipped);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const animClass = isShuffle ? 'shuffling' : 'entering';
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (el) {
            el.style.animationDelay = '0ms';
            el.classList.add(animClass);
          }
        });
      });
    }, entryDelay);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (prevFlipped.current === isFlipped) return;
    prevFlipped.current = isFlipped;
    const flipEl = flipRef.current;
    if (!flipEl) return;
    flipEl.classList.remove('flip-in', 'selected');
    flipEl.classList.add('flip-out');
    const onFlipOutEnd = () => {
      flipEl.removeEventListener('animationend', onFlipOutEnd);
      setShowFront(isFlipped);
      flipEl.classList.remove('flip-out');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flipEl.classList.add('flip-in');
          const onFlipInEnd = () => {
            flipEl.removeEventListener('animationend', onFlipInEnd);
            flipEl.classList.remove('flip-in');
            if (isFlipped) flipEl.classList.add('selected');
          };
          flipEl.addEventListener('animationend', onFlipInEnd);
        });
      });
    };
    flipEl.addEventListener('animationend', onFlipOutEnd);
  }, [isFlipped]);

  // 선택 강조: 모든 카드 공통 soft gold outline
  // 뒷면 상태: 카드 컬러와 무관하게 동일한 베이지 테두리
  // 선택 시: 모든 카드(블랙 포함) 동일한 soft gold
  const borderStyle = isSelected
    ? { borderWidth: 2.5, borderColor: '#C8A96E', borderStyle: 'solid' as const }
    : showFront
    ? (card.colorKor === '화이트'
      ? { borderWidth: 1, borderColor: '#D8C7A5', borderStyle: 'solid' as const }
      : {})
    : { borderWidth: 1, borderColor: '#C4B49A', borderStyle: 'solid' as const };

  return (
    <div
      ref={wrapperRef}
      className="couple-card-wrapper"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT, cursor: 'pointer', flexShrink: 0 }}
      onClick={onPress}
    >
      <div
        ref={flipRef}
        className="couple-flip-inner"
        style={{
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: showFront ? card.colorHex : CARD_BACK_COLOR,
          ...borderStyle,
          boxShadow: isSelected
            ? '0 0 0 2.5px #C8A96E, 0 0 12px rgba(200,169,110,0.40)'
            : '0 2px 6px rgba(0,0,0,0.18)',
        }}
      >
        {showFront ? (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
          }}>
            <span style={{
              fontSize: 22,
              color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.92)',
              lineHeight: 1.2,
            }}>{card.shapeSymbol}</span>
            <span style={{
              fontSize: 8,
              color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.95)',
              fontWeight: '700', letterSpacing: 0.2,
            }}>{card.colorKor}</span>
          </div>
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <svg
              width={CARD_WIDTH} height={CARD_HEIGHT}
              viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              <path
                d={`M -10 ${CARD_HEIGHT * 0.25} Q ${CARD_WIDTH * 0.25} ${CARD_HEIGHT * 0.18} ${CARD_WIDTH * 0.5} ${CARD_HEIGHT * 0.25} Q ${CARD_WIDTH * 0.75} ${CARD_HEIGHT * 0.32} ${CARD_WIDTH + 10} ${CARD_HEIGHT * 0.25}`}
                stroke="rgba(120, 105, 88, 0.18)" strokeWidth="1" fill="none"
              />
              <path
                d={`M -10 ${CARD_HEIGHT * 0.5} Q ${CARD_WIDTH * 0.25} ${CARD_HEIGHT * 0.43} ${CARD_WIDTH * 0.5} ${CARD_HEIGHT * 0.5} Q ${CARD_WIDTH * 0.75} ${CARD_HEIGHT * 0.57} ${CARD_WIDTH + 10} ${CARD_HEIGHT * 0.5}`}
                stroke="rgba(120, 105, 88, 0.14)" strokeWidth="1" fill="none"
              />
              <path
                d={`M -10 ${CARD_HEIGHT * 0.75} Q ${CARD_WIDTH * 0.25} ${CARD_HEIGHT * 0.68} ${CARD_WIDTH * 0.5} ${CARD_HEIGHT * 0.75} Q ${CARD_WIDTH * 0.75} ${CARD_HEIGHT * 0.82} ${CARD_WIDTH + 10} ${CARD_HEIGHT * 0.75}`}
                stroke="rgba(120, 105, 88, 0.12)" strokeWidth="1" fill="none"
              />
              <circle cx={CARD_WIDTH * 0.5} cy={CARD_HEIGHT * 0.5} r="2.5" fill="rgba(120, 105, 88, 0.25)" />
              <circle cx={CARD_WIDTH * 0.5} cy={CARD_HEIGHT * 0.5} r="5" stroke="rgba(120, 105, 88, 0.15)" strokeWidth="0.8" fill="none" />
              <circle cx={CARD_WIDTH * 0.5} cy={CARD_HEIGHT * 0.5} r="8.5" stroke="rgba(120, 105, 88, 0.10)" strokeWidth="0.6" fill="none" />
            </svg>
            <span style={{ fontSize: 10, color: CARD_BACK_SYMBOL_COLOR, position: 'relative', zIndex: 1 }}>✦</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 네이티브 카드 컴포넌트 ──────────────────────────────────────────────────
function NativeCard({
  card, isFlipped, isSelected, flipAnim, revealDelay, onPress,
}: {
  card: CardData;
  isFlipped: boolean;
  isSelected: boolean;
  flipAnim: Animated.Value;
  revealDelay: number;
  onPress: () => void;
}) {
  const revealAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(revealAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, revealDelay);
    return () => clearTimeout(timer);
  }, []);

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <Animated.View
      style={{
        opacity: revealAnim,
        transform: [{ translateY: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}>
          {/* 뒷면 */}
          <Animated.View
            style={[
              styles.cardFace,
              styles.cardBack,
              {
                width: CARD_WIDTH, height: CARD_HEIGHT,
                position: 'absolute',
                backfaceVisibility: 'hidden',
                transform: [{ rotateY: backRotate }],
                ...(isSelected ? {
                  borderWidth: 2.5,
                  borderColor: '#C8A96E',
                  shadowColor: '#C8A96E',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.45,
                  shadowRadius: 6,
                  elevation: 5,
                } : {}),
              },
            ]}
          >
            <View style={styles.cardBackContent}>
              <Text style={styles.cardBackSymbol}>✦</Text>
              <Text style={styles.cardBackHint}>탭하여{'\n'}확인</Text>
            </View>
          </Animated.View>
          {/* 앞면 */}
          <Animated.View
            style={[
              styles.cardFace,
              {
                width: CARD_WIDTH, height: CARD_HEIGHT,
                position: 'absolute',
                backfaceVisibility: 'hidden',
                backgroundColor: card.colorHex,
                transform: [{ rotateY: frontRotate }],
                ...(isSelected ? {
                  borderWidth: 2.5,
                  borderColor: '#C8A96E',
                  shadowColor: '#C8A96E',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.45,
                  shadowRadius: 6,
                  elevation: 5,
                } : {}),
              },
            ]}
          >
            <Text style={[styles.shapeSymbol, {
              color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.92)',
            }]}>{card.shapeSymbol}</Text>
            <Text style={[styles.cardFrontColorName, {
              color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.95)',
            }]}>{card.colorKor}</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────────────────────────
export default function CoupleCardSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { person } = useLocalSearchParams<{ person: 'A' | 'B' }>();
  const personLabel = person === 'A' ? '첫 번째 사람' : '두 번째 사람';
  const accentColor = person === 'A' ? '#3D6B3D' : '#7B5EA7';
  const accentBg = person === 'A' ? '#8BAF8B11' : '#7B5EA711';
  const accentBorder = person === 'A' ? '#8BAF8B55' : '#7B5EA755';

  const [sessionData, setSessionData] = useState<CoupleSessionData | null>(null);
  // person이 바뀔 때마다 카드를 새로 셔플하기 위해 person을 의존성으로 사용
  const [shuffledCards, setShuffledCards] = useState<CardData[]>(() => shuffleArray(CARD_DATA));
  const [selectedCards, setSelectedCards] = useState<(CardData | null)[]>([null, null, null]);
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());
  const [isShuffling, setIsShuffling] = useState(true);

  // 이전 단계 컬러 정보
  const [prevColors, setPrevColors] = useState<{ id: string; korName: string; hex: string }[]>([]);

  const flipAnims = useRef<Animated.Value[]>(
    Array.from({ length: 63 }, () => new Animated.Value(0))
  ).current;

  // person이 변경될 때 모든 선택 상태 완전 초기화
  useEffect(() => {
    setSelectedCards([null, null, null]);
    setFlippedIndices(new Set());
    setIsShuffling(true);
    setShuffledCards(shuffleArray(CARD_DATA));
    // flipAnims 전체 리셋
    flipAnims.forEach(anim => anim.setValue(0));
    const timer = setTimeout(() => setIsShuffling(false), 2100);
    return () => clearTimeout(timer);
  }, [person]);

  useEffect(() => {
    AsyncStorage.getItem('@couple_session').then(raw => {
      if (raw) {
        const data: CoupleSessionData = JSON.parse(raw);
        setSessionData(data);
        // 이전 단계 컬러 불러오기
        const colorIds = person === 'A' ? data.personA?.colors : data.personB?.colors;
        if (colorIds && colorIds.length > 0) {
          const { COLOR_DATA: CD } = require('@/constants/colorData');
          const found = colorIds.map((id: string) => CD.find((c: any) => c.id === id)).filter(Boolean);
          setPrevColors(found);
        }
      }
    });
  }, [person]);

  useEffect(() => {
    injectCoupleCSS();
  }, []);

  const selectedCount = selectedCards.filter(Boolean).length;

  const handleCardPress = useCallback(
    (index: number) => {
      if (isShuffling) return;
      const card = shuffledCards[index];

      // 이미 선택된 카드 다시 탭 → 선택 취소
      const selectedIndex = selectedCards.findIndex(c => c?.id === card.id);
      if (selectedIndex !== -1) {
        const newSelected = [...selectedCards];
        newSelected[selectedIndex] = null;
        setSelectedCards(newSelected);
        setFlippedIndices(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
        if (Platform.OS !== 'web') {
          Animated.timing(flipAnims[index], { toValue: 0, duration: 300, useNativeDriver: true }).start();
        }
        return;
      }

      // 이미 3장 선택된 상태에서 다른 카드 탭 → 무시
      if (selectedCount >= 3) return;

      // 1회 탭 = 오픈 + 즉시 선택 확정 (2단계 없음)
      setFlippedIndices(prev => new Set([...prev, index]));
      if (Platform.OS !== 'web') {
        Animated.timing(flipAnims[index], { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
      const newSelected = [...selectedCards];
      const emptyIndex = newSelected.findIndex(c => c === null);
      if (emptyIndex !== -1) {
        newSelected[emptyIndex] = card;
        setSelectedCards(newSelected);
      }
    },
    [isShuffling, shuffledCards, selectedCards, flippedIndices, selectedCount, flipAnims]
  );

  const handleConfirm = async () => {
    if (selectedCount < 3) return;
    if (!sessionData) return;
    const cards = selectedCards.filter(Boolean) as CardData[];
    const cardIds = cards.map(c => c.id);
    const updated = { ...sessionData };
    if (person === 'A') {
      updated.personA = { ...updated.personA, cards: cardIds };
    } else {
      updated.personB = { ...updated.personB, cards: cardIds };
    }
    await AsyncStorage.setItem('@couple_session', JSON.stringify(updated));

    // 카드 선택 완료 → 카드 해석 중간 결과 화면으로 이동
    router.push({ pathname: '/(tabs)/couple-card-result', params: { person } } as any);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View style={[styles.personBadge, { backgroundColor: accentBg, borderColor: accentBorder }]}>
            <Text style={[styles.personBadgeText, { color: accentColor }]}>
              {personLabel}
            </Text>
          </View>
        </View>

        {/* 단계 배지 */}
        <View style={styles.stepBadgeRow}>
          <View style={[styles.stepBadge, { backgroundColor: accentBg, borderColor: accentBorder }]}>
            <Text style={[styles.stepBadgeText, { color: accentColor }]}>2단계 · 심리카드 흐름</Text>
          </View>
        </View>

        {/* 이전 단계 컬러 요약 배너 */}
        {prevColors.length > 0 && (
          <View style={[styles.colorFlowBanner, { backgroundColor: accentBg, borderColor: accentBorder }]}>
            <Text style={[styles.colorFlowTitle, { color: accentColor }]}>🌿 1단계 컬러 흐름</Text>
            <View style={styles.colorFlowRow}>
              {prevColors.map((c: any) => (
                <View key={c.id} style={styles.colorFlowItem}>
                  <View style={[styles.colorFlowDot, { backgroundColor: c.hex }]} />
                  <Text style={[styles.colorFlowName, { color: accentColor }]}>{c.korName}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.colorFlowDesc}>이 컬러 흐름을 바탕으로, 직관이 이끄는 카드를 선택해 주세요</Text>
          </View>
        )}

        {/* 타이틀 */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>컬러 에너지 카드 선택</Text>
          <Text style={styles.subtitle}>마음이 이끄는 카드를 3장 선택해 주세요</Text>
        </View>

        {/* 선택 현황 슬롯 */}
        <View style={styles.slotsRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.slotWrapper}>
              <View style={[
                styles.slot,
                {
                  backgroundColor: selectedCards[i] ? POSITION_COLORS[i] + '33' : '#F2EFE7',
                  borderColor: selectedCards[i] ? POSITION_COLORS[i] : '#DDD8CE',
                  borderStyle: selectedCards[i] ? 'solid' : 'dashed',
                },
              ]}>
                {selectedCards[i] ? (
                  <>
                    <View style={[styles.slotColorDot, { backgroundColor: selectedCards[i]!.colorHex }]} />
                    <Text style={styles.slotCardName}>{selectedCards[i]!.colorKor}</Text>
                    <Text style={styles.slotShapeName}>{selectedCards[i]!.shapeKor}</Text>
                  </>
                ) : (
                  <Text style={styles.slotEmpty}>{i + 1}번</Text>
                )}
              </View>
              <Text style={[styles.slotLabel, { color: POSITION_COLORS[i] }]} numberOfLines={2}>
                {POSITION_LABELS[i]}
              </Text>
            </View>
          ))}
        </View>

        {/* 진행 안내 */}
        <Text style={styles.progressText}>
          {isShuffling
            ? person === 'B'
              ? '🔀 두 번째 사람을 위해 카드를 새로 섞는 중...'
              : '✨ 카드를 섞는 중...'
            : selectedCount < 3
            ? `마음이 이끄는 카드를 ${3 - selectedCount}장 선택해 주세요`
            : '3장 선택 완료 · 아래 버튼을 눌러 다음으로 이동하세요'}
        </Text>

        {/* 카드 그리드 */}
        <View style={styles.cardGrid}>
          {shuffledCards.map((card, index) => {
            const isFlipped = flippedIndices.has(index);
            const isSelected = selectedCards.some(c => c?.id === card.id);
            const entryDelay = index * 18;

            if (Platform.OS === 'web') {
              return (
                <WebCard
                  key={`${person}-${card.id}`}
                  card={card}
                  isFlipped={isFlipped}
                  isSelected={isSelected}
                  onPress={() => handleCardPress(index)}
                  entryDelay={entryDelay}
                  isShuffle={person === 'B'}
                />
              );
            }

            return (
              <NativeCard
                key={`${person}-${card.id}`}
                card={card}
                isFlipped={isFlipped}
                isSelected={isSelected}
                flipAnim={flipAnims[index]}
                revealDelay={entryDelay}
                onPress={() => handleCardPress(index)}
              />
            );
          })}
        </View>

        {/* 확인 버튼 */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: selectedCount === 3 ? accentColor : '#DDD8CE' },
          ]}
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={selectedCount < 3}
        >
          <Text style={styles.confirmButtonText}>
            {selectedCount === 3
              ? person === 'A' ? '두 번째 사람 선택으로 →' : '커플 코칭 결과 보기 →'
              : `${selectedCount} / 3 선택됨`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F2EFE7', alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, fontWeight: '600', color: '#5F4B3B' },
  personBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  personBadgeText: { fontSize: 13, fontWeight: '700' },
  stepBadgeRow: { alignItems: 'center', marginBottom: 8 },
  stepBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4 },
  stepBadgeText: { fontSize: 12, fontWeight: '600' },
  colorFlowBanner: {
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12, gap: 6,
  },
  colorFlowTitle: { fontSize: 12, fontWeight: '700' },
  colorFlowRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  colorFlowItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  colorFlowDot: { width: 16, height: 16, borderRadius: 8 },
  colorFlowName: { fontSize: 12, fontWeight: '600' },
  colorFlowDesc: { fontSize: 12, lineHeight: 18, color: '#8A7A68' },
  titleArea: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#3D3530', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#5F4B3B', textAlign: 'center' },
  slotsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  slotWrapper: { flex: 1, alignItems: 'center', gap: 4 },
  slot: {
    width: '100%', aspectRatio: 0.65, borderRadius: 14,
    borderWidth: 2.5, alignItems: 'center', justifyContent: 'center',
    padding: 8, gap: 5,
  },
  slotColorDot: {
    width: 38, height: 38, borderRadius: 19, marginBottom: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35, shadowRadius: 4, elevation: 5,
  },
  slotCardName: { fontSize: 13, fontWeight: '800', textAlign: 'center', color: '#3D3530', letterSpacing: -0.2 },
  slotShapeName: { fontSize: 11, fontWeight: '600', textAlign: 'center', color: '#5F4B3B' },
  slotEmpty: { fontSize: 22, fontWeight: '200', color: '#8A7A68' },
  slotLabel: { textAlign: 'center', lineHeight: 14, fontWeight: '600', fontSize: 10 },
  progressText: { textAlign: 'center', fontSize: 13, color: '#5F4B3B', marginBottom: 16, lineHeight: 20 },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start', marginBottom: 24 },
  cardFace: { borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardBack: {
    backgroundColor: CARD_BACK_COLOR, borderWidth: 1.5, borderColor: CARD_BACK_BORDER,
    shadowColor: '#9A8E7E', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22, shadowRadius: 5, elevation: 4,
  },
  cardBackContent: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  cardBackSymbol: { fontSize: 16, color: CARD_BACK_SYMBOL_COLOR },
  cardBackHint: { fontSize: 9, color: CARD_BACK_SYMBOL_COLOR, textAlign: 'center', lineHeight: 13 },
  shapeSymbol: { fontSize: 24, marginBottom: 2 },
  cardFrontColorName: { fontSize: 8, fontWeight: '700' },
  confirmButton: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
