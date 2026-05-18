/**
 * 커플 세션 컬러 선택 화면
 * A 또는 B가 컬러 3장 + 카드 3장 선택
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Dimensions, Animated, TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR_DATA, type ColorData } from '@/constants/colorData';
import { CARD_DATA } from '@/constants/cardData';
import type { CoupleSessionData } from '@/constants/coupleData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWATCH_SIZE = (SCREEN_WIDTH - 48 - 24) / 5;

const CARD_INFO = [
  { step: 0, number: '1', title: '무의식적 관계 패턴', subtitle: '마음 깊은 곳에서 자연스럽게 끌리는 색을 선택하세요', accentColor: '#5B8DB8' },
  { step: 1, number: '2', title: '현재 감정 흐름', subtitle: '지금 이 순간 나의 상태와 가장 가까운 색을 선택하세요', accentColor: '#E05A4E' },
  { step: 2, number: '3', title: '회복 방향', subtitle: '지금 당신에게 필요한 에너지의 색을 선택하세요', accentColor: '#8FA68E' },
];

function getLightColorBorder(hex: string): object {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 200 ? { borderWidth: 1.5, borderColor: '#C8BFB0' } : {};
}

function getSwatchTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 190 ? '#5F4B3B' : '#FFFFFF';
}

export default function CoupleSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const { person } = useLocalSearchParams<{ person: 'A' | 'B' }>();
  const personLabel = person === 'A' ? '첫 번째 사람' : '두 번째 사람';

  const [step, setStep] = useState(0); // 0,1,2 = 컬러 선택 단계
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sessionData, setSessionData] = useState<CoupleSessionData | null>(null);

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

  const currentCard = CARD_INFO[step];
  const alreadySelected = selectedColors.slice(0, step);

  const handleColorSelect = async (colorId: string) => {
    if (alreadySelected.includes(colorId)) return;
    const newSelected = [...selectedColors.slice(0, step), colorId];
    setSelectedColors(newSelected);

    if (step < 2) {
      setStep(step + 1);
    } else {
      // 3장 모두 선택 완료 → 카드 선택으로 이동
      if (!sessionData) return;
      const updated = { ...sessionData };
      if (person === 'A') {
        updated.personA = { ...updated.personA, colors: newSelected };
      } else {
        updated.personB = { ...updated.personB, colors: newSelected };
      }
      await AsyncStorage.setItem('@couple_session', JSON.stringify(updated));
      router.push({ pathname: '/(tabs)/couple-card-select', params: { person } } as any);
    }
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            onPress={() => {
              if (step > 0) setStep(step - 1);
              else router.back();
            }}
          >
            <Text style={[styles.backBtnText, { color: colors.muted }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <View style={[styles.personBadge, { backgroundColor: person === 'A' ? colors.primary + '20' : colors.sage + '30' }]}>
              <Text style={[styles.personBadgeText, { color: person === 'A' ? colors.primary : colors.sage }]}>
                {personLabel}
              </Text>
            </View>
            <Text style={[styles.stepText, { color: colors.muted }]}>
              {step + 1} / 3 컬러 선택
            </Text>
          </View>
        </View>

        {/* 진행 바 */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((step + 1) / 3) * 100}%` }]} />
        </View>

        {/* 카드 안내 */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.cardInfo, { borderLeftColor: currentCard.accentColor, backgroundColor: colors.surface }]}>
            <Text style={[styles.cardNumber, { color: currentCard.accentColor }]}>
              {currentCard.number}번 카드
            </Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {currentCard.title}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
              {currentCard.subtitle}
            </Text>
          </View>

          {/* 이미 선택한 컬러 표시 */}
          {alreadySelected.length > 0 && (
            <View style={styles.selectedRow}>
              {alreadySelected.map((id, i) => {
                const c = COLOR_DATA.find(x => x.id === id);
                if (!c) return null;
                return (
                  <View key={id} style={styles.selectedChip}>
                    <View style={[styles.selectedDot, { backgroundColor: c.hex }]} />
                    <Text style={[styles.selectedChipText, { color: colors.muted }]}>
                      {i + 1}. {c.korName}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* 컬러 팔레트 */}
          <View style={styles.palette}>
            {COLOR_DATA.map(item => {
              const isAlreadyPicked = alreadySelected.includes(item.id);
              const textColor = getSwatchTextColor(item.hex);
              const lightBorder = getLightColorBorder(item.hex);
              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.swatch,
                    { backgroundColor: item.hex, width: SWATCH_SIZE, height: SWATCH_SIZE },
                    lightBorder,
                    isAlreadyPicked && styles.swatchDisabled,
                    pressed && !isAlreadyPicked && { opacity: 0.8 },
                  ]}
                  onPress={() => handleColorSelect(item.id)}
                  disabled={isAlreadyPicked}
                >
                  {isAlreadyPicked && (
                    <View style={styles.swatchCheck}>
                      <Text style={styles.swatchCheckText}>✓</Text>
                    </View>
                  )}
                  <Text style={[styles.swatchLabel, { color: textColor }]} numberOfLines={1}>
                    {item.korName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
  cardInfo: {
    borderLeftWidth: 4, borderRadius: 12, padding: 16, marginBottom: 16,
    gap: 4,
  },
  cardNumber: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSubtitle: { fontSize: 13, lineHeight: 20 },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectedDot: { width: 12, height: 12, borderRadius: 6 },
  selectedChipText: { fontSize: 12 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  swatch: {
    borderRadius: 10, alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: 4, overflow: 'hidden',
  },
  swatchDisabled: { opacity: 0.35 },
  swatchCheck: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  swatchCheckText: { fontSize: 10, fontWeight: '700', color: '#333' },
  swatchLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
});
