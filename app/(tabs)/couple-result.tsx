/**
 * 커플 세션 통합 결과 화면
 * 개인 분석 40% + 관계 통합 해석 60%
 * 따뜻하고 조용한 감성 심리코칭 흐름
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated,
  TouchableOpacity, Pressable, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR_DATA } from '@/constants/colorData';
import {
  generatePersonAnalysis, generateCoupleAnalysis,
  type CoupleSessionData, type PersonAnalysis, type CoupleAnalysis,
} from '@/constants/coupleData';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

// ── 섹션 카드 컴포넌트 ────────────────────────────────────────────
function SectionCard({
  accentColor, label, title, children, colors,
}: {
  accentColor: string; label?: string; title: string;
  children: React.ReactNode; colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[sectionStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {label && (
        <Text style={[sectionStyles.label, { color: accentColor }]}>{label}</Text>
      )}
      <Text style={[sectionStyles.title, { color: colors.foreground }]}>{title}</Text>
      <View style={[sectionStyles.divider, { backgroundColor: accentColor + '40' }]} />
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 16, gap: 8,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  title: { fontSize: 17, fontWeight: '700', lineHeight: 24 },
  divider: { height: 1.5, borderRadius: 1, marginVertical: 4 },
});

// ── 메인 화면 ─────────────────────────────────────────────────────
export default function CoupleResultScreen() {
  const router = useRouter();
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<CoupleSessionData | null>(null);
  const [analysisA, setAnalysisA] = useState<PersonAnalysis | null>(null);
  const [analysisB, setAnalysisB] = useState<PersonAnalysis | null>(null);
  const [coupleAnalysis, setCoupleAnalysis] = useState<CoupleAnalysis | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShotRef>(null);

  const handleShare = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('공유', '모바일 앱에서 이미지 저장 및 공유가 가능합니다.');
      return;
    }
    try {
      setIsSharing(true);
      const uri = await viewShotRef.current?.capture();
      if (!uri) throw new Error('캡처 실패');
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: '커플 세션 결과 공유',
        });
      } else {
        Alert.alert('공유 불가', '이 기기에서는 공유 기능을 사용할 수 없습니다.');
      }
    } catch (e) {
      Alert.alert('오류', '이미지 저장 중 문제가 발생했습니다.');
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem('@couple_session');
        if (!raw) { setIsLoading(false); return; }
        const data: CoupleSessionData = JSON.parse(raw);
        setSessionData(data);

        const aAnalysis = generatePersonAnalysis(data.personA, 'A');
        const bAnalysis = generatePersonAnalysis(data.personB, 'B');
        const couple = generateCoupleAnalysis(data, aAnalysis, bAnalysis);

        setAnalysisA(aAnalysis);
        setAnalysisB(bAnalysis);
        setCoupleAnalysis(couple);
        setIsLoading(false);

        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }).start();
      } catch (e) {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            두 사람의 마음 흐름을 읽고 있습니다...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!sessionData || !analysisA || !analysisB || !coupleAnalysis) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            세션 데이터를 찾을 수 없습니다.
          </Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/couple-start' as any)}
          >
            <Text style={styles.retryBtnText}>다시 시작하기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const { relationType, personA, personB } = sessionData;
  const colorsA = personA.colors.map(id => COLOR_DATA.find(c => c.id === id)).filter(Boolean);
  const colorsB = personB.colors.map(id => COLOR_DATA.find(c => c.id === id)).filter(Boolean);

  const accentA = colorsA[0]?.hex ?? colors.primary;
  const accentB = colorsB[0]?.hex ?? colors.sage;
  const accentCouple = '#8FA68E';

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 0.95 }}
        >
        <Animated.View style={{ opacity: fadeAnim, backgroundColor: colors.background, borderRadius: 12, overflow: 'hidden' }}>

          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backBtnText, { color: colors.muted }]}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>커플 세션 결과</Text>
              <Text style={[styles.headerSub, { color: colors.muted }]}>{relationType} · 감성 심리코칭</Text>
            </View>
          </View>

          {/* 두 사람 컬러 요약 */}
          <View style={[styles.colorSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.colorSummaryPerson}>
              <View style={[styles.personBadge, { backgroundColor: accentA + '25' }]}>
                <Text style={[styles.personBadgeText, { color: accentA }]}>첫 번째 사람</Text>
              </View>
              <View style={styles.colorDots}>
                {colorsA.map(c => c && (
                  <View key={c.id} style={[styles.colorDot, { backgroundColor: c.hex }]} />
                ))}
              </View>
              <Text style={[styles.colorNames, { color: colors.muted }]}>
                {colorsA.map(c => c?.korName).join(' · ')}
              </Text>
            </View>
            <View style={[styles.colorSummaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.colorSummaryPerson}>
              <View style={[styles.personBadge, { backgroundColor: accentB + '25' }]}>
                <Text style={[styles.personBadgeText, { color: accentB }]}>두 번째 사람</Text>
              </View>
              <View style={styles.colorDots}>
                {colorsB.map(c => c && (
                  <View key={c.id} style={[styles.colorDot, { backgroundColor: c.hex }]} />
                ))}
              </View>
              <Text style={[styles.colorNames, { color: colors.muted }]}>
                {colorsB.map(c => c?.korName).join(' · ')}
              </Text>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════
              개인 분석 (40%) — 간결하게
          ═══════════════════════════════════════════════════════ */}
          <Text style={[styles.sectionGroupTitle, { color: colors.muted }]}>개인 마음 흐름</Text>

          {/* 첫 번째 사람 개인 분석 */}
          <SectionCard accentColor={accentA} label="첫 번째 사람" title="현재 마음 흐름" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{analysisA.currentFlow}</Text>
            <Text style={[styles.bodyText, { color: colors.muted, marginTop: 8 }]}>
              <Text style={{ fontWeight: '600', color: colors.foreground }}>관계 성향 </Text>
              {analysisA.relationshipStyle}
            </Text>
          </SectionCard>

          <SectionCard accentColor={accentA} title="보완 컬러" colors={colors}>
            {/* 보완 컬러 */}
            <View style={[styles.complementRow, { backgroundColor: analysisA.complementColor.hex + '18', borderColor: analysisA.complementColor.hex + '40' }]}>
              <View style={[styles.complementDot, { backgroundColor: analysisA.complementColor.hex }]} />
              <View style={styles.complementText}>
                <Text style={[styles.complementName, { color: analysisA.complementColor.hex }]}>
                  {analysisA.complementColor.korName}
                </Text>
                <Text style={[styles.complementMeaning, { color: colors.muted }]}>
                  {analysisA.complementColor.meaning}
                </Text>
              </View>
            </View>
            <Text style={[styles.coachingMessage, { color: colors.foreground, borderLeftColor: accentA }]}>
              {analysisA.coachingMessage}
            </Text>
          </SectionCard>

          {/* 두 번째 사람 개인 분석 */}
          <SectionCard accentColor={accentB} label="두 번째 사람" title="현재 마음 흐름" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{analysisB.currentFlow}</Text>
            <Text style={[styles.bodyText, { color: colors.muted, marginTop: 8 }]}>
              <Text style={{ fontWeight: '600', color: colors.foreground }}>관계 성향 </Text>
              {analysisB.relationshipStyle}
            </Text>
          </SectionCard>

          <SectionCard accentColor={accentB} title="보완 컬러" colors={colors}>
            <View style={[styles.complementRow, { backgroundColor: analysisB.complementColor.hex + '18', borderColor: analysisB.complementColor.hex + '40' }]}>
              <View style={[styles.complementDot, { backgroundColor: analysisB.complementColor.hex }]} />
              <View style={styles.complementText}>
                <Text style={[styles.complementName, { color: analysisB.complementColor.hex }]}>
                  {analysisB.complementColor.korName}
                </Text>
                <Text style={[styles.complementMeaning, { color: colors.muted }]}>
                  {analysisB.complementColor.meaning}
                </Text>
              </View>
            </View>
            <Text style={[styles.coachingMessage, { color: colors.foreground, borderLeftColor: accentB }]}>
              {analysisB.coachingMessage}
            </Text>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════
              관계 통합 해석 (60%) — 핵심
          ═══════════════════════════════════════════════════════ */}
          <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 8 }]}>관계 통합 해석</Text>

          <SectionCard accentColor={accentCouple} label="관계 흐름" title="두 사람의 에너지가 만나는 방식" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.relationFlow}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="공통점" title="두 사람이 닮은 것" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.commonGround}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="서로 다른 기질" title="다름이 만드는 균형" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.differentTemperament}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="감정 표현 차이" title="서로 다른 감정의 언어" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.emotionDifference}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="관계 리듬" title="서로 다른 속도와 리듬" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.rhythmDifference}</Text>
          </SectionCard>

          <SectionCard accentColor='#E8A87C' label="오해 패턴" title="오해가 생기기 쉬운 순간" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.misunderstandingPattern}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="관계 회복" title="함께 회복하는 방향" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.recoveryDirection}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="연결 방식" title="두 사람이 가까워지는 방법" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.intimacyStyle}</Text>
            {coupleAnalysis.affectionStyle !== coupleAnalysis.intimacyStyle && (
              <>
                <View style={[sectionStyles.divider, { backgroundColor: accentCouple + '25', marginTop: 8 }]} />
                <Text style={[styles.bodyText, { color: colors.foreground, marginTop: 4 }]}>{coupleAnalysis.affectionStyle}</Text>
              </>
            )}
          </SectionCard>

          {/* 서로에게 필요한 표현 */}
          <SectionCard accentColor='#B8A9C9' label="서로에게 필요한 말" title="지금 이 말이 필요합니다" colors={colors}>
            <View style={[styles.neededRow, { backgroundColor: accentA + '12', borderColor: accentA + '30' }]}>
              <Text style={[styles.neededText, { color: colors.foreground }]}>
                {coupleAnalysis.neededExpression.forA}
              </Text>
            </View>
            <View style={[styles.neededRow, { backgroundColor: accentB + '12', borderColor: accentB + '30', marginTop: 8 }]}>
              <Text style={[styles.neededText, { color: colors.foreground }]}>
                {coupleAnalysis.neededExpression.forB}
              </Text>
            </View>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════
              커플 보완 루틴
          ═══════════════════════════════════════════════════════ */}
          <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 8 }]}>커플 보완 루틴</Text>

          <SectionCard accentColor={accentCouple} title="함께하기 좋은 활동" colors={colors}>
            {coupleAnalysis.coupleRoutine.activities.map((act, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: accentCouple }]}>·</Text>
                <Text style={[styles.bulletText, { color: colors.foreground }]}>{act}</Text>
              </View>
            ))}
          </SectionCard>

          <SectionCard accentColor={accentCouple} title="함께 쉬는 방식" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              {coupleAnalysis.coupleRoutine.restTogether}
            </Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} title="감정 회복 루틴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              {coupleAnalysis.coupleRoutine.emotionRecovery}
            </Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} title="대화 루틴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              {coupleAnalysis.coupleRoutine.conversationRoutine}
            </Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} title="정서적 연결 루틴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              {coupleAnalysis.coupleRoutine.connectionRoutine}
            </Text>
          </SectionCard>

          {coupleAnalysis.coupleRoutine.affectionRoutine && (
            <SectionCard accentColor='#F4A882' title="애정 표현 루틴" colors={colors}>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>
                {coupleAnalysis.coupleRoutine.affectionRoutine}
              </Text>
            </SectionCard>
          )}

          {/* 추천 컬러 */}
          <SectionCard accentColor={accentCouple} title="두 사람에게 권하는 컬러" colors={colors}>
            {coupleAnalysis.coupleRoutine.recommendedColors.map(rc => (
              <View key={rc.id} style={[styles.complementRow, { backgroundColor: rc.hex + '18', borderColor: rc.hex + '40' }]}>
                <View style={[styles.complementDot, { backgroundColor: rc.hex }]} />
                <View style={styles.complementText}>
                  <Text style={[styles.complementName, { color: rc.hex }]}>{rc.korName}</Text>
                  <Text style={[styles.complementMeaning, { color: colors.muted }]}>{rc.reason}</Text>
                </View>
              </View>
            ))}
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════
              마무리 코칭 메시지
          ═══════════════════════════════════════════════════════ */}
          <View style={[styles.closingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.closingLabel, { color: accentCouple }]}>마무리 코칭 메시지</Text>
            <Text style={[styles.closingMessage, { color: colors.foreground }]}>
              {coupleAnalysis.closingMessage}
            </Text>
          </View>

        </Animated.View>
        </ViewShot>

          {/* 공유 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.shareBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.7 },
              isSharing && { opacity: 0.5 },
            ]}
            onPress={handleShare}
            disabled={isSharing}
          >
            <Text style={[styles.shareBtnText, { color: colors.foreground }]}>
              {isSharing ? '저장 중...' : '📤  결과 이미지 저장 · 공유'}
            </Text>
          </Pressable>

          {/* 다시 시작 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.restartBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => {
              AsyncStorage.removeItem('@couple_session');
              router.push('/(tabs)/couple-start' as any);
            }}
          >
            <Text style={styles.restartBtnText}>새로운 커플 세션 시작하기</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.homeBtn,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.push('/(tabs)/' as any)}
          >
            <Text style={[styles.homeBtnText, { color: colors.muted }]}>홈으로 돌아가기</Text>
          </Pressable>

          <View style={{ height: 60 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  loadingText: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, fontWeight: '600' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  colorSummary: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24,
    flexDirection: 'row', alignItems: 'center',
  },
  colorSummaryPerson: { flex: 1, alignItems: 'center', gap: 8 },
  colorSummaryDivider: { width: 1, height: 60, marginHorizontal: 12 },
  personBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  personBadgeText: { fontSize: 11, fontWeight: '600' },
  colorDots: { flexDirection: 'row', gap: 6 },
  colorDot: { width: 20, height: 20, borderRadius: 10 },
  colorNames: { fontSize: 11, textAlign: 'center' },
  sectionGroupTitle: {
    fontSize: 12, fontWeight: '600', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 12, marginTop: 4,
  },
  bodyText: { fontSize: 14, lineHeight: 24 },
  complementRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 8,
  },
  complementDot: { width: 32, height: 32, borderRadius: 16 },
  complementText: { flex: 1, gap: 2 },
  complementName: { fontSize: 14, fontWeight: '700' },
  complementMeaning: { fontSize: 12, lineHeight: 18 },
  coachingMessage: {
    fontSize: 14, lineHeight: 24, fontStyle: 'italic',
    borderLeftWidth: 3, paddingLeft: 12, marginTop: 8,
  },
  neededRow: { borderRadius: 10, borderWidth: 1, padding: 12 },
  neededText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 22 },
  closingCard: {
    borderRadius: 16, borderWidth: 1, padding: 24, marginBottom: 20, gap: 12,
    alignItems: 'center',
  },
  closingLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  closingMessage: {
    fontSize: 15, lineHeight: 26, textAlign: 'center', fontStyle: 'italic',
  },
  restartBtn: {
    paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12,
  },
  restartBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  homeBtn: {
    paddingVertical: 14, borderRadius: 16, alignItems: 'center',
    borderWidth: 1,
  },
  homeBtnText: { fontSize: 14, fontWeight: '500' },
  shareBtn: {
    paddingVertical: 14, borderRadius: 16, alignItems: 'center',
    borderWidth: 1, marginBottom: 12, marginTop: 4,
  },
  shareBtnText: { fontSize: 14, fontWeight: '600' },
});
