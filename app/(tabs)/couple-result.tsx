import React, { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Platform, Alert, TouchableOpacity,
} from 'react-native';
import ViewShot, { captureRef, type ViewShotRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLOR_DATA } from '@/constants/colorData';
import { CARD_DATA } from '@/constants/cardData';
import {
  generatePersonAnalysis, generateCoupleAnalysis, getRelationArchetype, getLightArchetype,
  type CoupleSessionData, type PersonAnalysis, type CoupleAnalysis, type ArchetypeResult, type LightArchetypeResult,
} from '@/constants/coupleData';

// ─── SectionCard ─────────────────────────────────────────────────────────────
const sectionStyles = StyleSheet.create({
  card: {
    borderRadius: 14, borderWidth: 1, padding: 20, marginBottom: 14, gap: 10, minHeight: 80,
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
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
  const [sessionData, setSessionData] = useState<CoupleSessionData | null>(null);
  const [personAAnalysis, setPersonAAnalysis] = useState<PersonAnalysis | null>(null);
  const [personBAnalysis, setPersonBAnalysis] = useState<PersonAnalysis | null>(null);
  const [coupleAnalysis, setCoupleAnalysis] = useState<CoupleAnalysis | null>(null);
  const [archetypeResult, setArchetypeResult] = useState<ArchetypeResult | null>(null);
  const [lightArchetypeResult, setLightArchetypeResult] = useState<LightArchetypeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const shareCardRef = useRef<ViewShotRef>(null);

  const logVisitor = trpc.visitors.log.useMutation();

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
      // archetype 계산
      const famsA = data.personA.colors.map((id: string) => {
        const c = COLOR_DATA.find((x: any) => x.id === id);
        const ENERGY_FAM: Record<string, string> = {
          red:'warm_active',orange:'warm_active',coral:'warm_active',magenta:'warm_active',
          pink:'warm_soft',peach:'warm_soft',beige:'warm_soft',cream:'warm_soft',
          gold:'warm_grounded',brown:'warm_grounded',terracotta:'warm_grounded',
          blue:'cool_clear',skyblue:'cool_clear',teal:'cool_clear',mint:'cool_clear',
          indigo:'cool_deep',violet:'cool_deep',black:'cool_deep',silver:'cool_deep',navy:'cool_deep',
          green:'nature',olive:'nature',sage:'nature',lavender:'nature',
          white:'neutral',yellow:'neutral',
        };
        return c ? (ENERGY_FAM[c.id] ?? 'neutral') : 'neutral';
      }) as any[];
      const famsB = data.personB.colors.map((id: string) => {
        const c = COLOR_DATA.find((x: any) => x.id === id);
        const ENERGY_FAM: Record<string, string> = {
          red:'warm_active',orange:'warm_active',coral:'warm_active',magenta:'warm_active',
          pink:'warm_soft',peach:'warm_soft',beige:'warm_soft',cream:'warm_soft',
          gold:'warm_grounded',brown:'warm_grounded',terracotta:'warm_grounded',
          blue:'cool_clear',skyblue:'cool_clear',teal:'cool_clear',mint:'cool_clear',
          indigo:'cool_deep',violet:'cool_deep',black:'cool_deep',silver:'cool_deep',navy:'cool_deep',
          green:'nature',olive:'nature',sage:'nature',lavender:'nature',
          white:'neutral',yellow:'neutral',
        };
        return c ? (ENERGY_FAM[c.id] ?? 'neutral') : 'neutral';
      }) as any[];
      const shapeA3 = data.personA.cards[2] ? CARD_DATA.find((c: any) => c.id === data.personA.cards[2])?.shape : undefined;
      const shapeB3 = data.personB.cards[2] ? CARD_DATA.find((c: any) => c.id === data.personB.cards[2])?.shape : undefined;
      const archRes = getRelationArchetype(famsA, famsB, shapeA3, shapeB3, data.personA.colors, data.personB.colors, data.personA.cards, data.personB.cards);
      const lightRes = getLightArchetype(data.relationType, famsA, famsB);
      setPersonAAnalysis(aAnalysis);
      setPersonBAnalysis(bAnalysis);
      setCoupleAnalysis(cAnalysis);
      setArchetypeResult(archRes);
      setLightArchetypeResult(lightRes);
      setLoading(false);
      // 커플 결과 도달 추적
      try {
        const deviceId = await AsyncStorage.getItem('husim_device_id') ?? 'unknown';
        const aColors = data.personA.colors?.map((c: any) => c.id).join(',') ?? '';
        const bColors = data.personB.colors?.map((c: any) => c.id).join(',') ?? '';
        logVisitor.mutate({
          deviceId,
          visitType: 'couple_result',
          testType: 'couple',
          relationshipType: data.relationType,
          selectedColors: [aColors, bColors].filter(Boolean).join('|'),
        });
      } catch (_) {}
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

  if (error || !sessionData || !personAAnalysis || !personBAnalysis || !coupleAnalysis || !archetypeResult) {
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

  // 표현 속도 레이블에 맞는 아이콘 반환
  const getExprIcon = (label: string): string => {
    if (label === '즉각적 표현') return '⚡';
    if (label === '직접적 표현') return '💬';
    if (label === '상황에 따라 표현') return '🌊';
    if (label === '내면 처리 후 표현') return '🌙';
    if (label === '조용한 표현') return '🤫';
    return '💭';
  };
  // 표현 속도 레이블 조합에 따른 설명문 반환
  const getExprDescription = (labelA: string, labelB: string): string => {
    const key = [labelA, labelB].sort().join('↔');
    const map: Record<string, string> = {
      '직접적 표현↔즉각적 표현': '두 사람 모두 감정을 비교적 빠르게 표현하는 편이지만, 한 사람은 분명하고 직접적으로 말하고, 다른 사람은 순간의 감정 반응이 빠르게 드러나는 차이가 있습니다.',
      '즉각적 표현↔직접적 표현': '두 사람 모두 감정을 비교적 빠르게 표현하는 편이지만, 한 사람은 분명하고 직접적으로 말하고, 다른 사람은 순간의 감정 반응이 빠르게 드러나는 차이가 있습니다.',
      '내면 처리 후 표현↔직접적 표현': '한 사람은 감정을 비교적 바로 표현하고, 다른 사람은 내면에서 정리한 후 표현합니다.',
      '내면 처리 후 표현↔즉각적 표현': '한 사람은 감정을 내면에서 정리한 후 표현하고, 다른 사람은 감정을 비교적 빠르게 드러내는 편입니다.',
      '내면 처리 후 표현↔상황에 따라 표현': '한 사람은 감정을 내면에서 충분히 정리한 후 표현하고, 다른 사람은 상황과 상대에 따라 표현 방식을 조율합니다.',
      '내면 처리 후 표현↔조용한 표현': '두 사람 모두 감정을 내면에서 먼저 정리하는 편이지만, 한 사람은 정리 후 표현하고 다른 사람은 조용히 담아두는 경향이 있습니다.',
      '직접적 표현↔상황에 따라 표현': '한 사람은 감정을 분명하고 직접적으로 표현하고, 다른 사람은 상황에 따라 표현 방식을 달리합니다.',
      '즉각적 표현↔상황에 따라 표현': '한 사람은 감정이 빠르게 드러나는 편이고, 다른 사람은 상황과 상대에 따라 표현 방식을 조율합니다.',
      '직접적 표현↔조용한 표현': '한 사람은 감정을 분명하게 표현하는 편이고, 다른 사람은 감정을 말보다 행동이나 분위기로 전달하는 경향이 있습니다.',
      '즉각적 표현↔조용한 표현': '한 사람은 감정이 빠르게 드러나는 편이고, 다른 사람은 감정을 조용히 담아두는 경향이 있어 서로의 속도 차이가 느껴질 수 있습니다.',
      '상황에 따라 표현↔조용한 표현': '한 사람은 상황에 따라 표현 방식을 조율하고, 다른 사람은 감정을 조용히 담아두는 편입니다.',
    };
    // 정렬된 키로 먼저 조회, 없으면 원래 순서로 조회
    return map[key] ?? map[`${labelA}↔${labelB}`] ?? map[`${labelB}↔${labelA}`] ?? archetypeResult?.expressionSpeed?.description ?? '';
  };

  // 유사형/차이형 관계 판별 (중간 설명부 타이틀 동적 변경용)
  const _EFMAP: Record<string, string> = {
    red:'warm_active',orange:'warm_active',coral:'warm_active',magenta:'warm_active',
    pink:'warm_soft',peach:'warm_soft',beige:'warm_soft',cream:'warm_soft',
    gold:'warm_grounded',brown:'warm_grounded',terracotta:'warm_grounded',
    blue:'cool_clear',skyblue:'cool_clear',teal:'cool_clear',mint:'cool_clear',
    indigo:'cool_deep',violet:'cool_deep',black:'cool_deep',silver:'cool_deep',navy:'cool_deep',
    green:'nature',olive:'nature',sage:'nature',lavender:'nature',
    white:'neutral',yellow:'neutral',
  };
  const _domFamA = (() => {
    const fams = personA.colors.map(id => _EFMAP[id] ?? 'neutral');
    const cnt: Record<string,number> = {};
    // 첫 번째 컬러(무의식 카드)에 가중치 2배 부여
    fams.forEach((f, i) => { cnt[f] = (cnt[f]??0) + (i === 0 ? 2 : 1); });
    return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? 'neutral';
  })();
  const _domFamB = (() => {
    const fams = personB.colors.map(id => _EFMAP[id] ?? 'neutral');
    const cnt: Record<string,number> = {};
    // 첫 번째 컬러(무의식 카드)에 가중치 2배 부여
    fams.forEach((f, i) => { cnt[f] = (cnt[f]??0) + (i === 0 ? 2 : 1); });
    return Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? 'neutral';
  })();
  const isSimilarRelation = _domFamA === _domFamB;
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
    if (!hex || hex.length < 7) return 0.5;
    const r = parseInt(hex.slice(1,3),16)/255;
    const g = parseInt(hex.slice(3,5),16)/255;
    const b = parseInt(hex.slice(5,7),16)/255;
    return 0.299*r + 0.587*g + 0.114*b;
  };
  // 배경 hex + 알파값(예: '28')을 받아 텍스트 색상 결정
  // 어두운 배경(luminance < 0.45) → 밝은 아이보리, 밝은 배경 → 어두운 브라운
  const getTextOnBg = (bgHex: string): string => {
    const lum = hexLuminance(bgHex);
    return lum < 0.45 ? '#F8F3EA' : '#3A2A1A';
  };
  const getMutedOnBg = (bgHex: string): string => {
    const lum = hexLuminance(bgHex);
    return lum < 0.45 ? '#E8DED2' : '#6B5344';
  };
  const accentA = hexLuminance(rawAccentA) > 0.75 ? '#7B5E3A' : rawAccentA;
  const accentB = hexLuminance(rawAccentB) > 0.75 ? '#7B5E3A' : rawAccentB;
  // archetype 유형별 대표 컬러 연동 (없으면 기본 세이지)
  const accentCouple = archetypeResult?.accentColor
    ?? lightArchetypeResult?.accentColor
    ?? '#8FA68E';
  // 상단 archetype 카드는 항상 라이트 배경 고정 → 어두운 텍스트 고정
  // 카카오/네이버 인앱브라우저, 다크모드 강제 적용 환경에서도 카드 자체가 밝게 유지됨
  const CARD_BG = '#FAF0EA';       // 완전 불투명 크림 배경 (accentCouple 투명 오버레이 대신)
  const CARD_TEXT = '#5C4A42';     // 다크 브라운 고정 텍스트
  const insets = useSafeAreaInsets();
  // 인앱브라우저(카카오톡/네이버)는 safe-area가 0으로 잡히는 경우가 있어 최소값 보장
  const topPad = Platform.OS === 'web'
    ? Math.max(insets.top, 16)
    : 0;
  return (
    <ScreenContainer>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: topPad }}>

          {/* 헤더 */}
          <View style={styles.header}>
            <Pressable
              style={[styles.backBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backBtnText, { color: colors.foreground }]}>←</Text>
            </Pressable>
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: '#2D2420' }]}>{isRomanticRel ? '커플 세션 결과' : '관계 세션 결과'}</Text>
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
              관계 유형 핵심 요약 카드 (archetype)
          ═══════════════════════════════════════════════════════ */}
          {/* 경량 archetype (친구/부모자녀/형제자매/동료) */}
          {lightArchetypeResult && (
            <>
              {/* 핵심 한 줄 공유 카드 */}
              <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 0.95 }}>
              <View style={[archetypeStyles.card, {
                backgroundColor: CARD_BG,
                borderColor: accentCouple + '80',
              }]}>
                <View style={archetypeStyles.typeRow}>
                  <View style={[archetypeStyles.typeBadge, { backgroundColor: accentCouple }]}>
                    <Text style={archetypeStyles.typeBadgeText}>관계 유형</Text>
                  </View>
                  <Text style={[archetypeStyles.typeName, { color: accentCouple }]}>{lightArchetypeResult.typeName}</Text>
                </View>
                <Text style={[archetypeStyles.coreSummary, { color: accentCouple }]}>❝ {lightArchetypeResult.coreSummary} ❞</Text>
                <View style={[archetypeStyles.divider, { backgroundColor: accentCouple + '40' }]} />
                <Text style={{ fontSize: 13.5, lineHeight: 24, color: '#5C4A42', opacity: 1 }}>{lightArchetypeResult.description}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
                  <Text style={{ fontSize: 10, color: accentCouple + 'AA', fontWeight: '600', letterSpacing: 0.5 }}>휴심컬러 · 관계 심리코칭</Text>
                </View>
              </View>
              </ViewShot>
              {/* 공유 버튼 */}
              <View style={shareCardStyles.row}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[shareCardStyles.btn, { backgroundColor: accentCouple + '20', borderColor: accentCouple + '60' }]}
                  onPress={async () => {
                    if (isSaving) return;
                    setIsSaving(true);
                    try {
                      let uri: string | undefined;
                      if (shareCardRef.current && typeof shareCardRef.current.capture === 'function') {
                        uri = await shareCardRef.current.capture();
                      } else {
                        uri = await captureRef(shareCardRef, { format: 'png', quality: 0.95 });
                      }
                      if (!uri) throw new Error('캡처 실패');
                      if (Platform.OS === 'web') {
                        const link = document.createElement('a');
                        link.href = uri;
                        link.download = `husimcolor_couple_${Date.now()}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      } else {
                        const dest = `${FileSystem.cacheDirectory}husimcolor_couple_${Date.now()}.png`;
                        await FileSystem.copyAsync({ from: uri, to: dest });
                        const ok = await Sharing.isAvailableAsync();
                        if (ok) await Sharing.shareAsync(dest, { mimeType: 'image/png', dialogTitle: '관계 유형 카드 저장', UTI: 'public.png' });
                        else Alert.alert('알림', '이 환경에서는 저장 기능을 사용할 수 없습니다.');
                      }
                    } catch (e) {
                      Alert.alert('저장 실패', '이미지 저장에 실패했습니다.');
                    } finally { setIsSaving(false); }
                  }}
                >
                  <Text style={[shareCardStyles.btnText, { color: accentCouple }]}>📷 {isSaving ? '저장 중...' : '이미지 저장'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[shareCardStyles.btn, { backgroundColor: '#FEE500', borderColor: '#FEE500' }]}
                  onPress={async () => {
                    if (Platform.OS === 'web') {
                      const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://husimcolor.vercel.app';
                      if (typeof navigator !== 'undefined' && navigator.share) {
                        try { await navigator.share({ title: '휴심컬러 커플 세션 결과', text: `우리 관계 유형은 ${lightArchetypeResult.typeName}입니다 💫`, url: shareUrl }); return; } catch {}
                      }
                      try { await navigator.clipboard.writeText(shareUrl); Alert.alert('링크 복사 완료', '카카오톡에 붙여넣기 하여 공유해보세요!'); } catch { Alert.alert('공유 링크', shareUrl); }
                      return;
                    }
                    try {
                      const uri = await captureRef(shareCardRef, { format: 'png', quality: 0.95 });
                      const ok = await Sharing.isAvailableAsync();
                      if (ok) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '휴심컬러 결과 공유' });
                      else Alert.alert('알림', '이 환경에서는 공유 기능을 사용할 수 없습니다.');
                    } catch { Alert.alert('오류', '공유에 실패했습니다.'); }
                  }}
                >
                  <Text style={[shareCardStyles.btnText, { color: '#3A1D1D' }]}>💬 카카오 공유</Text>
                </TouchableOpacity>
              </View>
              {/* ─── 개인 마음 흐름 (lightArchetype 경로 전용) ─── */}
              <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 4 }]}>개인 마음 흐름</Text>
              <SectionCard accentColor={accentA} label="첫 번째 사람" title="현재 마음 흐름" colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{personAAnalysis.currentFlow}</Text>
                <View style={[sectionStyles.divider, { backgroundColor: accentA + '25', marginTop: 4 }]} />
                <Text style={[styles.bodyText, { color: colors.foreground }]}>
                  <Text style={{ fontWeight: '700' }}>관계 성향 </Text>
                  {personAAnalysis.relationshipStyle}
                </Text>
              </SectionCard>
              <SectionCard accentColor={accentB} label="두 번째 사람" title="현재 마음 흐름" colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{personBAnalysis.currentFlow}</Text>
                <View style={[sectionStyles.divider, { backgroundColor: accentB + '25', marginTop: 4 }]} />
                <Text style={[styles.bodyText, { color: colors.foreground }]}>
                  <Text style={{ fontWeight: '700' }}>관계 성향 </Text>
                  {personBAnalysis.relationshipStyle}
                </Text>
              </SectionCard>
              {/* ─── archetype 섹션 (오해 패턴, 연결 방식, 루틴) — 관계 유형별 제목 분기 ─── */}
              <SectionCard accentColor={accentCouple} label={lightArchetypeResult.typeName} title={isParentChildRel ? '서로 이해하는 방식' : isFriendRel ? '편안함 속 오해 패턴' : isColleagueRel ? '함께 일하며 생기는 오해' : '이 관계의 오해 패턴'} colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{lightArchetypeResult.misunderstandingPattern}</Text>
              </SectionCard>
              <SectionCard accentColor={accentCouple} label={lightArchetypeResult.typeName} title={isParentChildRel ? '안정감을 느끼는 연결 방식' : isFriendRel ? '편안하게 연결되는 방식' : isColleagueRel ? '협업 연결 방식' : '연결 방식'} colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{lightArchetypeResult.connectionStyle}</Text>
              </SectionCard>
              <SectionCard accentColor={accentCouple} label={lightArchetypeResult.typeName} title={isParentChildRel ? '대화 흐름' : isFriendRel ? '대화 패턴' : isColleagueRel ? '소통 루틴' : '대화 루틴'} colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{lightArchetypeResult.conversationRoutine}</Text>
              </SectionCard>
              <SectionCard accentColor={accentCouple} label={lightArchetypeResult.typeName} title={isParentChildRel ? '갈등 후 회복 방식' : isFriendRel ? '거리감 후 회복 방식' : isColleagueRel ? '갈등 후 관계 회복' : '관계 회복 루틴'} colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{lightArchetypeResult.recoveryRoutine}</Text>
              </SectionCard>
              <SectionCard accentColor={accentCouple} label={lightArchetypeResult.typeName} title={isParentChildRel ? '이 관계가 오래 이어지는 이유' : isFriendRel ? '이 우정이 오래가는 이유' : isColleagueRel ? '이 관계가 잘 맞는 이유' : '이 관계가 오래가는 이유'} colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{lightArchetypeResult.relationStrength}</Text>
              </SectionCard>
              {/* 경량 archetype 보완 컬러 */}
              {lightArchetypeResult.recommendedColors && lightArchetypeResult.recommendedColors.length > 0 && (
                <SectionCard accentColor={accentCouple} title="이 관계에 어울리는 컬러" colors={colors}>
                  {lightArchetypeResult.recommendedColors.map(rc => (
                    <View key={rc.id} style={[styles.complementRow, { backgroundColor: '#FBF7F2', borderColor: rc.hex + '60' }]}>
                      <View style={[styles.complementDot, { backgroundColor: rc.hex, shadowColor: rc.hex }]} />
                      <View style={styles.complementText}>
                        <Text style={[styles.complementName, { color: rc.hex }]}>{rc.korName}</Text>
                        <Text style={[styles.complementMeaning, { color: '#4A3728', fontSize: 14, lineHeight: 24 }]}>{rc.reason}</Text>
                      </View>
                    </View>
                  ))}
                </SectionCard>
              )}
            </>
          )}
          {/* 연인/부부 전용 풀 archetype */}
          {!lightArchetypeResult && (
            <>
          {/* 핵심 한 줄 공유 카드 */}
          <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 0.95 }}>
          <View style={[archetypeStyles.card, {
            backgroundColor: CARD_BG,
            borderColor: accentCouple + '80',
          }]}>
            <View style={archetypeStyles.typeRow}>
              <View style={[archetypeStyles.typeBadge, { backgroundColor: accentCouple }]}>
                <Text style={archetypeStyles.typeBadgeText}>관계 유형</Text>
              </View>
              <Text style={[archetypeStyles.typeName, { color: accentCouple }]}>{archetypeResult.typeName}</Text>
            </View>
            <Text style={[archetypeStyles.coreSummary, { color: accentCouple }]}>❝ {archetypeResult.coreSummary} ❞</Text>
            <View style={[archetypeStyles.divider, { backgroundColor: accentCouple + '40' }]} />
            <Text style={{ fontSize: 13.5, lineHeight: 24, color: '#5C4A42', opacity: 1 }}>{archetypeResult.tensionDescription}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
              <Text style={{ fontSize: 10, color: accentCouple + 'AA', fontWeight: '600', letterSpacing: 0.5 }}>휴심컬러 · 커플 심리코칭</Text>
            </View>
          </View>
          </ViewShot>
          {/* 공유 버튼 */}
          <View style={shareCardStyles.row}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[shareCardStyles.btn, { backgroundColor: accentCouple + '20', borderColor: accentCouple + '60' }]}
              onPress={async () => {
                if (isSaving) return;
                setIsSaving(true);
                try {
                  let uri: string | undefined;
                  if (shareCardRef.current && typeof shareCardRef.current.capture === 'function') {
                    uri = await shareCardRef.current.capture();
                  } else {
                    uri = await captureRef(shareCardRef, { format: 'png', quality: 0.95 });
                  }
                  if (!uri) throw new Error('캡처 실패');
                  if (Platform.OS === 'web') {
                    const link = document.createElement('a');
                    link.href = uri;
                    link.download = `husimcolor_couple_${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } else {
                    const dest = `${FileSystem.cacheDirectory}husimcolor_couple_${Date.now()}.png`;
                    await FileSystem.copyAsync({ from: uri, to: dest });
                    const ok = await Sharing.isAvailableAsync();
                    if (ok) await Sharing.shareAsync(dest, { mimeType: 'image/png', dialogTitle: '관계 유형 카드 저장', UTI: 'public.png' });
                    else Alert.alert('알림', '이 환경에서는 저장 기능을 사용할 수 없습니다.');
                  }
                } catch { Alert.alert('저장 실패', '이미지 저장에 실패했습니다.'); }
                finally { setIsSaving(false); }
              }}
            >
              <Text style={[shareCardStyles.btnText, { color: accentCouple }]}>📷 {isSaving ? '저장 중...' : '이미지 저장'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[shareCardStyles.btn, { backgroundColor: '#FEE500', borderColor: '#FEE500' }]}
              onPress={async () => {
                if (Platform.OS === 'web') {
                  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://husimcolor.vercel.app';
                  if (typeof navigator !== 'undefined' && navigator.share) {
                    try { await navigator.share({ title: '휴심컬러 커플 세션 결과', text: `우리 관계 유형은 ${archetypeResult.typeName}입니다 💫`, url: shareUrl }); return; } catch {}
                  }
                  try { await navigator.clipboard.writeText(shareUrl); Alert.alert('링크 복사 완료', '카카오톡에 붙여넣기 하여 공유해보세요!'); } catch { Alert.alert('공유 링크', shareUrl); }
                  return;
                }
                try {
                  const uri = await captureRef(shareCardRef, { format: 'png', quality: 0.95 });
                  const ok = await Sharing.isAvailableAsync();
                  if (ok) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '휴심컬러 결과 공유' });
                  else Alert.alert('알림', '이 환경에서는 공유 기능을 사용할 수 없습니다.');
                } catch { Alert.alert('오류', '공유에 실패했습니다.'); }
              }}
            >
              <Text style={[shareCardStyles.btnText, { color: '#3A1D1D' }]}>💬 카카오 공유</Text>
            </TouchableOpacity>
          </View>

          {/* ═══════════════════════════════════════════════════════
              관계 온도 그래프 + 표현 속도 시각화 + 회복 방식 아이콘
          ═══════════════════════════════════════════════════════ */}
          <View style={[archetypeStyles.card, { backgroundColor: '#FAFAFA', borderColor: '#E8E0F5' }]}>
            {/* 관계 온도 그래프 */}
            <Text style={archetypeStyles.sectionLabel}>관계 온도 지표</Text>
            <View style={archetypeStyles.graphRow}>
              <View style={archetypeStyles.graphItem}>
                <Text style={archetypeStyles.graphLabel}>감정 온도 차이</Text>
                <View style={archetypeStyles.barBg}>
                  <View style={[archetypeStyles.barFill, { width: `${archetypeResult.temperatureGraph.emotionGap}%` as any, backgroundColor: '#9B7FD4' }]} />
                </View>
                <Text style={archetypeStyles.graphValue}>{archetypeResult.temperatureGraph.emotionGap}</Text>
              </View>
              <View style={archetypeStyles.graphItem}>
                <Text style={archetypeStyles.graphLabel}>표현 강도</Text>
                <View style={archetypeStyles.barBg}>
                  <View style={[archetypeStyles.barFill, { width: `${archetypeResult.temperatureGraph.expressionIntensity}%` as any, backgroundColor: '#F4A882' }]} />
                </View>
                <Text style={archetypeStyles.graphValue}>{archetypeResult.temperatureGraph.expressionIntensity}</Text>
              </View>
              <View style={archetypeStyles.graphItem}>
                <Text style={archetypeStyles.graphLabel}>회복 속도</Text>
                <View style={archetypeStyles.barBg}>
                  <View style={[archetypeStyles.barFill, { width: `${archetypeResult.temperatureGraph.recoverySpeed}%` as any, backgroundColor: '#5BC4A0' }]} />
                </View>
                <Text style={archetypeStyles.graphValue}>{archetypeResult.temperatureGraph.recoverySpeed}</Text>
              </View>
            </View>

            <View style={archetypeStyles.divider} />

            {/* 표현 속도 시각화 */}
            <Text style={archetypeStyles.sectionLabel}>{isSimilarRelation ? '두 사람의 표현 방식' : '표현 속도 차이'}</Text>
            <View style={archetypeStyles.speedRow}>
              <View style={archetypeStyles.speedBox}>
                <Text style={archetypeStyles.speedIcon}>{getExprIcon(archetypeResult.expressionSpeed.personA)}</Text>
                <Text style={archetypeStyles.speedPersonLabel}>첫 번째 사람</Text>
                <Text style={archetypeStyles.speedValue}>{archetypeResult.expressionSpeed.personA}</Text>
              </View>
              <Text style={archetypeStyles.speedArrow}>↔</Text>
              <View style={archetypeStyles.speedBox}>
                <Text style={archetypeStyles.speedIcon}>{getExprIcon(archetypeResult.expressionSpeed.personB)}</Text>
                <Text style={archetypeStyles.speedPersonLabel}>두 번째 사람</Text>
                <Text style={archetypeStyles.speedValue}>{archetypeResult.expressionSpeed.personB}</Text>
              </View>
            </View>
            <Text style={archetypeStyles.speedDesc}>{archetypeResult.expressionSpeed.description}</Text>

            <View style={archetypeStyles.divider} />

            {/* 회복 방식 아이콘 */}
            <Text style={archetypeStyles.sectionLabel}>회복 방식</Text>
            <View style={archetypeStyles.recoveryRow}>
              <Text style={archetypeStyles.recoveryIcon}>
                {archetypeResult.recoveryStyle.icon === 'alone' ? '🧘' :
                 archetypeResult.recoveryStyle.icon === 'talk' ? '💬' :
                 archetypeResult.recoveryStyle.icon === 'activity' ? '🏃' :
                 archetypeResult.recoveryStyle.icon === 'touch' ? '🤝' : '✨'}
              </Text>
              <View style={archetypeStyles.recoveryTextBox}>
                <Text style={archetypeStyles.recoveryLabel}>{archetypeResult.recoveryStyle.label}</Text>
                <Text style={archetypeStyles.recoveryDesc}>{archetypeResult.recoveryStyle.description}</Text>
              </View>
            </View>
                    </View>
            </>
          )}


          {/* 개인 마음 흐름 — 연인/부부 전용 (기타 관계는 lightArchetype 경로 안에서 이미 렌더링됨) */}
          {!lightArchetypeResult && (
            <>
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
              const cardBg = '#FBF7F2';
              const borderCol = cc.hex + '60';
              return (
                <View style={[styles.complementRow, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={[styles.complementDot, { backgroundColor: cc.hex, shadowColor: cc.hex }]} />
                  <View style={styles.complementText}>
                    <Text style={[styles.complementName, { color: cc.hex }]}>{cc.korName}</Text>
                    <Text style={[styles.complementMeaning, { color: '#4A3728', fontSize: 14, lineHeight: 24 }]}>{cc.meaning}</Text>
                  </View>
                </View>
              );
            })()}
            <Text style={[styles.coachingMessage, { color: colors.foreground, borderLeftColor: accentA + '80' }]}>
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
              const cardBg = '#FBF7F2';
              const borderCol = cc.hex + '60';
              return (
                <View style={[styles.complementRow, { backgroundColor: cardBg, borderColor: borderCol }]}>
                  <View style={[styles.complementDot, { backgroundColor: cc.hex, shadowColor: cc.hex }]} />
                  <View style={styles.complementText}>
                    <Text style={[styles.complementName, { color: cc.hex }]}>{cc.korName}</Text>
                    <Text style={[styles.complementMeaning, { color: '#4A3728', fontSize: 14, lineHeight: 24 }]}>{cc.meaning}</Text>
                  </View>
                </View>
              );
            })()}
            <Text style={[styles.coachingMessage, { color: colors.foreground, borderLeftColor: accentB + '80' }]}>
              {personBAnalysis.coachingMessage}
            </Text>
          </SectionCard>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════
              관계 통합 분석 (60%)
          ═══════════════════════════════════════════════════════ */}
                    <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 8 }]}>관계 통합 분석</Text>
          {/* archetype 기반 오해 패턴 + 연결 방식 — 연인/부부 전용 */}
          {!lightArchetypeResult && (<>

          {/* 두 사람 프로파일 대비 요약 — 끌림 이유 + 반복 패턴 + 해법 (archetype 오버라이드 우선) */}
          <SectionCard accentColor={accentCouple} label={getRelSectionLabel()} title={getRelSectionTitle()} colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult?.profileContrastOverride?.attractionContrast ?? coupleAnalysis.profileContrast}</Text>
          </SectionCard>

          {/* ─── 생활 관계 섹션 (컬러+도형 조합 기반) — 왜 끌리는데 왜 힘든지 바로 다음 ─── */}
          {archetypeResult.lifestyleSections && (
            <>
              <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 4 }]}>생활 속 관계 패턴</Text>
              {/* 재정 스타일 */}
              {archetypeResult.lifestyleSections.finance && (
                <SectionCard accentColor='#F5A623' label='생활 패턴' title={archetypeResult.lifestyleSections.finance.title} colors={colors}>
                  <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.lifestyleSections.finance.description}</Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <View style={{ backgroundColor: '#4A3A2A', borderRadius: 10, padding: 14 }}>
                      <Text style={{ color: '#F0E8DC', fontSize: 15, lineHeight: 26, fontStyle: 'italic' }}>
                        첫 번째 사람: {archetypeResult.lifestyleSections.finance.personA}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#3A2A3A', borderRadius: 10, padding: 14 }}>
                      <Text style={{ color: '#F0E0F0', fontSize: 15, lineHeight: 26, fontStyle: 'italic' }}>
                        두 번째 사람: {archetypeResult.lifestyleSections.finance.personB}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#FFE8C0', borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: '#D4820A' }}>
                      <Text style={{ color: '#5A3000', fontSize: 14, lineHeight: 24 }}>
                        {archetypeResult.lifestyleSections.finance.tension}
                      </Text>
                    </View>
                  </View>
                </SectionCard>
              )}
              {/* 청소·정리 스타일 */}
              {archetypeResult.lifestyleSections.cleaning && (
                <SectionCard accentColor='#7EC8A4' label='생활 패턴' title={archetypeResult.lifestyleSections.cleaning.title} colors={colors}>
                  <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.lifestyleSections.cleaning.description}</Text>
                  <View style={{ gap: 8, marginTop: 8 }}>
                    <View style={{ backgroundColor: '#2A3A2A', borderRadius: 10, padding: 14 }}>
                      <Text style={{ color: '#E0F0E4', fontSize: 15, lineHeight: 26, fontStyle: 'italic' }}>
                        첫 번째 사람: {archetypeResult.lifestyleSections.cleaning.personA}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#3A2A3A', borderRadius: 10, padding: 14 }}>
                      <Text style={{ color: '#F0E0F0', fontSize: 15, lineHeight: 26, fontStyle: 'italic' }}>
                        두 번째 사람: {archetypeResult.lifestyleSections.cleaning.personB}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#D8F5E8', borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: '#3A9A6A' }}>
                      <Text style={{ color: '#1A4A2A', fontSize: 14, lineHeight: 24 }}>
                        {archetypeResult.lifestyleSections.cleaning.tension}
                      </Text>
                    </View>
                  </View>
                </SectionCard>
              )}
              {/* 휴식·회복 방식 */}
              {archetypeResult.lifestyleSections.rest && (
                <SectionCard accentColor='#8BB8E8' label='생활 패턴' title={archetypeResult.lifestyleSections.rest.title} colors={colors}>
                  <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.lifestyleSections.rest.description}</Text>
                  <View style={{ gap: 10, marginTop: 10 }}>
                    <View style={{ backgroundColor: '#2A3040', borderRadius: 10, padding: 14 }}>
                      <Text style={{ color: '#DCE8F8', fontSize: 15, lineHeight: 26, fontStyle: 'italic' }}>
                        첫 번째 사람: {archetypeResult.lifestyleSections.rest.personA}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#3A2A3A', borderRadius: 10, padding: 14 }}>
                      <Text style={{ color: '#F0E0F0', fontSize: 15, lineHeight: 26, fontStyle: 'italic' }}>
                        두 번째 사람: {archetypeResult.lifestyleSections.rest.personB}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#D8EEFF', borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: '#5080C0' }}>
                      <Text style={{ color: '#1A3060', fontSize: 14, lineHeight: 24 }}>
                        {archetypeResult.lifestyleSections.rest.tension}
                      </Text>
                    </View>
                  </View>
                </SectionCard>
              )}
              {/* 애정 표현 방식 */}
              {archetypeResult.lifestyleSections.affection && (
                <SectionCard accentColor='#E8A0B4' label='생활 패턴' title={archetypeResult.lifestyleSections.affection.title} colors={colors}>
                  <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.lifestyleSections.affection.description}</Text>
                  <View style={{ gap: 10, marginTop: 10 }}>
                    <View style={{ backgroundColor: '#3A2030', borderRadius: 10, padding: 14 }}>
                      <Text style={{ color: '#F8DCE8', fontSize: 15, lineHeight: 26, fontStyle: 'italic' }}>
                        첫 번째 사람: {archetypeResult.lifestyleSections.affection.personA}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#3A2A3A', borderRadius: 10, padding: 14 }}>
                      <Text style={{ color: '#F0E0F0', fontSize: 15, lineHeight: 26, fontStyle: 'italic' }}>
                        두 번째 사람: {archetypeResult.lifestyleSections.affection.personB}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#FFE0EC', borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: '#C05080' }}>
                      <Text style={{ color: '#5A1030', fontSize: 14, lineHeight: 24 }}>
                        💡 {archetypeResult.lifestyleSections.affection.tip}
                      </Text>
                    </View>
                  </View>
                </SectionCard>
              )}
              {/* 갈등 직후 반응 */}
              {archetypeResult.lifestyleSections.conflict && (
                <SectionCard accentColor='#C47E8A' label='생활 패턴' title={archetypeResult.lifestyleSections.conflict.title} colors={colors}>
                  <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.lifestyleSections.conflict.description}</Text>
                  <View style={{ gap: 10, marginTop: 10 }}>
                    <View style={{ backgroundColor: '#3A2A2A', borderRadius: 10, padding: 14 }}>
                      <Text style={{ color: '#F8E8E0', fontSize: 15, lineHeight: 26, fontStyle: 'italic' }}>
                        첫 번째 사람: {archetypeResult.lifestyleSections.conflict.personA}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#3A2A3A', borderRadius: 10, padding: 14 }}>
                      <Text style={{ color: '#F0E0F0', fontSize: 15, lineHeight: 26, fontStyle: 'italic' }}>
                        두 번째 사람: {archetypeResult.lifestyleSections.conflict.personB}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#F5E8D0', borderRadius: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: '#B08050' }}>
                      <Text style={{ color: '#4A2800', fontSize: 14, lineHeight: 24 }}>
                        💡 {archetypeResult.lifestyleSections.conflict.tip}
                      </Text>
                    </View>
                  </View>
                </SectionCard>
              )}
            </>
          )}

          {/* ─── 관계 심층 분석 (unifiedSections 우선) ─── */}
          {archetypeResult.unifiedSections ? (
            <>
              {/* ══ 1. 관계 핵심 ══ */}
              <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 8 }]}>관계 핵심</Text>
              <SectionCard accentColor={accentCouple} label={archetypeResult.typeName} title={archetypeResult.unifiedSections.coreEnergy.headline} colors={colors}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {archetypeResult.unifiedSections.coreEnergy.keywords.map((kw: string, i: number) => (
                    <View key={i} style={{ backgroundColor: accentCouple + '18', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: accentCouple + '40' }}>
                      <Text style={{ color: accentCouple, fontSize: 12, fontWeight: '600' }}>{kw}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.bodyText, { color: colors.foreground, marginBottom: 0 }]}>{archetypeResult.unifiedSections.coreEnergy.description}</Text>
              </SectionCard>

              {/* ══ 2. 생활 관계 패턴 ══ */}
              <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 8 }]}>생활 속 관계 패턴</Text>
              <SectionCard accentColor="#B8A898" label={archetypeResult.typeName} title={archetypeResult.unifiedSections.lifePattern.headline} colors={colors}>
                {archetypeResult.unifiedSections.lifePattern.items.map((item: { icon: string; label: string; personA: string; personB: string; tension: string }, idx: number) => (
                  <View key={idx}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 18, marginRight: 8 }}>{item.icon}</Text>
                      <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700' }}>{item.label}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <View style={{ flex: 1, backgroundColor: '#4A3020', borderRadius: 8, padding: 12 }}>
                        <Text style={{ color: accentA, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>첫 번째 사람</Text>
                        <Text style={{ color: '#F0E8DC', fontSize: 14, lineHeight: 22 }}>{item.personA}</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: '#2A2040', borderRadius: 8, padding: 12 }}>
                        <Text style={{ color: accentB, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>두 번째 사람</Text>
                        <Text style={{ color: '#E8E0F8', fontSize: 14, lineHeight: 22 }}>{item.personB}</Text>
                      </View>
                    </View>
                    {item.tension ? (
                      <View style={{ backgroundColor: '#FFE8C0', borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: '#D4820A', marginBottom: 6 }}>
                        <Text style={{ color: '#7A4A00', fontSize: 13, lineHeight: 20 }}>⚡ {item.tension}</Text>
                      </View>
                    ) : null}
                    {idx < archetypeResult.unifiedSections!.lifePattern.items.length - 1 && (
                      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
                    )}
                  </View>
                ))}
              </SectionCard>

              {/* ══ 3. 싸움 패턴 ══ */}
              <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 8 }]}>싸움 패턴</Text>
              <SectionCard accentColor="#C47E8A" label={archetypeResult.typeName} title="이 관계의 갈등 흐름" colors={colors}>
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#C47E8A', fontSize: 11, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 }}>싸움이 시작되는 순간</Text>
                  <Text style={[styles.bodyText, { color: colors.foreground, marginBottom: 0 }]}>{archetypeResult.unifiedSections.conflictFlow.trigger}</Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ color: '#C47E8A', fontSize: 11, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 }}>갈등 직후 반응</Text>
                  <Text style={[styles.bodyText, { color: colors.foreground, marginBottom: 0 }]}>{archetypeResult.unifiedSections.conflictFlow.reaction}</Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 10 }} />
                <View style={{ backgroundColor: '#FFDDDD', borderRadius: 8, padding: 14, borderLeftWidth: 3, borderLeftColor: '#C03030', marginBottom: 12 }}>
                  <Text style={{ color: '#801010', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>⚠ 반복 위험 패턴</Text>
                  <Text style={{ color: '#2A0A0A', fontSize: 15, lineHeight: 26 }}>{archetypeResult.unifiedSections.conflictFlow.danger}</Text>
                </View>
                <View>
                  <Text style={{ color: '#A0506A', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>싸울 때 하면 안 되는 말</Text>
                  {archetypeResult.unifiedSections.conflictFlow.forbiddenWords.map((word: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
                      <Text style={{ color: '#C03030', fontSize: 14, marginRight: 8, lineHeight: 24, fontWeight: '700' }}>✗</Text>
                      <Text style={{ color: colors.foreground, fontSize: 14, lineHeight: 24, flex: 1 }}>{word}</Text>
                    </View>
                  ))}
                </View>
              </SectionCard>

              {/* ══ 4. 연결 방식 ══ */}
              <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 8 }]}>연결 방식</Text>
              <SectionCard accentColor="#E8A0B4" label={archetypeResult.typeName} title={archetypeResult.unifiedSections.connectionFlow.headline} colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground, marginBottom: 12 }]}>{archetypeResult.unifiedSections.connectionFlow.description}</Text>
                <View style={{ marginBottom: 12 }}>
                  {archetypeResult.unifiedSections.connectionFlow.actions.map((action: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#C47E8A', marginTop: 9, marginRight: 10 }} />
                      <Text style={{ color: colors.foreground, fontSize: 15, lineHeight: 26, flex: 1 }}>{action}</Text>
                    </View>
                  ))}
                </View>
                {archetypeResult.unifiedSections.connectionFlow.skinshipNote ? (
                  <View style={{ backgroundColor: '#FFE0EC', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#D4607880' }}>
                    <Text style={{ color: '#8A2040', fontSize: 12, fontWeight: '700', marginBottom: 8 }}>스킨십 · 친밀감</Text>
                    <Text style={{ color: '#2A0A14', fontSize: 15, lineHeight: 26 }}>{archetypeResult.unifiedSections.connectionFlow.skinshipNote}</Text>
                  </View>
                ) : null}
              </SectionCard>

              {/* ══ 5. 성장 포인트 ══ */}
              <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 8 }]}>관계 성장 포인트</Text>
              <SectionCard accentColor="#5BC4A0" label={archetypeResult.typeName} title="이 관계가 오래가는 이유 & 성장 방향" colors={colors}>
                <View style={{ backgroundColor: '#D8F5E8', borderRadius: 10, padding: 16, borderLeftWidth: 3, borderLeftColor: '#3A9A6A', marginBottom: 12 }}>
                  <Text style={{ color: '#1A5A3A', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>이 관계의 강점</Text>
                  <Text style={{ color: '#1A3A2A', fontSize: 15, lineHeight: 26 }}>{archetypeResult.unifiedSections.growthPoint.strength}</Text>
                </View>
                <View style={{ backgroundColor: '#F5E8D0', borderRadius: 10, padding: 16, borderLeftWidth: 3, borderLeftColor: '#B08050', marginBottom: 12 }}>
                  <Text style={{ color: '#6B4020', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>조금 더 의식하면</Text>
                  <Text style={{ color: '#3A2010', fontSize: 15, lineHeight: 26 }}>{archetypeResult.unifiedSections.growthPoint.blindSpot}</Text>
                </View>
                <View style={{ backgroundColor: '#E8DCFF', borderRadius: 10, padding: 16, borderLeftWidth: 3, borderLeftColor: '#7A50C4', marginBottom: 12 }}>
                  <Text style={{ color: '#4A2A7A', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }}>함께 성장해야 할 방향</Text>
                  <Text style={{ color: '#2A1050', fontSize: 15, lineHeight: 26 }}>{archetypeResult.unifiedSections.growthPoint.growthDirection}</Text>
                </View>
                <View style={{ backgroundColor: '#2A3A2A', borderRadius: 10, padding: 16, borderWidth: 1.5, borderColor: accentCouple + '60' }}>
                  <Text style={{ color: accentCouple, fontSize: 13, fontWeight: '700', marginBottom: 6 }}>💡 오늘 해볼 수 있는 것</Text>
                  <Text style={{ color: '#E8F4EC', fontSize: 15, lineHeight: 26 }}>{archetypeResult.unifiedSections.growthPoint.tip}</Text>
                </View>
              </SectionCard>
            </>
          ) : (
            <>
          {/* ─── 기존 관계 심층 분석 (unifiedSections 없을 때 폴백) ─── */}
          <Text style={[styles.sectionGroupTitle, { color: colors.muted, marginTop: 8 }]}>관계 심층 분석</Text>
          <SectionCard accentColor="#9B7FD4" label={archetypeResult.typeName} title="갈등 순간 반응 패턴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              {archetypeResult.conflictReactionPattern ?? archetypeResult.misunderstandingPattern}
            </Text>
          </SectionCard>
          <SectionCard accentColor={accentCouple} label="관계 흐름" title="두 사람의 관계 패턴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult?.profileContrastOverride?.relationFlow ?? coupleAnalysis.relationFlow}</Text>
          </SectionCard>
          <SectionCard accentColor={accentCouple} label="표현 & 오해" title={isSimilarRelation ? '두 사람의 표현 방식과 오해 지점' : '서로 다른 표현 방식'} colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground, marginBottom: 4 }]}>
              {archetypeResult?.profileContrastOverride?.expressionDifference ?? coupleAnalysis.expressionDifference}
            </Text>
            <View style={[sectionStyles.divider, { backgroundColor: accentCouple + '30', marginVertical: 6 }]} />
            <Text style={[styles.bodyText, { color: colors.foreground, marginBottom: 0, fontStyle: 'italic', fontSize: 13 }]}>
              <Text style={{ fontWeight: '700', fontStyle: 'normal' }}>{isSimilarRelation ? '닮은 에너지가 만날 때  ' : '오해가 생기는 순간  '}</Text>
              {archetypeResult?.profileContrastOverride?.conflictPattern ?? coupleAnalysis.conflictPattern}
            </Text>
          </SectionCard>
          <SectionCard accentColor="#9B7FD4" label={archetypeResult.typeName} title="지금 이 말이 필요합니다" colors={colors}>
            <View style={[styles.neededRow, { backgroundColor: '#9B7FD415', borderColor: '#9B7FD440' }]}>
              <Text style={[styles.neededText, { color: colors.foreground }]}>{archetypeResult.neededWords}</Text>
            </View>
          </SectionCard>
          <SectionCard accentColor="#B8A9C9" label="서로에게 필요한 말" title="두 사람의 표현 언어" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult?.profileContrastOverride?.expressionDifference ?? coupleAnalysis.expressionDifference}</Text>
          </SectionCard>
          <SectionCard accentColor="#9B7FD4" label={archetypeResult.typeName} title="이 관계의 회복 루틴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.affectionRoutine}</Text>
          </SectionCard>
          <SectionCard accentColor={accentCouple} title="대화 & 연결 루틴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult?.profileContrastOverride?.relationFlow ?? coupleAnalysis.relationFlow}</Text>
          </SectionCard>
          <SectionCard accentColor="#F4A882" label={archetypeResult.typeName} title="사랑과 연결 방식" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.loveConnectionStyle ?? archetypeResult.connectionStyle}</Text>
          </SectionCard>
          <SectionCard accentColor="#9B6EA8" label={archetypeResult.typeName} title="반복되기 쉬운 감정 패턴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.dangerPattern}</Text>
          </SectionCard>
          <SectionCard accentColor="#E05C5C" label={archetypeResult.typeName} title="싸울 때 하면 안 되는 말" colors={colors}>
            {archetypeResult.forbiddenWords.map((word: string, i: number) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                <Text style={{ color: '#E05C5C', fontSize: 13, marginRight: 6, lineHeight: 20 }}>✗</Text>
                <Text style={{ color: colors.foreground, fontSize: 13, lineHeight: 20, flex: 1 }}>{word}</Text>
              </View>
            ))}
          </SectionCard>
          <SectionCard accentColor="#5BC4A0" label={archetypeResult.typeName} title="이 관계가 오래가는 이유" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground, marginBottom: 0 }]}>{archetypeResult.relationStrength}</Text>
          </SectionCard>
          {archetypeResult.intimacyConnection && (
            <SectionCard accentColor="#E8A0B4" label="관계 회복 언어" title="두 사람에게 필요한 연결 언어" colors={colors}>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>
                {relationType === '부부'
                  ? archetypeResult.intimacyConnection.marriageNote
                  : archetypeResult.intimacyConnection.loverNote}
              </Text>
            </SectionCard>
          )}
            </>
          )}
          {/* 추천 컬러 - archetype 기반 우선, 없으면 기존 컬러 사용 */}
          <SectionCard accentColor={accentCouple} title="두 사람에게 권하는 컬러" colors={colors}>
            {(archetypeResult.recommendedColors ?? coupleAnalysis.coupleRoutine.recommendedColors).map(rc => {
              // ivory/cream 기반: 항상 밝은 배경, 컬러만 선명하게
              return (
                <View key={rc.id} style={[styles.complementRow, { backgroundColor: '#FBF7F2', borderColor: rc.hex + '60' }]}>
                  <View style={[styles.complementDot, { backgroundColor: rc.hex, shadowColor: rc.hex }]} />
                  <View style={styles.complementText}>
                    <Text style={[styles.complementName, { color: rc.hex }]}>{rc.korName}</Text>
                    <Text style={[styles.complementMeaning, { color: '#4A3728', fontSize: 14, lineHeight: 24 }]}>{rc.reason}</Text>
                  </View>
                </View>
              );
            })}
          </SectionCard>
          {/* 연인/부부 전용 풀 archetype 블록 닫기 */}
          </>)}
          {/* ═══════════════════════════════════════════════════════
              커플/부부 관계 감성 안내문 (회복 루틴 위)
          ═══════════════════════════════════════════════════════ */}
          {isRomanticRel && (
            <View style={{
              marginHorizontal: 0,
              marginBottom: 12,
              paddingVertical: 24,
              paddingHorizontal: 22,
              borderRadius: 18,
              backgroundColor: relationType === '부부' ? '#1C1A2E' : '#1A1E2C',
              borderWidth: 1,
              borderColor: relationType === '부부' ? '#8B7BB0' + '55' : '#7BA8C4' + '55',
            }}>
              {relationType === '부부' ? (
                <>
                  <Text style={{
                    fontSize: 15,
                    lineHeight: 26,
                    color: '#E8DEFF',
                    fontWeight: '500',
                    textAlign: 'center',
                    marginBottom: 16,
                  }}>
                    {'건강한 관계는\n신뢰, 이해, 배려, 존중 위에서 자라갑니다.'}
                  </Text>
                  <View style={{ height: 1, backgroundColor: '#8B7BB0' + '40', marginBottom: 16 }} />
                  <Text style={{
                    fontSize: 14,
                    lineHeight: 24,
                    color: '#C8B8E8',
                    textAlign: 'center',
                    marginBottom: 14,
                  }}>
                    {'부부관계에서 스킨십은\n서로의 마음을 연결하고\n안정감을 나누는 소통입니다.'}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    lineHeight: 22,
                    color: '#A898C8',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}>
                    {'따뜻한 손길과 자연스러운 스킨십은\n말로 표현되지 않는 감정을 전하고,\n서로에게 안정감과 위로를 전해주기도 합니다.'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{
                    fontSize: 15,
                    lineHeight: 26,
                    color: '#DCEEFF',
                    fontWeight: '500',
                    textAlign: 'center',
                    marginBottom: 16,
                  }}>
                    {'건강한 관계는\n신뢰, 이해, 배려, 존중 위에서 자라갑니다.'}
                  </Text>
                  <View style={{ height: 1, backgroundColor: '#7BA8C4' + '40', marginBottom: 16 }} />
                  <Text style={{
                    fontSize: 14,
                    lineHeight: 24,
                    color: '#B8D4E8',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}>
                    {'자연스러운 애정표현과 스킨십은\n서로의 마음을 더 깊이 이해하고\n안정감과 친밀감을 나누게 합니다.'}
                  </Text>
                </>
              )}
            </View>
          )}
          {/* ═══════════════════════════════════════════════════════
              함께하면 좋은 회복 루틴
          ═══════════════════════════════════════════════════════ */}
          {(lightArchetypeResult?.togetherRoutine ?? archetypeResult.togetherRoutine) && (() => {
            const tr = lightArchetypeResult?.togetherRoutine ?? archetypeResult.togetherRoutine;
            const hasFaith = sessionData?.personA.info.faith === '기독교' || sessionData?.personB.info.faith === '기독교';
            return (
              <View style={[styles.togetherRoutineCard, { borderColor: accentCouple + '50' }]}>
                <Text style={[styles.togetherRoutineTitle, { color: accentCouple }]}>🌿 함께하면 좋은 회복 루틴</Text>
                <View style={styles.togetherRoutineList}>
                  {tr.routines.map((routine: string, i: number) => (
                    <View key={i} style={styles.togetherRoutineItem}>
                      <View style={[styles.togetherRoutineDot, { backgroundColor: accentCouple }]} />
                      <Text style={[styles.togetherRoutineText, { color: '#F0E8DC' }]}>{routine}</Text>
                    </View>
                  ))}
                  {hasFaith && tr.faithRoutine && (
                    <View style={styles.togetherRoutineItem}>
                      <View style={[styles.togetherRoutineDot, { backgroundColor: '#D4AF37' }]} />
                      <Text style={[styles.togetherRoutineText, { color: '#F0E8DC' }]}>{tr.faithRoutine}</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.togetherEnergyBox, { borderColor: accentCouple + '40' }]}>
                  <Text style={[styles.togetherEnergyLabel, { color: accentCouple }]}>✨ 함께하면 살아나는 에너지</Text>
                  <Text style={styles.togetherEnergyText}>{tr.energyNote}</Text>
                </View>
              </View>
            );
          })()}
          {/* ═══════════════════════════════════════════════════════
              마무리 코칭 메시지
          ═══════════════════════════════════════════════════════ */}
          <View style={[styles.closingCard, { backgroundColor: '#2A2420', borderColor: accentCouple + '60' }]}>
            <Text style={[styles.closingLabel, { color: accentCouple }]}>마무리 코칭 메시지</Text>
            <Text style={[styles.closingMessage, { color: '#F8F3EA' }]}>
              {lightArchetypeResult
                ? lightArchetypeResult.closingMessage
                : (archetypeResult.closingMessage ?? coupleAnalysis.closingMessage)}
            </Text>
          </View>

        </View>

        {/* 하단 버튼 */}
        <Pressable
          style={[styles.restartBtn, { backgroundColor: accentCouple }]}
          onPress={() => router.push('/(tabs)/couple-start' as any)}
        >
          <Text style={styles.restartBtnText}>새로운 커플 세션 시작</Text>
        </Pressable>

        <Pressable
          style={[styles.shareBtn, { borderColor: accentCouple + '80', backgroundColor: accentCouple + '15' }]}
          onPress={async () => {
            try {
              const { Share } = await import('react-native');
              await Share.share({ message: '휴심컬러 커플 세션 결과를 확인해보세요!' });
            } catch {}
          }}
        >
          <Text style={[styles.shareBtnText, { color: accentCouple }]}>결과 공유하기</Text>
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
    fontSize: 13, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: 12, marginTop: 4,
  },
  bodyText: { fontSize: 15, lineHeight: 28 },
  complementRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 1.5, padding: 16, marginTop: 10,
    // soft shadow for card depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  complementDot: {
    width: 52, height: 52, borderRadius: 26,
    marginRight: 0,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  complementText: { flex: 1, gap: 4 },
  complementName: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  complementMeaning: { fontSize: 14, lineHeight: 24 },
  coachingMessage: {
    fontSize: 15, lineHeight: 28, fontStyle: 'italic',
    borderLeftWidth: 3, paddingLeft: 14, marginTop: 8,
  },
  neededRow: { borderRadius: 10, borderWidth: 1, padding: 12 },
  neededText: { fontSize: 15, lineHeight: 28, fontStyle: 'italic' },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  bullet: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 26 },
  closingCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 24, marginBottom: 20, gap: 12,
    alignItems: 'center',
  },
  closingLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.8 },
  closingMessage: {
    fontSize: 16, lineHeight: 32, textAlign: 'center', fontStyle: 'italic',
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

  // ─── 함께하면 좋은 회복 루틴 ────────────────────────────────────
  togetherRoutineCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 22, marginBottom: 20,
    backgroundColor: '#2A2420',
    gap: 14,
  },
  togetherRoutineTitle: {
    fontSize: 17, fontWeight: '700', marginBottom: 4,
  },
  togetherRoutineList: { gap: 10 },
  togetherRoutineItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  togetherRoutineDot: {
    width: 7, height: 7, borderRadius: 4, marginTop: 8, flexShrink: 0,
  },
  togetherRoutineText: {
    fontSize: 15, lineHeight: 26, flex: 1,
  },
  togetherEnergyBox: {
    borderRadius: 12, borderWidth: 1, padding: 16, gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 4,
  },
  togetherEnergyLabel: {
    fontSize: 13, fontWeight: '700', letterSpacing: 0.5,
  },
  togetherEnergyText: {
    fontSize: 15, lineHeight: 26, color: '#E8DED2',
  },
});

const shareCardStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    marginTop: -4,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

const archetypeStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 20,
    gap: 12,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeBadge: {
    backgroundColor: '#9B7FD4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#5B3FA0',
    letterSpacing: 0.2,
  },
  coreSummary: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
    color: '#5B3FA0',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#C4B5E840',
    marginVertical: 4,
  },
  tensionText: {
    fontSize: 15,
    lineHeight: 26,
    color: '#3A2A1A',
    opacity: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#7A5FB0',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  },
  graphRow: {
    gap: 10,
  },
  graphItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  graphLabel: {
    fontSize: 13,
    color: '#4A3A6A',
    width: 80,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#D8D0F0',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  graphValue: {
    fontSize: 12,
    color: '#5B3FA0',
    fontWeight: '700',
    width: 24,
    textAlign: 'right' as const,
  },
  speedRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 8,
    marginBottom: 8,
  },
  speedBox: {
    flex: 1,
    alignItems: 'center' as const,
    backgroundColor: '#EDE5FF',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  speedIcon: {
    fontSize: 22,
  },
  speedPersonLabel: {
    fontSize: 11,
    color: '#7A5FB0',
    fontWeight: '600',
  },
  speedValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4A2E90',
    textAlign: 'center' as const,
  },
  speedArrow: {
    fontSize: 20,
    color: '#C4B5E8',
    fontWeight: '300',
  },
  speedDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: '#3A2A5A',
  },
  recoveryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    backgroundColor: '#EDE5FF',
    borderRadius: 12,
    padding: 16,
  },
  recoveryIcon: {
    fontSize: 32,
  },
  recoveryTextBox: {
    flex: 1,
    gap: 4,
  },
  recoveryLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4A2E90',
  },
  recoveryDesc: {
    fontSize: 14,
    lineHeight: 22,
    color: '#3A2A5A',
  },
});
