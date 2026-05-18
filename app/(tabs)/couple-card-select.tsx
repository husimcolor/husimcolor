/**
 * 커플 세션 카드 선택 화면
 * A 또는 B가 컬러심리카드 3장 선택 (뒷면 상태에서 선택)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Dimensions, Animated, TouchableOpacity, FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CARD_DATA } from '@/constants/cardData';
import type { CoupleSessionData } from '@/constants/coupleData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 16) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const CARD_ROLES = [
  { step: 0, label: '1번 카드', role: '무의식적 관계 패턴', accentColor: '#5B8DB8' },
  { step: 1, label: '2번 카드', role: '현재 감정 흐름', accentColor: '#E05A4E' },
  { step: 2, label: '3번 카드', role: '회복 방향', accentColor: '#8FA68E' },
];

// 카드 뒷면 색상 (카드 위치별)
const BACK_COLORS = ['#5B8DB8', '#E05A4E', '#8FA68E'];

export default function CoupleCardSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const { person } = useLocalSearchParams<{ person: 'A' | 'B' }>();
  const personLabel = person === 'A' ? '첫 번째 사람' : '두 번째 사람';

  const [step, setStep] = useState(0);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [sessionData, setSessionData] = useState<CoupleSessionData | null>(null);
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('@couple_session').then(raw => {
      if (raw) setSessionData(JSON.parse(raw));
    });
  }, []);

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [step]);

  const alreadySelected = selectedCards.slice(0, step);
  const currentRole = CARD_ROLES[step];

  const handleCardSelect = async (cardId: string) => {
    if (alreadySelected.includes(cardId)) return;
    const newSelected = [...selectedCards.slice(0, step), cardId];
    setSelectedCards(newSelected);
    setFlippedId(null);

    if (step < 2) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      // 3장 모두 선택 완료
      if (!sessionData) return;
      const updated = { ...sessionData };
      if (person === 'A') {
        updated.personA = { ...updated.personA, cards: newSelected };
      } else {
        updated.personB = { ...updated.personB, cards: newSelected };
      }
      await AsyncStorage.setItem('@couple_session', JSON.stringify(updated));

      if (person === 'A') {
        // A 완료 → B 컬러 선택으로
        router.push({ pathname: '/(tabs)/couple-select', params: { person: 'B' } } as any);
      } else {
        // B 완료 → 통합 결과로
        router.push('/(tabs)/couple-result' as any);
      }
    }
  };

  // 카드 뒷면 렌더링
  const renderCard = ({ item }: { item: typeof CARD_DATA[0] }) => {
    const isAlreadyPicked = alreadySelected.includes(item.id);
    const isFlipped = flippedId === item.id;
    const backColor = BACK_COLORS[step] + 'CC';

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { width: CARD_WIDTH, height: CARD_HEIGHT },
          isAlreadyPicked && styles.cardDisabled,
          pressed && !isAlreadyPicked && { opacity: 0.8 },
        ]}
        onPress={() => {
          if (isAlreadyPicked) return;
          if (!isFlipped) {
            setFlippedId(item.id);
          } else {
            handleCardSelect(item.id);
          }
        }}
        disabled={isAlreadyPicked}
      >
        {isFlipped ? (
          // 앞면 (카드 정보 표시)
          <View style={[styles.cardFront, { backgroundColor: item.colorHex + '22', borderColor: item.colorHex }]}>
            <Text style={styles.cardShapeSymbol}>{item.shapeSymbol}</Text>
            <Text style={[styles.cardColorName, { color: item.colorHex }]}>{item.colorKor}</Text>
            <Text style={[styles.cardShapeName, { color: colors.muted }]}>{item.shapeKor}</Text>
            <Text style={[styles.cardEnergy, { color: colors.foreground }]} numberOfLines={2}>
              {item.energyTitle}
            </Text>
            <View style={[styles.selectHint, { backgroundColor: item.colorHex }]}>
              <Text style={styles.selectHintText}>선택하기</Text>
            </View>
          </View>
        ) : (
          // 뒷면
          <View style={[styles.cardBack, { backgroundColor: backColor }]}>
            {isAlreadyPicked ? (
              <Text style={styles.cardBackCheck}>✓</Text>
            ) : (
              <>
                <Text style={styles.cardBackSymbol}>✦</Text>
                <Text style={styles.cardBackHint}>탭하여{'\n'}확인</Text>
              </>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            onPress={() => {
              if (step > 0) { setStep(step - 1); setFlippedId(null); }
              else router.back();
            }}
          >
            <Text style={[styles.backBtnText, { color: colors.muted }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <View style={[styles.personBadge, { backgroundColor: person === 'A' ? colors.primary + '20' : colors.sage + '30' }]}>
              <Text style={[styles.personBadgeText, { color: person === 'A' ? colors.primary : colors.sage }]}>
                {personLabel} · 카드 선택
              </Text>
            </View>
            <Text style={[styles.stepText, { color: colors.muted }]}>
              {step + 1} / 3 카드 선택
            </Text>
          </View>
        </View>

        {/* 진행 바 */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: currentRole.accentColor, width: `${((step + 1) / 3) * 100}%` }]} />
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* 카드 역할 안내 */}
          <View style={[styles.roleCard, { borderLeftColor: currentRole.accentColor, backgroundColor: colors.surface }]}>
            <Text style={[styles.roleLabel, { color: currentRole.accentColor }]}>{currentRole.label}</Text>
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>{currentRole.role}</Text>
            <Text style={[styles.roleHint, { color: colors.muted }]}>
              카드를 탭하면 앞면이 보입니다. 마음에 드는 카드를 다시 탭하여 선택하세요.
            </Text>
          </View>

          {/* 이미 선택한 카드 */}
          {alreadySelected.length > 0 && (
            <View style={styles.selectedRow}>
              {alreadySelected.map((id, i) => {
                const c = CARD_DATA.find(x => x.id === id);
                if (!c) return null;
                return (
                  <View key={id} style={[styles.selectedChip, { backgroundColor: c.colorHex + '22' }]}>
                    <Text style={[styles.selectedChipText, { color: c.colorHex }]}>
                      {i + 1}. {c.colorKor} {c.shapeKor}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* 카드 그리드 */}
          <FlatList
            data={CARD_DATA}
            keyExtractor={item => item.id}
            numColumns={3}
            columnWrapperStyle={styles.cardRow}
            renderItem={renderCard}
            scrollEnabled={false}
            contentContainerStyle={styles.cardGrid}
          />
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, fontWeight: '600' },
  headerText: { flex: 1, gap: 4 },
  personBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  personBadgeText: { fontSize: 12, fontWeight: '600' },
  stepText: { fontSize: 13 },
  progressBar: { height: 4, borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  roleCard: { borderLeftWidth: 4, borderRadius: 12, padding: 16, marginBottom: 16, gap: 4 },
  roleLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  roleTitle: { fontSize: 17, fontWeight: '700' },
  roleHint: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  selectedChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  selectedChipText: { fontSize: 12, fontWeight: '600' },
  cardGrid: { gap: 8 },
  cardRow: { gap: 8, marginBottom: 8 },
  card: { borderRadius: 12, overflow: 'hidden' },
  cardDisabled: { opacity: 0.3 },
  cardBack: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12,
  },
  cardBackSymbol: { fontSize: 24, color: 'rgba(255,255,255,0.8)' },
  cardBackCheck: { fontSize: 28, color: 'rgba(255,255,255,0.9)' },
  cardBackHint: { fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 14 },
  cardFront: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4,
    borderRadius: 12, borderWidth: 2, padding: 8,
  },
  cardShapeSymbol: { fontSize: 28 },
  cardColorName: { fontSize: 11, fontWeight: '700' },
  cardShapeName: { fontSize: 10 },
  cardEnergy: { fontSize: 9, textAlign: 'center', lineHeight: 13 },
  selectHint: {
    marginTop: 4, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  selectHintText: { fontSize: 9, color: '#fff', fontWeight: '600' },
});
