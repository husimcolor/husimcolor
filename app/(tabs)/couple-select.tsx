/**
 * 커플 세션 컬러 선택 화면
 * premium-color-select.tsx와 동일한 UX: 3슬롯 미리보기 + 자유 선택
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Dimensions, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR_DATA, type ColorData } from '@/constants/colorData';
import type { CoupleSessionData } from '@/constants/coupleData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWATCH_SIZE = (SCREEN_WIDTH - 48 - 24) / 5;

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

function getSwatchTextShadow(hex: string): object {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness >= 190) {
    return { textShadowColor: 'rgba(255,255,255,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 };
  }
  return { textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 };
}

export default function CoupleSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { person } = useLocalSearchParams<{ person: 'A' | 'B' }>();
  const personLabel = person === 'A' ? '첫 번째 사람' : '두 번째 사람';
  const accentColor = person === 'A' ? '#3D6B3D' : '#7B5EA7';
  const accentBg = person === 'A' ? '#8BAF8B11' : '#7B5EA711';
  const accentBorder = person === 'A' ? '#8BAF8B55' : '#7B5EA755';

  // B 진입 시 항상 빈 배열로 초기화 (person 파라미터 변경 시 재초기화)
  const [selectedColors, setSelectedColors] = useState<ColorData[]>([]);
  const [sessionData, setSessionData] = useState<CoupleSessionData | null>(null);

  useEffect(() => {
    // person이 바뀔 때마다 선택 상태 완전 초기화
    setSelectedColors([]);
    AsyncStorage.getItem('@couple_session').then(raw => {
      if (raw) setSessionData(JSON.parse(raw));
    });
  }, [person]);

  const handleColorToggle = (color: ColorData) => {
    setSelectedColors(prev => {
      const exists = prev.find(c => c.id === color.id);
      if (exists) return prev.filter(c => c.id !== color.id);
      if (prev.length >= 3) {
        Alert.alert('3가지 컬러를 선택해 주세요', '이미 3가지 컬러를 선택하셨습니다.\n변경하려면 선택된 컬러를 먼저 해제해 주세요.');
        return prev;
      }
      return [...prev, color];
    });
  };

  const handleConfirm = async () => {
    if (selectedColors.length < 3) {
      Alert.alert('컬러 선택', '마음이 이끄는 컬러 3가지를 선택해 주세요.');
      return;
    }
    if (!sessionData) return;
    const updated = { ...sessionData };
    const colorIds = selectedColors.map(c => c.id);
    if (person === 'A') {
      updated.personA = { ...updated.personA, colors: colorIds };
    } else {
      updated.personB = { ...updated.personB, colors: colorIds };
    }
    await AsyncStorage.setItem('@couple_session', JSON.stringify(updated));
    // 컬러 선택 완료 → 컬러 해석 중간 결과 화면으로 이동
    router.push({ pathname: '/(tabs)/couple-color-result', params: { person } } as any);
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
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
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
            <Text style={[styles.stepBadgeText, { color: accentColor }]}>1단계 · 컬러 에너지 흐름</Text>
          </View>
        </View>

        {/* 타이틀 */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>마음이 이끄는 컬러를{'\n'}3가지 선택해 주세요</Text>
          <Text style={styles.subtitle}>지금 이 순간 눈길이 가는 컬러를{'\n'}직관적으로 선택해 주세요</Text>
        </View>

        {/* 선택된 컬러 미리보기 슬롯 */}
        <View style={styles.selectedPreview}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.selectedSlot,
                {
                  backgroundColor: selectedColors[i] ? selectedColors[i].hex : '#F2EFE7',
                  borderColor: selectedColors[i] ? selectedColors[i].hex : '#DDD8CE',
                  borderStyle: selectedColors[i] ? 'solid' : 'dashed',
                },
              ]}
            >
              {selectedColors[i] ? (
                <Text style={styles.selectedSlotText}>{selectedColors[i].korName}</Text>
              ) : (
                <Text style={styles.selectedSlotEmpty}>{i + 1}번</Text>
              )}
            </View>
          ))}
        </View>

        {/* 컬러 팔레트 */}
        <View style={styles.paletteContainer}>
          <View style={styles.paletteGrid}>
            {COLOR_DATA.map(color => {
              const isSelected = selectedColors.some(c => c.id === color.id);
              const selectedIndex = selectedColors.findIndex(c => c.id === color.id);
              return (
                <TouchableOpacity
                  key={color.id}
                  style={[
                    styles.swatch,
                    { backgroundColor: color.hex },
                    getLightColorBorder(color.hex),
                    isSelected && styles.swatchSelected,
                  ]}
                  onPress={() => handleColorToggle(color)}
                  activeOpacity={0.75}
                >
                  {isSelected && (
                    <View style={styles.swatchBadge}>
                      <Text style={styles.swatchBadgeText}>{selectedIndex + 1}</Text>
                    </View>
                  )}
                  <Text style={[
                    styles.swatchLabel,
                    { color: getSwatchTextColor(color.hex), ...getSwatchTextShadow(color.hex) },
                  ]}>
                    {color.korName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 확인 버튼 */}
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            {
              backgroundColor: selectedColors.length === 3 ? accentColor : '#F2EFE7',
              borderColor: selectedColors.length === 3 ? accentColor : '#DDD8CE',
            },
          ]}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <Text style={[
            styles.confirmBtnText,
            { color: selectedColors.length === 3 ? '#fff' : '#8A7A68' },
          ]}>
            {selectedColors.length === 3
              ? '🌿 컬러 선택 완료 · 다음 단계로'
              : `${selectedColors.length} / 3 컬러 선택 중`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2EFE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, fontWeight: '600', color: '#5F4B3B' },
  personBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  personBadgeText: { fontSize: 13, fontWeight: '700' },
  stepBadgeRow: { alignItems: 'center', marginBottom: 8 },
  stepBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stepBadgeText: { fontSize: 12, fontWeight: '600' },
  titleArea: { alignItems: 'center', marginBottom: 20 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3D3530',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#5F4B3B',
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedPreview: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  selectedSlot: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSlotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectedSlotEmpty: { fontSize: 16, fontWeight: '200', color: '#8A7A68' },
  paletteContainer: { marginBottom: 24 },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    overflow: 'hidden',
  },
  swatchSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    transform: [{ scale: 1.05 }],
  },
  swatchBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchBadgeText: { fontSize: 10, fontWeight: '800', color: '#333' },
  swatchLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  confirmBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '700' },
});
