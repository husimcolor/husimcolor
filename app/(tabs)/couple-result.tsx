import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR_DATA } from '@/constants/colorData';
import { CARD_DATA } from '@/constants/cardData';
import {
  generatePersonAnalysis, generateCoupleAnalysis,
  type CoupleSessionData, type PersonAnalysis, type CoupleAnalysis,
} from '@/constants/coupleData';

// ─── SectionCard ─────────────────────────────────────────────────────────────
const sectionStyles = StyleSheet.create({
  card: {
    borderRadius: 14, borderWidth: 1, padding: 18, marginBottom: 12, gap: 8, minHeight: 80,
  },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  divider: { height: 1, marginVertical: 4 },
});

function SectionCard({
  label, title, accentColor, colors, children,
}: {
  label?: string; title?: string; accentColor: string;
  colors: ReturnType<typeof useColors>; children: React.ReactNode;
}) {
  return (
    <View style={[sectionStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {label && (
        <Text style={[sectionStyles.label, { color: accentColor }]}>{label}</Text>
      )}
      {title && (
        <Text style={[sectionStyles.title, { color: colors.foreground }]}>{title}</Text>
      )}
      <View style={[sectionStyles.divider, { backgroundColor: accentColor + '30' }]} />
      {children}
    </View>
  );
}

// ─── 메인 화면 ───────────────────────────────────────────────────────────────
export default function CoupleResultScreen() {
  const router = useRouter();
  const colors = useColors();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [sessionData, setSessionData] = useState<CoupleSessionData | null>(null);
  const [personAAnalysis, setPersonAAnalysis] = useState<PersonAnalysis | null>(null);
  const [personBAnalysis, setPersonBAnalysis] = useState<PersonAnalysis | null>(null);
  const [coupleAnalysis, setCoupleAnalysis] = useState<CoupleAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const raw = await AsyncStorage.getItem('@couple_session');
      if (!raw) { setError('세션 데이터를 찾을 수 없습니다.'); setLoading(false); return; }
      const data: CoupleSessionData = JSON.parse(raw);
      setSessionData(data);
      const aAnalysis = generatePersonAnalysis(data.personA, 'A');
      const bAnalysis = generatePersonAnalysis(data.personB, 'B');
      const cAnalysis = generateCoupleAnalysis(data, aAnalysis, bAnalysis);
      setPersonAAnalysis(aAnalysis);
      setPersonBAnalysis(bAnalysis);
      setCoupleAnalysis(cAnalysis);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch (e) {
      setError('분석 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            두 사람의 마음 흐름을{'\n'}분석하고 있습니다...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error || !sessionData || !personAAnalysis || !personBAnalysis || !coupleAnalysis) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>{error ?? '데이터를 불러올 수 없습니다.'}</Text>
          <Pressable
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryBtnText}>돌아가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const { relationType, personA, personB } = sessionData;

  // 관계 유형별 섹션 제목 분기
  const isRomanticRel = relationType === '연인' || relationType === '부부';
  const isParentChildRel = relationType === '아빠-아들' || relationType === '아빠-딸' || relationType === '엄마-아들' || relationType === '엄마-딸' || relationType === '부모-자녀';
  const isFriendRel = relationType === '친구';
  const isColleagueRel = relationType === '동료';

  const getRelSectionLabel = () => {
    if (isRomanticRel) return '두 사람 이해';
    if (isParentChildRel) return '관계 이해';
    if (isFriendRel) return '우정 이해';
    if (isColleagueRel) return '관계 이해';
    return '두 사람 이해';
  };

  const getRelSectionTitle = () => {
    if (isRomanticRel) return '왜 끌리는데 왜 힘든지';
    if (isParentChildRel) return '서로 다르게 표현하지만 연결되고 싶은 마음';
    if (isFriendRel) return '편안한데 왜 가끔 어색해지는지';
    if (isColleagueRel) return '함께 일하는 방식의 차이';
    return '두 사람의 에너지 흐름';
  };

  const getRoutineSectionLabel = () => {
    if (isRomanticRel) return '커플 보완 루틴';
    if (isParentChildRel) return '관계 회복 루틴';
    if (isFriendRel) return '관계 연결 루틴';
    if (isColleagueRel) return '협업 연결 루틴';
    return '관계 보완 루틴';
  };
  const colorsA = personA.colors.map(id => COLOR_DATA.find(c => c.id === id)).filter(Boolean);
  const colorsB = personB.colors.map(id => COLOR_DATA.find(c => c.id === id)).filter(Boolean);
  const cardsA = personA.cards.map(id => CARD_DATA.find(c => c.id === id)).filter(Boolean);
  const cardsB = personB.cards.map(id => CARD_DATA.find(c => c.id === id)).filter(Boolean);
  const cardLabels = ['무의식', '현재', '미래'];

  // 밝은 컬러(화이트, 옐로우 등)일 때 배지 텍스트가 안 보이는 문제 방지
  const rawAccentA = colorsA[0]?.hex ?? colors.primary;
  const rawAccentB = colorsB[0]?.hex ?? colors.sage;
  // hex를 RGB로 변환하여 밝기 계산 (luminance < 0.6이면 그대로, 아니면 진한 색으로 대체)
  const hexLuminance = (hex: string) => {
    const r = parseInt(hex.slice(1,3),16)/255;
    const g = parseInt(hex.slice(3,5),16)/255;
    const b = parseInt(hex.slice(5,7),16)/255;
    return 0.299*r + 0.587*g + 0.114*b;
  };
  const accentA = hexLuminance(rawAccentA) > 0.75 ? '#7B5E3A' : rawAccentA;
  const accentB = hexLuminance(rawAccentB) > 0.75 ? '#7B5E3A' : rawAccentB;
    const accentCouple = '#8FA68E';
  const insets = useSafeAreaInsets();
  // 인앱브라우저(카카오톡/네이버)는 safe-area가 0으로 잡히는 경우가 있어 최소값 보장
  const topPad = Platform.OS === 'web'
    ? Math.max(insets.top, 16)
    : 0;
  return (
    <ScreenContainer>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, paddingTop: topPad }}>

          {/* 헤더 */}
          <View style={styles.header}>
            <Pressable
              style={[styles.backBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backBtnText, { color: colors.foreground }]}>←</Text>
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: '#2D2420' }]}>커플 세션 결과</Text>
              <Text style={[styles.headerSub, { color: '#5F4B3B' }]}>{relationType} · 감성 심리코칭</Text>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════
              상단 요약 카드 — 컬러 행 + 심리카드 행
          ═══════════════════════════════════════════════════════ */}
          <View style={[styles.colorSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>

            {/* 컬러 구슬 행 */}
            <View style={styles.colorSummaryRow}>
              <View style={styles.colorSummaryPerson}>
                <View style={[styles.personBadge, { backgroundColor: accentA + '25' }]}>
                  <Text style={[styles.personBadgeText, { color: accentA }]}>첫 번째 사람</Text>
                </View>
                <View style={styles.colorDots}>
                  {colorsA.map(c => c && (
                    <View key={c.id} style={[styles.colorDot, { backgroundColor: c.hex }]} />
                  ))}
                </View>
                <Text style={[styles.colorNames, { color: '#5F4B3B' }]}>
                  {colorsA.map(c => c?.korName).join(' · ')}
                </Text>
              </View>
              <View style={[styles.colorSummaryDividerV, { backgroundColor: colors.border }]} />
              <View style={styles.colorSummaryPerson}>
                <View style={[styles.personBadge, { backgroundColor: accentB + '25' }]}>
                  <Text style={[styles.personBadgeText, { color: accentB }]}>두 번째 사람</Text>
                </View>
                <View style={styles.colorDots}>
                  {colorsB.map(c => c && (
                    <View key={c.id} style={[styles.colorDot, { backgroundColor: c.hex }]} />
                  ))}
                </View>
                <Text style={[styles.colorNames, { color: '#5F4B3B' }]}>
                  {colorsB.map(c => c?.korName).join(' · ')}
                </Text>
              </View>
            </View>

            {/* 가로 구분선 */}
            <View style={[styles.colorSummaryDividerH, { backgroundColor: colors.border }]} />

            {/* 심리카드 행 */}
            <View style={styles.colorSummaryRow}>
              {/* 첫 번째 사람 카드 */}
              <View style={styles.colorSummaryPerson}>
                <Text style={[styles.cardSectionLabel, { color: accentA }]}>심리카드 흐름</Text>
                {cardsA.length > 0 && (
                  <View style={styles.miniCardRow}>
                    {cardsA.map((card, i) => card && (
                      <View key={card.id} style={styles.miniCardItem}>
                        <View style={[
                          styles.miniCardFace,
                          { backgroundColor: card.colorHex },
                          card.colorKor === '화이트' && styles.miniCardWhiteBorder,
                        ]}>
                          <View style={styles.miniCardInnerGlow} />
                          <Text style={[
                            styles.miniCardShape,
                            { color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.92)' },
                          ]}>{card.shapeSymbol}</Text>
                          <Text style={[
                            styles.miniCardColorText,
                            { color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.9)' },
                          ]}>{card.colorKor}</Text>
                        </View>
                        <Text style={[styles.miniCardLabel, { color: '#6B5344' }]}>{cardLabels[i]}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={[styles.colorSummaryDividerV, { backgroundColor: colors.border }]} />
              {/* 두 번째 사람 카드 */}
              <View style={styles.colorSummaryPerson}>
                <Text style={[styles.cardSectionLabel, { color: accentB }]}>심리카드 흐름</Text>
                {cardsB.length > 0 && (
                  <View style={styles.miniCardRow}>
                    {cardsB.map((card, i) => card && (
                      <View key={card.id} style={styles.miniCardItem}>
                        <View style={[
                          styles.miniCardFace,
                          { backgroundColor: card.colorHex },
                          card.colorKor === '화이트' && styles.miniCardWhiteBorder,
                        ]}>
                          <View style={styles.miniCardInnerGlow} />
                          <Text style={[
                            styles.miniCardShape,
                            { color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.92)' },
                          ]}>{card.shapeSymbol}</Text>
                          <Text style={[
                            styles.miniCardColorText,
                            { color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.9)' },
                          ]}>{card.colorKor}</Text>
                        </View>
                        <Text style={[styles.miniCardLabel, { color: '#6B5344' }]}>{cardLabels[i]}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

          </View>

          {/* ═══════════════════════════════════════════════════════
              개인 분석 (40%) — 간결하게
          ═══════════════════════════════════════════════════════ */}
          <Text style={[styles.sectionGroupTitle, { color: colors.muted }]}>개인 마음 흐름</Text>

          {/* 첫 번째 사람 */}
          <SectionCard accentColor={accentA} label="첫 번째 사람" title="현재 마음 흐름" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{personAAnalysis.currentFlow}</Text>
            <View style={[sectionStyles.divider, { backgroundColor: accentA + '25', marginTop: 4 }]} />
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              <Text style={{ fontWeight: '700' }}>관계 성향 </Text>
              {personAAnalysis.relationshipStyle}
            </Text>
          </SectionCard>

          <SectionCard accentColor={accentA} label="첫 번째 사람" title="보완 컬러" colors={colors}>
            {(() => {
              const cc = personAAnalysis.complementColor;
              return (
                <View style={[styles.complementRow, { backgroundColor: cc.hex + '18', borderColor: cc.hex + '40' }]}>
                  <View style={[styles.complementDot, { backgroundColor: cc.hex }]} />
                  <View style={styles.complementText}>
                    <Text style={[styles.complementName, { color: cc.hex }]}>{cc.korName}</Text>
                    <Text style={[styles.complementMeaning, { color: colors.muted }]}>{cc.meaning}</Text>
                  </View>
                </View>
              );
            })()}
            <Text style={[styles.coachingMessage, { color: colors.muted, borderLeftColor: accentA + '60' }]}>
              {personAAnalysis.coachingMessage}
            </Text>
          </SectionCard>

          {/* 두 번째 사람 */}
          <SectionCard accentColor={accentB} label="두 번째 사람" title="현재 마음 흐름" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{personBAnalysis.currentFlow}</Text>
            <View style={[sectionStyles.divider, { backgroundColor: accentB + '25', marginTop: 4 }]} />
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              <Text style={{ fontWeight: '700' }}>관계 성향 </Text>
              {personBAnalysis.relationshipStyle}
            </Text>
          </SectionCard>

          <SectionCard accentColor={accentB} label="두 번째 사람" title="보완 컬러" colors={colors}>
            {(() => {
              const cc = personBAnalysis.complementColor;
              return (
                <View style={[styles.complementRow, { backgroundColor: cc.hex + '18', borderColor: cc.hex + '40' }]}>
                  <View style={[styles.complementDot, { backgroundColor: cc.hex }]} />
                  <View style={styles.complementText}>
                    <Text style={[styles.complementName, { color: cc.hex }]}>{cc.korName}</Text>
                    <Text style={[styles.complementMeaning, { color: colors.muted }]}>{cc.meaning}</Text>
                  </View>
                </View>
              );
            })()}
            <Text style={[styles.coachingMessage, { color: colors.muted, borderLeftColor: accentB + '60' }]}>
              {personBAnalysis.coachingMessage}
            </Text>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════
              관계 통합 분석 (60%)
          ═══════════════════════════════════════════════════════ */}
          <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 8 }]}>관계 통합 분석</Text>

          {/* 두 사람 프로파일 대비 요약 — 끌림 이유 + 반복 패턴 + 해법 */}
          <SectionCard accentColor={accentCouple} label={getRelSectionLabel()} title={getRelSectionTitle()} colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.profileContrast}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="관계 흐름" title="두 사람의 관계 패턴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.relationFlow}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="표현 방식" title="서로 다른 표현 방식" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.expressionDifference}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="오해 지점" title="오해가 생기는 순간" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.conflictPattern}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="가까워지는 방법" title="두 사람이 연결되는 방식" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{coupleAnalysis.connectionStyle}</Text>
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
          <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 8 }]}>{getRoutineSectionLabel()}</Text>

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

        {/* 하단 버튼 */}
        <Pressable
          style={[styles.restartBtn, { backgroundColor: accentCouple }]}
          onPress={() => router.push('/(tabs)/couple-start' as any)}
        >
          <Text style={styles.restartBtnText}>새로운 커플 세션 시작</Text>
        </Pressable>

        <Pressable
          style={[styles.shareBtn, { borderColor: colors.border }]}
          onPress={async () => {
            try {
              const { Share } = await import('react-native');
              await Share.share({ message: '휴심컬러 커플 세션 결과를 확인해보세요!' });
            } catch {}
          }}
        >
          <Text style={[styles.shareBtnText, { color: colors.foreground }]}>결과 공유하기</Text>
        </Pressable>

        <Pressable
          style={[styles.homeBtn, { borderColor: colors.border }]}
          onPress={() => router.push('/(tabs)' as any)}
        >
          <Text style={[styles.homeBtnText, { color: colors.muted }]}>홈으로 돌아가기</Text>
        </Pressable>

          <View style={{ height: 60 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  loadingText: { fontSize: 15, textAlign: 'center', lineHeight: 24 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, paddingTop: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, fontWeight: '600' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2, fontWeight: '500' },

  // ─── 상단 요약 카드 ───────────────────────────────────────────
  colorSummary: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24,
    gap: 14,
  },
  colorSummaryRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4,
  },
  colorSummaryPerson: { flex: 1, alignItems: 'center', gap: 8, paddingTop: 4 },
  colorSummaryDividerV: { width: 1, alignSelf: 'stretch', marginHorizontal: 8 },
  colorSummaryDividerH: { height: 1 },

  // ─── 컬러 구슬 ───────────────────────────────────────────────
  personBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  personBadgeText: { fontSize: 11, fontWeight: '700' },
  colorDots: { flexDirection: 'row', gap: 6 },
  colorDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  colorNames: { fontSize: 11, textAlign: 'center', fontWeight: '600', color: '#5F4B3B' },

  // ─── 심리카드 미니 카드 ──────────────────────────────────────
  cardSectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  miniCardRow: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  miniCardItem: { alignItems: 'center', gap: 4 },
  miniCardFace: {
    width: 44, height: 58,
    borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 3,
    gap: 2,
  },
  miniCardInnerGlow: {},
  miniCardWhiteBorder: { borderWidth: 1, borderColor: '#D4AF37' },
  miniCardShape: { fontSize: 18, lineHeight: 22 },
  miniCardColorText: { fontSize: 8, fontWeight: '600', letterSpacing: 0.2 },
  miniCardLabel: { fontSize: 9, letterSpacing: 0.2, fontWeight: '500' },

  // ─── 섹션 공통 ───────────────────────────────────────────────
  sectionGroupTitle: {
    fontSize: 12, fontWeight: '600', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 12, marginTop: 4,
  },
  bodyText: { fontSize: 14, lineHeight: 26, minHeight: 48 },
  complementRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 8,
  },
  complementDot: { width: 32, height: 32, borderRadius: 16 },
  complementText: { flex: 1, gap: 2 },
  complementName: { fontSize: 14, fontWeight: '700' },
  complementMeaning: { fontSize: 12, lineHeight: 20 },
  coachingMessage: {
    fontSize: 14, lineHeight: 26, fontStyle: 'italic',
    borderLeftWidth: 3, paddingLeft: 12, marginTop: 8,
  },
  neededRow: { borderRadius: 10, borderWidth: 1, padding: 12 },
  neededText: { fontSize: 14, lineHeight: 26, fontStyle: 'italic' },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  bulletText: { flex: 1, fontSize: 14, lineHeight: 24 },
  closingCard: {
    borderRadius: 16, borderWidth: 1, padding: 24, marginBottom: 20, gap: 12,
    alignItems: 'center',
  },
  closingLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  closingMessage: {
    fontSize: 15, lineHeight: 28, textAlign: 'center', fontStyle: 'italic',
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
