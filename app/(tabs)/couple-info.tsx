import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import type { CoupleSessionData, FaithType, GenderType, RelationType } from '@/constants/coupleData';

const GENDERS: { value: GenderType; label: string }[] = [
  { value: '남성', label: '남성' },
  { value: '여성', label: '여성' },
];

const FAITHS: { value: FaithType; label: string }[] = [
  { value: '기독교', label: '기독교' },
  { value: '무교', label: '무교' },
  { value: '기타', label: '기타' },
];

const RELATION_LABELS: Record<RelationType, string> = {
  연인: '연인 관계',
  부부: '부부 관계',
  친구: '친구 관계',
  '부모-자녀': '부모 · 자녀 관계',
  '아빠-아들': '아빠 · 아들 관계',
  '아빠-딸': '아빠 · 딸 관계',
  '엄마-아들': '엄마 · 아들 관계',
  '엄마-딸': '엄마 · 딸 관계',
  형제자매: '형제자매 관계',
  동료: '직장동료 관계',
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function CoupleInfoScreen() {
  const router = useRouter();
  const colors = useColors();
  const { relationType: relationTypeParam } = useLocalSearchParams<{ relationType?: string | string[] }>();
  const relationType = getSingleParam(relationTypeParam) as RelationType | undefined;
  const relationLabel = relationType ? RELATION_LABELS[relationType] : undefined;
  const [genderA, setGenderA] = useState<GenderType | null>(null);
  const [faithA, setFaithA] = useState<FaithType | null>(null);
  const [genderB, setGenderB] = useState<GenderType | null>(null);
  const [faithB, setFaithB] = useState<FaithType | null>(null);

  const canProceed = Boolean(relationType && relationLabel && genderA && faithA && genderB && faithB);

  const renderChip = (label: string, selected: boolean, onPress: () => void) => (
    <Pressable
      key={label}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? colors.primary : '#F0EAE0', borderColor: selected ? colors.primary : '#C4A882' },
        pressed && { opacity: 0.8 },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : '#4A3020' }]}>{label}</Text>
    </Pressable>
  );

  const handleStart = async () => {
    if (!canProceed || !relationType || !genderA || !faithA || !genderB || !faithB) return;
    const sessionData: CoupleSessionData = {
      relationType,
      personA: { info: { gender: genderA, faith: faithA }, colors: [], cards: [] },
      personB: { info: { gender: genderB, faith: faithB }, colors: [], cards: [] },
    };
    await AsyncStorage.setItem('@couple_session', JSON.stringify(sessionData));
    router.push({ pathname: '/(tabs)/couple-select', params: { person: 'A' } } as any);
  };

  if (!relationLabel) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <View style={styles.invalidState}>
          <Text style={[styles.invalidText, { color: colors.muted }]}>관계 상품을 먼저 선택해 주세요.</Text>
          <Pressable style={[styles.invalidButton, { backgroundColor: colors.primary }]} onPress={() => router.replace('/(tabs)/couple-start' as any)}>
            <Text style={styles.invalidButtonText}>관계 상품 선택으로 돌아가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: colors.muted }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: '#2D2420' }]}>{relationLabel} 정보 입력</Text>
          <Text style={[styles.subtitle, { color: '#5F4B3B' }]}>두 사람의 기본 정보를 입력한 뒤{`\n`}기존 컬러 선택 과정으로 이어집니다.</Text>
        </View>

        <View style={[styles.personSection, { borderColor: '#4A3A30', backgroundColor: '#2A2420' }]}>
          <Text style={[styles.personBadge, { color: colors.primary }]}>첫 번째 사람</Text>
          <Text style={[styles.sectionTitle, { color: '#F0E8DC' }]}>성별</Text>
          <View style={styles.chipRow}>{GENDERS.map((gender) => renderChip(gender.label, genderA === gender.value, () => setGenderA(gender.value)))}</View>
          <Text style={[styles.sectionTitle, { color: '#F0E8DC', marginTop: 18 }]}>종교</Text>
          <View style={styles.chipRow}>{FAITHS.map((faith) => renderChip(faith.label, faithA === faith.value, () => setFaithA(faith.value)))}</View>
        </View>

        <View style={[styles.personSection, { borderColor: '#3A4A3A', backgroundColor: '#222A22' }]}>
          <Text style={[styles.personBadge, { color: '#7EC8A4' }]}>두 번째 사람</Text>
          <Text style={[styles.sectionTitle, { color: '#E0F0E4' }]}>성별</Text>
          <View style={styles.chipRow}>{GENDERS.map((gender) => renderChip(gender.label, genderB === gender.value, () => setGenderB(gender.value)))}</View>
          <Text style={[styles.sectionTitle, { color: '#E0F0E4', marginTop: 18 }]}>종교</Text>
          <View style={styles.chipRow}>{FAITHS.map((faith) => renderChip(faith.label, faithB === faith.value, () => setFaithB(faith.value)))}</View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.startButton, { backgroundColor: canProceed ? colors.primary : colors.border }, pressed && canProceed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          onPress={handleStart}
          disabled={!canProceed}
        >
          <Text style={[styles.startButtonText, { color: canProceed ? '#FFFFFF' : colors.muted }]}>첫 번째 사람 컬러 선택하기 →</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 44 },
  header: { alignItems: 'center', marginBottom: 26 },
  backButton: { position: 'absolute', left: 0, top: 0, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 18, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', marginTop: 5, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  personSection: { borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 18 },
  personBadge: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '800', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 14, fontWeight: '600' },
  startButton: { borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginTop: 6 },
  startButtonText: { fontSize: 16, fontWeight: '700' },
  invalidState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  invalidText: { fontSize: 16, textAlign: 'center' },
  invalidButton: { borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14 },
  invalidButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
