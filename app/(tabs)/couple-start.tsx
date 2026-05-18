/**
 * 커플 세션 시작 화면
 * 관계 유형, 성별(A/B), 종교(A/B) 선택
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Animated, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RelationType, GenderType, FaithType } from '@/constants/coupleData';

const RELATION_TYPES: { value: RelationType; label: string; emoji: string }[] = [
  { value: '연인', label: '연인', emoji: '💑' },
  { value: '부부', label: '부부', emoji: '👫' },
  { value: '친구', label: '친구', emoji: '🤝' },
  { value: '부모-자녀', label: '부모-자녀', emoji: '👨‍👧' },
  { value: '형제자매', label: '형제자매', emoji: '👭' },
  { value: '동료', label: '동료', emoji: '🌿' },
];

const GENDERS: { value: GenderType; label: string }[] = [
  { value: '남성', label: '남성' },
  { value: '여성', label: '여성' },
  { value: '기타', label: '기타' },
];

const FAITHS: { value: FaithType; label: string }[] = [
  { value: '기독교', label: '기독교' },
  { value: '무교', label: '무교' },
  { value: '기타', label: '기타' },
];

export default function CoupleStartScreen() {
  const router = useRouter();
  const colors = useColors();

  const [relationType, setRelationType] = useState<RelationType | null>(null);
  const [genderA, setGenderA] = useState<GenderType | null>(null);
  const [faithA, setFaithA] = useState<FaithType | null>(null);
  const [genderB, setGenderB] = useState<GenderType | null>(null);
  const [faithB, setFaithB] = useState<FaithType | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const canProceed = relationType && genderA && faithA && genderB && faithB;

  const handleStart = async () => {
    if (!canProceed) return;
    // 커플 세션 초기 데이터 저장
    const sessionData = {
      relationType,
      personA: { info: { gender: genderA, faith: faithA }, colors: [], cards: [] },
      personB: { info: { gender: genderB, faith: faithB }, colors: [], cards: [] },
    };
    await AsyncStorage.setItem('@couple_session', JSON.stringify(sessionData));
    router.push({ pathname: '/(tabs)/couple-select', params: { person: 'A' } } as any);
  };

  const renderChip = (
    label: string,
    isSelected: boolean,
    onPress: () => void,
    emoji?: string
  ) => (
    <Pressable
      key={label}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: isSelected ? colors.primary : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
        },
        pressed && { opacity: 0.8 },
      ]}
      onPress={onPress}
    >
      {emoji && <Text style={styles.chipEmoji}>{emoji}</Text>}
      <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backBtnText, { color: colors.muted }]}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.foreground }]}>커플 세션</Text>
              <Text style={[styles.subtitle, { color: colors.muted }]}>
                서로를 이해하는 감성 심리코칭
              </Text>
            </View>
          </View>

          {/* 안내 문구 */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              두 사람이 각자 컬러를 선택하고,{'\n'}
              서로의 마음 흐름과 관계 패턴을 함께 살펴봅니다.{'\n'}
              누가 맞고 틀린 것이 아닌,{'\n'}
              서로를 이해하는 시간입니다.
            </Text>
          </View>

          {/* 관계 유형 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>관계 유형</Text>
            <View style={styles.chipRow}>
              {RELATION_TYPES.map(r =>
                renderChip(r.label, relationType === r.value, () => setRelationType(r.value), r.emoji)
              )}
            </View>
          </View>

          {/* A 정보 */}
          <View style={[styles.personSection, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={[styles.personBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.personBadgeText, { color: colors.primary }]}>첫 번째 사람</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>성별</Text>
            <View style={styles.chipRow}>
              {GENDERS.map(g =>
                renderChip(g.label, genderA === g.value, () => setGenderA(g.value))
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>종교</Text>
            <View style={styles.chipRow}>
              {FAITHS.map(f =>
                renderChip(f.label, faithA === f.value, () => setFaithA(f.value))
              )}
            </View>
          </View>

          {/* B 정보 */}
          <View style={[styles.personSection, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={[styles.personBadge, { backgroundColor: colors.sage + '30' }]}>
              <Text style={[styles.personBadgeText, { color: colors.sage }]}>두 번째 사람</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>성별</Text>
            <View style={styles.chipRow}>
              {GENDERS.map(g =>
                renderChip(g.label, genderB === g.value, () => setGenderB(g.value))
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>종교</Text>
            <View style={styles.chipRow}>
              {FAITHS.map(f =>
                renderChip(f.label, faithB === f.value, () => setFaithB(f.value))
              )}
            </View>
          </View>

          {/* 시작 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.startBtn,
              { backgroundColor: canProceed ? colors.primary : colors.border },
              pressed && canProceed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleStart}
            disabled={!canProceed}
          >
            <Text style={[styles.startBtnText, { color: canProceed ? '#fff' : colors.muted }]}>
              첫 번째 사람 시작하기 →
            </Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, fontWeight: '600' },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  infoCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24,
  },
  infoText: { fontSize: 13, lineHeight: 22, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, letterSpacing: 0.2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 14, fontWeight: '500' },
  personSection: {
    borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20,
  },
  personBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, marginBottom: 14,
  },
  personBadgeText: { fontSize: 12, fontWeight: '600' },
  startBtn: {
    paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8,
  },
  startBtnText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
});
