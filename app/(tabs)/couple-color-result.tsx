/**
 * 커플 세션 컬러 해석 중간 결과 화면
 * - 1단계 컬러 3장 선택 후 개인별 컬러 해석 표시
 * - 심리 흐름 / 현재 감정 흐름 / 회복 방향 / 관계 성향 / 감정 표현 방식
 * - 확인 후 2단계 심리카드 선택으로 이동
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
import { COLOR_DATA } from '@/constants/colorData';
import {
  generatePersonAnalysis,
  type CoupleSessionData,
  type PersonAnalysis,
} from '@/constants/coupleData';

export default function CoupleColorResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { person } = useLocalSearchParams<{ person: 'A' | 'B' }>();
  const personLabel = person === 'A' ? '첫 번째 사람' : '두 번째 사람';
  const accentColor = person === 'A' ? '#3D6B3D' : '#7B5EA7';
  const accentBg = person === 'A' ? '#F0F5F0' : '#F5F0FA';
  const accentBorder = person === 'A' ? '#8BAF8B55' : '#7B5EA755';

  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<PersonAnalysis | null>(null);
  const [selectedColors, setSelectedColors] = useState<{ id: string; korName: string; hex: string }[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('@couple_session').then(raw => {
      if (!raw) return;
      const data: CoupleSessionData = JSON.parse(raw);
      const session = person === 'A' ? data.personA : data.personB;
      if (!session?.colors?.length) return;

      // 선택된 컬러 정보
      const colors = session.colors
        .map(id => COLOR_DATA.find(c => c.id === id))
        .filter(Boolean) as typeof COLOR_DATA;
      setSelectedColors(colors.map(c => ({ id: c.id, korName: c.korName, hex: c.hex })));

      // 컬러 기반 개인 분석 생성
      const result = generatePersonAnalysis(session, person as 'A' | 'B');
      setAnalysis(result);
      setIsLoading(false);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });
  }, [person]);

  const handleNext = () => {
    router.push({ pathname: '/(tabs)/couple-card-select', params: { person } } as any);
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🌿 컬러 흐름을 읽는 중...</Text>
        </View>
      </ScreenContainer>
    );
  }

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
              <Text style={[styles.stepBadgeText, { color: accentColor }]}>1단계 · 컬러 에너지 해석</Text>
            </View>
          </View>

          {/* 타이틀 */}
          <View style={styles.titleArea}>
            <Text style={styles.title}>컬러 에너지 흐름</Text>
            <Text style={styles.subtitle}>선택한 컬러가 말해주는 지금의 심리 흐름입니다</Text>
          </View>

          {/* 선택된 컬러 3장 */}
          <View style={styles.colorRow}>
            {selectedColors.map((c, i) => (
              <View key={c.id} style={styles.colorItem}>
                <View style={[styles.colorCircle, { backgroundColor: c.hex }]} />
                <Text style={styles.colorName}>{c.korName}</Text>
                <Text style={[styles.colorOrder, { color: accentColor }]}>{i + 1}번</Text>
              </View>
            ))}
          </View>

          {/* 해석 카드들 */}
          {analysis && (
            <>
              {/* 심리 흐름 */}
              <View style={[styles.card, { borderColor: accentBorder, backgroundColor: accentBg }]}>
                <Text style={[styles.cardLabel, { color: accentColor }]}>🌿 현재 심리 흐름</Text>
                <Text style={styles.cardContent}>{analysis.psychologyFlow}</Text>
              </View>

              {/* 현재 감정 흐름 */}
              <View style={[styles.card, { borderColor: accentBorder, backgroundColor: accentBg }]}>
                <Text style={[styles.cardLabel, { color: accentColor }]}>🎨 현재 감정 흐름</Text>
                <Text style={styles.cardContent}>{analysis.currentFlow}</Text>
              </View>

              {/* 회복 방향 */}
              <View style={[styles.card, { borderColor: accentBorder, backgroundColor: accentBg }]}>
                <Text style={[styles.cardLabel, { color: accentColor }]}>🌱 회복 방향</Text>
                <Text style={styles.cardContent}>{analysis.recoveryDirection}</Text>
              </View>

              {/* 관계 성향 */}
              <View style={[styles.card, { borderColor: accentBorder, backgroundColor: accentBg }]}>
                <Text style={[styles.cardLabel, { color: accentColor }]}>💚 관계 성향</Text>
                <Text style={styles.cardContent}>{analysis.relationshipStyle}</Text>
              </View>

              {/* 감정 표현 방식 */}
              <View style={[styles.card, { borderColor: accentBorder, backgroundColor: accentBg }]}>
                <Text style={[styles.cardLabel, { color: accentColor }]}>🧩 감정 표현 방식</Text>
                <Text style={styles.cardContent}>{analysis.emotionExpression}</Text>
              </View>

              {/* 코칭 메시지 */}
              <View style={[styles.coachingCard, { borderColor: accentColor + '44', backgroundColor: accentColor + '11' }]}>
                <Text style={[styles.coachingLabel, { color: accentColor }]}>🌿 코칭 메시지</Text>
                <Text style={[styles.coachingContent, { color: '#3D3530' }]}>{analysis.coachingMessage}</Text>
              </View>

              {/* 보완 컬러 */}
              <View style={[styles.complementCard, { borderColor: accentBorder }]}>
                <Text style={[styles.complementLabel, { color: accentColor }]}>✨ 보완 컬러 제안</Text>
                <View style={styles.complementRow}>
                  <View style={[styles.complementCircle, { backgroundColor: analysis.complementColor.hex }]} />
                  <View style={styles.complementInfo}>
                    <Text style={styles.complementName}>{analysis.complementColor.korName}</Text>
                    <Text style={styles.complementMeaning}>{analysis.complementColor.meaning}</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* 다음 단계 안내 */}
          <View style={[styles.nextHint, { backgroundColor: accentBg, borderColor: accentBorder }]}>
            <Text style={[styles.nextHintTitle, { color: accentColor }]}>🌿 다음 단계</Text>
            <Text style={styles.nextHintText}>
              이 컬러 흐름을 바탕으로, 63장의 심리카드 중에서{'\n'}
              마음이 이끄는 카드 3장을 선택합니다.{'\n'}
              카드는 무의식·현재·미래 에너지를 읽어드립니다.
            </Text>
          </View>

          {/* 다음 버튼 */}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: accentColor }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              🌿 2단계 · 심리카드 선택으로 →
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
  titleArea: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#3D3530', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#5F4B3B', textAlign: 'center', lineHeight: 22 },
  colorRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 24 },
  colorItem: { alignItems: 'center', gap: 6 },
  colorCircle: {
    width: 56, height: 56, borderRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  colorName: { fontSize: 13, fontWeight: '700', color: '#3D3530' },
  colorOrder: { fontSize: 11, fontWeight: '600' },
  card: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12, gap: 8,
  },
  cardLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  cardContent: { fontSize: 14, color: '#3D3530', lineHeight: 22 },
  coachingCard: {
    borderRadius: 14, borderWidth: 1.5, padding: 18, marginBottom: 12, gap: 8,
  },
  coachingLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  coachingContent: { fontSize: 15, lineHeight: 24, fontWeight: '500' },
  complementCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20,
    backgroundColor: '#FAFAF8', gap: 10,
  },
  complementLabel: { fontSize: 12, fontWeight: '700' },
  complementRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  complementCircle: {
    width: 44, height: 44, borderRadius: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  complementInfo: { flex: 1, gap: 3 },
  complementName: { fontSize: 15, fontWeight: '700', color: '#3D3530' },
  complementMeaning: { fontSize: 13, color: '#5F4B3B', lineHeight: 19 },
  nextHint: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, gap: 6,
  },
  nextHintTitle: { fontSize: 12, fontWeight: '700' },
  nextHintText: { fontSize: 13, color: '#5F4B3B', lineHeight: 21 },
  nextBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 8 },
  nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
