/**
 * 커플 세션 카드 해석 중간 결과 화면
 * - 2단계 심리카드 3장 선택 후 개인별 카드 해석 표시
 * - 1번: 무의식·내면 에너지 / 2번: 현재 현실 에너지 / 3번: 미래·회복·희망 에너지
 * - A 완료 후 → B 컬러 선택으로 이동
 * - B 완료 후 → 커플 통합 결과로 이동
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CARD_DATA } from '@/constants/cardData';
import type { CoupleSessionData } from '@/constants/coupleData';

const POSITION_LABELS = ['무의식 · 내면 에너지', '현재 현실 에너지', '미래 · 회복 · 희망 에너지'];
const POSITION_DESCS = [
  '지금 의식하지 못하는 내면 깊은 곳의 에너지입니다.',
  '현재 현실에서 드러나는 심리 흐름입니다.',
  '앞으로 회복하고 나아갈 방향의 에너지입니다.',
];
const POSITION_COLORS = ['#3D6B3D', '#B5A0C8', '#C4956A'];

export default function CoupleCardResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { person } = useLocalSearchParams<{ person: 'A' | 'B' }>();
  const personLabel = person === 'A' ? '첫 번째 사람' : '두 번째 사람';
  const accentColor = person === 'A' ? '#3D6B3D' : '#7B5EA7';
  const accentBg = person === 'A' ? '#F0F5F0' : '#F5F0FA';
  const accentBorder = person === 'A' ? '#8BAF8B55' : '#7B5EA755';

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState<{ id: string; colorKor: string; colorHex: string; shapeKor: string; shapeSymbol: string; psychologyFlow: string; personalityFlow: string; recoveryDirection: string }[]>([]);
  const [prevColors, setPrevColors] = useState<{ korName: string; hex: string }[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('@couple_session').then(raw => {
      if (!raw) return;
      const data: CoupleSessionData = JSON.parse(raw);
      const session = person === 'A' ? data.personA : data.personB;
      if (!session?.cards?.length) return;

      // 선택된 카드 정보
      const cards = session.cards
        .map(id => CARD_DATA.find(c => c.id === id))
        .filter(Boolean) as typeof CARD_DATA;
      setSelectedCards(cards.map(c => ({
        id: c.id,
        colorKor: c.colorKor,
        colorHex: c.colorHex,
        shapeKor: c.shapeKor,
        shapeSymbol: c.shapeSymbol,
        psychologyFlow: c.psychologyFlow,
        personalityFlow: c.personalityFlow,
        recoveryDirection: c.recoveryDirection,
      })));

      // 이전 단계 컬러
      const colorIds = session.colors ?? [];
      const { COLOR_DATA } = require('@/constants/colorData');
      const colors = colorIds.map((id: string) => COLOR_DATA.find((c: any) => c.id === id)).filter(Boolean);
      setPrevColors(colors.map((c: any) => ({ korName: c.korName, hex: c.hex })));

      setIsLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    });
  }, [person]);

  const handleNext = () => {
    if (person === 'A') {
      // A 완료 → B 컬러 선택으로
      router.push({ pathname: '/(tabs)/couple-select', params: { person: 'B' } } as any);
    } else {
      // B 완료 → 커플 통합 결과로
      router.push('/(tabs)/couple-result' as any);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🌿 카드 에너지를 읽는 중...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const readings = [
    selectedCards[0]?.psychologyFlow,
    selectedCards[1]?.personalityFlow,
    selectedCards[2]?.recoveryDirection,
  ];

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <View style={[styles.personBadge, { backgroundColor: accentBg, borderColor: accentBorder }]}>
              <Text style={[styles.personBadgeText, { color: accentColor }]}>{personLabel}</Text>
            </View>
          </View>

          {/* 단계 배지 */}
          <View style={styles.stepBadgeRow}>
            <View style={[styles.stepBadge, { backgroundColor: accentBg, borderColor: accentBorder }]}>
              <Text style={[styles.stepBadgeText, { color: accentColor }]}>2단계 · 심리카드 에너지 해석</Text>
            </View>
          </View>

          {/* 타이틀 */}
          <View style={styles.titleArea}>
            <Text style={styles.title}>심리카드 에너지 흐름</Text>
            <Text style={styles.subtitle}>선택한 카드가 말해주는 내면의 에너지 흐름입니다</Text>
          </View>

          {/* 이전 단계 컬러 요약 */}
          {prevColors.length > 0 && (
            <View style={[styles.prevColorBanner, { backgroundColor: accentBg, borderColor: accentBorder }]}>
              <Text style={[styles.prevColorTitle, { color: accentColor }]}>🌿 1단계 컬러 흐름</Text>
              <View style={styles.prevColorRow}>
                {prevColors.map((c, i) => (
                  <View key={i} style={styles.prevColorItem}>
                    <View style={[styles.prevColorDot, { backgroundColor: c.hex }]} />
                    <Text style={[styles.prevColorName, { color: accentColor }]}>{c.korName}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 선택된 카드 3장 + 해석 */}
          {selectedCards.map((card, i) => (
            <View key={card.id} style={[styles.cardSection, { borderColor: POSITION_COLORS[i] + '44' }]}>
              {/* 카드 헤더 */}
              <View style={styles.cardHeader}>
                <View style={[styles.cardVisual, { backgroundColor: card.colorHex }]}>
                  <Text style={[styles.cardShape, {
                    color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.92)',
                  }]}>{card.shapeSymbol}</Text>
                  <Text style={[styles.cardColorName, {
                    color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.95)',
                  }]}>{card.colorKor}</Text>
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={[styles.positionLabel, { color: POSITION_COLORS[i] }]}>
                    {i + 1}번 · {POSITION_LABELS[i]}
                  </Text>
                  <Text style={styles.cardName}>{card.colorKor} · {card.shapeKor}</Text>
                  <Text style={styles.positionDesc}>{POSITION_DESCS[i]}</Text>
                </View>
              </View>
              {/* 해석 */}
              <View style={[styles.readingBox, { backgroundColor: POSITION_COLORS[i] + '0D' }]}>
                <Text style={styles.readingText}>{readings[i]}</Text>
              </View>
            </View>
          ))}

          {/* 다음 단계 안내 */}
          <View style={[styles.nextHint, { backgroundColor: accentBg, borderColor: accentBorder }]}>
            {person === 'A' ? (
              <>
                <Text style={[styles.nextHintTitle, { color: accentColor }]}>🌿 다음 단계</Text>
                <Text style={styles.nextHintText}>
                  첫 번째 사람의 컬러와 카드 흐름을 확인했습니다.{'\n'}
                  이제 두 번째 사람이 같은 방식으로 진행합니다.
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.nextHintTitle, { color: accentColor }]}>🌿 마지막 단계</Text>
                <Text style={styles.nextHintText}>
                  두 사람의 컬러와 카드 흐름을 모두 확인했습니다.{'\n'}
                  이제 두 사람의 관계 에너지를 통합 해석합니다.
                </Text>
              </>
            )}
          </View>

          {/* 다음 버튼 */}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: accentColor }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {person === 'A' ? '🌿 두 번째 사람 시작하기 →' : '🌿 커플 통합 결과 보기 →'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#5F4B3B' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
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
  titleArea: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#3D3530', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#5F4B3B', textAlign: 'center', lineHeight: 22 },
  prevColorBanner: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16, gap: 8 },
  prevColorTitle: { fontSize: 12, fontWeight: '700' },
  prevColorRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  prevColorItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prevColorDot: { width: 18, height: 18, borderRadius: 9 },
  prevColorName: { fontSize: 12, fontWeight: '600' },
  cardSection: {
    borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 14, gap: 12,
    backgroundColor: '#FAFAF8',
  },
  cardHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  cardVisual: {
    width: 64, height: 88, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 5, elevation: 4,
  },
  cardShape: { fontSize: 22 },
  cardColorName: { fontSize: 9, fontWeight: '700' },
  cardHeaderInfo: { flex: 1, gap: 4 },
  positionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#3D3530' },
  positionDesc: { fontSize: 12, color: '#5F4B3B', lineHeight: 18 },
  readingBox: { borderRadius: 10, padding: 12 },
  readingText: { fontSize: 14, color: '#3D3530', lineHeight: 22 },
  nextHint: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, gap: 6 },
  nextHintTitle: { fontSize: 12, fontWeight: '700' },
  nextHintText: { fontSize: 13, color: '#5F4B3B', lineHeight: 21 },
  nextBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 8 },
  nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
