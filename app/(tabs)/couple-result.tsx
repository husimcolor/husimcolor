import React, { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  View, Text, ScrollView, StyleSheet, Pressable, Animated, Platform, Alert, TouchableOpacity,
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
          indigo:'cool_deep',violet:'cool_deep',black:'cool_deep',silver:'cool_deep',
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
          indigo:'cool_deep',violet:'cool_deep',black:'cool_deep',silver:'cool_deep',
          green:'nature',olive:'nature',sage:'nature',lavender:'nature',
          white:'neutral',yellow:'neutral',
        };
        return c ? (ENERGY_FAM[c.id] ?? 'neutral') : 'neutral';
      }) as any[];
      const shapeA3 = data.personA.cards[2] ? CARD_DATA.find((c: any) => c.id === data.personA.cards[2])?.shape : undefined;
      const shapeB3 = data.personB.cards[2] ? CARD_DATA.find((c: any) => c.id === data.personB.cards[2])?.shape : undefined;
      const archRes = getRelationArchetype(famsA, famsB, shapeA3, shapeB3);
      const lightRes = getLightArchetype(data.relationType, famsA, famsB);
      setPersonAAnalysis(aAnalysis);
      setPersonBAnalysis(bAnalysis);
      setCoupleAnalysis(cAnalysis);
      setArchetypeResult(archRes);
      setLightArchetypeResult(lightRes);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
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
  // archetype 유형별 대표 컬러 연동 (없으면 기본 세이지)
  const accentCouple = archetypeResult?.accentColor
    ?? lightArchetypeResult?.accentColor
    ?? '#8FA68E';
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
              관계 유형 핵심 요약 카드 (archetype)
          ═══════════════════════════════════════════════════════ */}
          {/* 경량 archetype (친구/부모자녀/형제자매/동료) */}
          {lightArchetypeResult && (
            <>
              {/* 핵심 한 줄 공유 카드 */}
              <ViewShot ref={shareCardRef} options={{ format: 'png', quality: 0.95 }}>
              <View style={[archetypeStyles.card, {
                backgroundColor: accentCouple + '18',
                borderColor: accentCouple + '60',
              }]}>
                <View style={archetypeStyles.typeRow}>
                  <View style={[archetypeStyles.typeBadge, { backgroundColor: accentCouple }]}>
                    <Text style={archetypeStyles.typeBadgeText}>관계 유형</Text>
                  </View>
                  <Text style={[archetypeStyles.typeName, { color: accentCouple }]}>{lightArchetypeResult.typeName}</Text>
                </View>
                <Text style={[archetypeStyles.coreSummary, { color: accentCouple }]}>❝ {lightArchetypeResult.coreSummary} ❞</Text>
                <View style={[archetypeStyles.divider, { backgroundColor: accentCouple + '40' }]} />
                <Text style={[archetypeStyles.tensionText, { color: colors.foreground }]}>{lightArchetypeResult.description}</Text>
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
              <SectionCard accentColor={accentCouple} label={lightArchetypeResult.typeName} title="이 관계의 오해 패턴" colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{lightArchetypeResult.misunderstandingPattern}</Text>
              </SectionCard>
              <SectionCard accentColor={accentCouple} label={lightArchetypeResult.typeName} title="연결 방식" colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{lightArchetypeResult.connectionStyle}</Text>
              </SectionCard>
              <SectionCard accentColor={accentCouple} label={lightArchetypeResult.typeName} title="대화 루틴" colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{lightArchetypeResult.conversationRoutine}</Text>
              </SectionCard>
              <SectionCard accentColor={accentCouple} label={lightArchetypeResult.typeName} title="관계 회복 루틴" colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{lightArchetypeResult.recoveryRoutine}</Text>
              </SectionCard>
              <SectionCard accentColor={accentCouple} label={lightArchetypeResult.typeName} title="이 관계가 오래가는 이유" colors={colors}>
                <Text style={[styles.bodyText, { color: colors.foreground }]}>{lightArchetypeResult.relationStrength}</Text>
              </SectionCard>
              {/* 경량 archetype 보완 컬러 */}
              {lightArchetypeResult.recommendedColors && lightArchetypeResult.recommendedColors.length > 0 && (
                <SectionCard accentColor={accentCouple} title="이 관계에 어울리는 컬러" colors={colors}>
                  {lightArchetypeResult.recommendedColors.map(rc => (
                    <View key={rc.id} style={[styles.complementRow, { backgroundColor: rc.hex + '18', borderColor: rc.hex + '40' }]}>
                      <View style={[styles.complementDot, { backgroundColor: rc.hex }]} />
                      <View style={styles.complementText}>
                        <Text style={[styles.complementName, { color: rc.hex }]}>{rc.korName}</Text>
                        <Text style={[styles.complementMeaning, { color: colors.muted }]}>{rc.reason}</Text>
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
            backgroundColor: accentCouple + '18',
            borderColor: accentCouple + '60',
          }]}>
            <View style={archetypeStyles.typeRow}>
              <View style={[archetypeStyles.typeBadge, { backgroundColor: accentCouple }]}>
                <Text style={archetypeStyles.typeBadgeText}>관계 유형</Text>
              </View>
              <Text style={[archetypeStyles.typeName, { color: accentCouple }]}>{archetypeResult.typeName}</Text>
            </View>
            <Text style={[archetypeStyles.coreSummary, { color: accentCouple }]}>❝ {archetypeResult.coreSummary} ❞</Text>
            <View style={[archetypeStyles.divider, { backgroundColor: accentCouple + '40' }]} />
            <Text style={[archetypeStyles.tensionText, { color: colors.foreground }]}>{archetypeResult.tensionDescription}</Text>
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
            <Text style={archetypeStyles.sectionLabel}>표현 속도 차이</Text>
            <View style={archetypeStyles.speedRow}>
              <View style={archetypeStyles.speedBox}>
                <Text style={archetypeStyles.speedIcon}>⚡</Text>
                <Text style={archetypeStyles.speedPersonLabel}>첫 번째 사람</Text>
                <Text style={archetypeStyles.speedValue}>{archetypeResult.expressionSpeed.personA}</Text>
              </View>
              <Text style={archetypeStyles.speedArrow}>↔</Text>
              <View style={archetypeStyles.speedBox}>
                <Text style={archetypeStyles.speedIcon}>🌙</Text>
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
          {/* archetype 기반 오해 패턴 + 연결 방식 — 연인/부부 전용 */}
          {!lightArchetypeResult && (<>
          <SectionCard accentColor='#9B7FD4' label={archetypeResult.typeName} title="이 관계의 오해 패턴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.misunderstandingPattern}</Text>
            <View style={[sectionStyles.divider, { backgroundColor: '#9B7FD430', marginTop: 4 }]} />
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              <Text style={{ fontWeight: '700' }}>연결 방식  </Text>
              {archetypeResult.connectionStyle}
            </Text>
          </SectionCard>

          {/* 두 사람 프로파일 대비 요약 — 끌림 이유 + 반복 패턴 + 해법 (archetype 오버라이드 우선) */}
          <SectionCard accentColor={accentCouple} label={getRelSectionLabel()} title={getRelSectionTitle()} colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult?.profileContrastOverride?.attractionContrast ?? coupleAnalysis.profileContrast}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="관계 흐름" title="두 사람의 관계 패턴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult?.profileContrastOverride?.relationFlow ?? coupleAnalysis.relationFlow}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="표현 방식" title="서로 다른 표현 방식" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult?.profileContrastOverride?.expressionDifference ?? coupleAnalysis.expressionDifference}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="오해 지점" title="오해가 생기는 순간" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult?.profileContrastOverride?.conflictPattern ?? coupleAnalysis.conflictPattern}</Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} label="가까워지는 방법" title="두 사람이 연결되는 방식" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult?.profileContrastOverride?.connectionStyle ?? coupleAnalysis.connectionStyle}</Text>
          </SectionCard>

          {/* archetype 기반 필요한 말 + 추천 활동 */}
          <SectionCard accentColor='#9B7FD4' label={archetypeResult.typeName} title="지금 이 말이 필요합니다" colors={colors}>
            <View style={[styles.neededRow, { backgroundColor: '#9B7FD415', borderColor: '#9B7FD440' }]}>
              <Text style={[styles.neededText, { color: colors.foreground }]}>{archetypeResult.neededWords}</Text>
            </View>
            <View style={[sectionStyles.divider, { backgroundColor: '#9B7FD430', marginTop: 8 }]} />
            <Text style={[styles.bodyText, { color: colors.muted, fontSize: 13 }]}>
              <Text style={{ fontWeight: '700', color: colors.foreground }}>추천 활동  </Text>
              {archetypeResult.recommendedActivity}
            </Text>
          </SectionCard>

          {/* 서로에게 필요한 표현 */}
          <SectionCard accentColor='#B8A9C9' label="서로에게 필요한 말" title="두 사람의 표현 언어" colors={colors}>
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

          {/* archetype 기반 회복 루틴 + 감정 회복 방식 */}
          <SectionCard accentColor='#9B7FD4' label={archetypeResult.typeName} title="이 관계의 회복 루틴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.recoveryRoutine}</Text>
            <View style={[sectionStyles.divider, { backgroundColor: '#9B7FD430', marginTop: 4 }]} />
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              <Text style={{ fontWeight: '700' }}>감정 회복 방식  </Text>
              {archetypeResult.emotionRecoveryStyle}
            </Text>
          </SectionCard>

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
              {archetypeResult.emotionRoutine ?? coupleAnalysis.coupleRoutine.emotionRecovery}
            </Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} title="대화 루틴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              {archetypeResult.conversationRoutine ?? coupleAnalysis.coupleRoutine.conversationRoutine}
            </Text>
          </SectionCard>

          <SectionCard accentColor={accentCouple} title="정서적 연결 루틴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              {archetypeResult.connectionRoutine ?? coupleAnalysis.coupleRoutine.connectionRoutine}
            </Text>
          </SectionCard>

          <SectionCard accentColor='#F4A882' title="애정 표현 루틴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>
              {archetypeResult.affectionRoutine ?? coupleAnalysis.coupleRoutine.affectionRoutine ?? ''}
            </Text>
          </SectionCard>

          {/* 현실 감정 섹션 — realEmotions가 있는 유형에만 표시 */}
          {archetypeResult.realEmotions && (
            <SectionCard accentColor='#9B8EA8' label={archetypeResult.typeName} title="이 관계에서 올라올 수 있는 감정" colors={colors}>
              <View style={{ gap: 8, marginBottom: 12 }}>
                {archetypeResult.realEmotions.feelings.map((feeling, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <Text style={{ color: '#9B8EA8', fontSize: 14, lineHeight: 22, marginTop: 1 }}>•</Text>
                    <Text style={[styles.bodyText, { color: colors.foreground, flex: 1, marginBottom: 0 }]}>{feeling}</Text>
                  </View>
                ))}
              </View>
              <View style={{
                backgroundColor: '#9B8EA8' + '18',
                borderLeftWidth: 3,
                borderLeftColor: '#9B8EA8',
                borderRadius: 6,
                padding: 12,
                marginTop: 4,
              }}>
                <Text style={[styles.bodyText, { color: colors.foreground, marginBottom: 0, lineHeight: 22 }]}>
                  {archetypeResult.realEmotions.recoveryBridge}
                </Text>
              </View>
            </SectionCard>
          )}

          {/* ═══════════════════════════════════════════════════════
              위험 패턴 / 금지 표현 / 관계 강점
          ═══════════════════════════════════════════════════════ */}
          <SectionCard accentColor='#E05C5C' label={archetypeResult.typeName} title="이 관계의 위험 패턴" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.dangerPattern}</Text>
          </SectionCard>

          <SectionCard accentColor='#E05C5C' label={archetypeResult.typeName} title="싸울 때 하면 안 되는 말" colors={colors}>
            {archetypeResult.forbiddenWords.map((word, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={[styles.bullet, { color: '#E05C5C' }]}>✕</Text>
                <Text style={[styles.bulletText, { color: colors.foreground }]}>{word}</Text>
              </View>
            ))}
          </SectionCard>

          <SectionCard accentColor='#5BC4A0' label={archetypeResult.typeName} title="이 관계가 오래가는 이유" colors={colors}>
            <Text style={[styles.bodyText, { color: colors.foreground }]}>{archetypeResult.relationStrength}</Text>
          </SectionCard>

          {/* 친밀감 연결 — 연인/부부 전용 */}
          {isRomanticRel && archetypeResult.intimacyConnection && (
            <SectionCard accentColor='#E8A0B4' label='관계 회복 언어' title="두 사람의 연결 방식" colors={colors}>
              <Text style={[styles.bodyText, { color: colors.foreground, marginBottom: 10 }]}>
                {relationType === '부부'
                  ? archetypeResult.intimacyConnection.marriageNote
                  : archetypeResult.intimacyConnection.loverNote}
              </Text>
              <View style={{ gap: 6, marginTop: 4 }}>
                {archetypeResult.intimacyConnection.actions.map((action, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E8A0B4' }} />
                    <Text style={[styles.bodyText, { color: colors.foreground, flex: 1, marginBottom: 0 }]}>{action}</Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          )}
          {/* 추천 컬러 - archetype 기반 우선, 없으면 기존 컬러 사용 */}
          <SectionCard accentColor={accentCouple} title="두 사람에게 권하는 컬러" colors={colors}>
            {(archetypeResult.recommendedColors ?? coupleAnalysis.coupleRoutine.recommendedColors).map(rc => (
              <View key={rc.id} style={[styles.complementRow, { backgroundColor: rc.hex + '18', borderColor: rc.hex + '40' }]}>
                <View style={[styles.complementDot, { backgroundColor: rc.hex }]} />
                <View style={styles.complementText}>
                  <Text style={[styles.complementName, { color: rc.hex }]}>{rc.korName}</Text>
                  <Text style={[styles.complementMeaning, { color: colors.muted }]}>{rc.reason}</Text>
                </View>
              </View>
            ))}
          </SectionCard>
          {/* 연인/부부 전용 풀 archetype 블록 닫기 */}
          </>)}
          {/* ═══════════════════════════════════════════════════════
              마무리 코칭 메시지
          ═══════════════════════════════════════════════════════ */}
          <View style={[styles.closingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.closingLabel, { color: accentCouple }]}>마무리 코칭 메시지</Text>
            <Text style={[styles.closingMessage, { color: colors.foreground }]}>
              {lightArchetypeResult
                ? lightArchetypeResult.closingMessage
                : (archetypeResult.closingMessage ?? coupleAnalysis.closingMessage)}
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
    fontSize: 13.5,
    lineHeight: 24,
    color: '#4A3570',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#9B7FD4',
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
    fontSize: 12,
    color: '#6B5A8A',
    width: 80,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#EDE8F8',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  graphValue: {
    fontSize: 11,
    color: '#9B7FD4',
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
    backgroundColor: '#F5F0FF',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  speedIcon: {
    fontSize: 22,
  },
  speedPersonLabel: {
    fontSize: 10,
    color: '#9B7FD4',
    fontWeight: '600',
  },
  speedValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5B3FA0',
    textAlign: 'center' as const,
  },
  speedArrow: {
    fontSize: 20,
    color: '#C4B5E8',
    fontWeight: '300',
  },
  speedDesc: {
    fontSize: 12.5,
    lineHeight: 20,
    color: '#6B5A8A',
  },
  recoveryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 14,
    backgroundColor: '#F5F0FF',
    borderRadius: 12,
    padding: 14,
  },
  recoveryIcon: {
    fontSize: 32,
  },
  recoveryTextBox: {
    flex: 1,
    gap: 4,
  },
  recoveryLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5B3FA0',
  },
  recoveryDesc: {
    fontSize: 12.5,
    lineHeight: 20,
    color: '#6B5A8A',
  },
});
