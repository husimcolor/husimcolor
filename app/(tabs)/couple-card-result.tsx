/**
 * 커플 세션 카드 해석 중간 결과 화면 (2단계 심화 코칭)
 * - 카드 3장 개별 해석 (무의식·현재·미래 위치별)
 * - 무의식→현재→미래 통합 흐름 분석
 * - 카드 기반 코칭 메시지
 * - 보완 루틴 (호흡 / 휴식 / 관계 / 감정표현)
 * - A 완료 후 → B 컬러 선택으로 이동
 * - B 완료 후 → 커플 통합 결과로 이동
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  TouchableOpacity, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CARD_DATA } from '@/constants/cardData';
import { COLOR_DATA } from '@/constants/colorData';
import type { CoupleSessionData, PersonSession } from '@/constants/coupleData';
import { splitCoupleReadableParagraphs } from '@/lib/couple-readable-text';
import { buildRelationshipCardFlow, buildRelationshipCardNarrative } from '@/lib/relationship-copy-revision';
import { trpc } from '@/lib/trpc';

const POSITION_LABELS = ['무의식 · 내면 에너지', '현재 현실 에너지', '미래 · 회복 · 희망 에너지'];
const POSITION_DESCS = [
  '지금 의식하지 못하는 내면 깊은 곳의 에너지입니다.',
  '현재 현실에서 드러나는 심리 흐름입니다.',
  '앞으로 회복하고 나아갈 방향의 에너지입니다.',
];
const POSITION_COLORS = ['#3D6B3D', '#B5A0C8', '#C4956A'];
type CardItem = (typeof CARD_DATA)[number];

// 카드 3장 흐름 통합 분석 생성
// 선택을 성격·속마음의 사실처럼 단정하지 않고, 현재의 관계 경험을
// 돌아볼 수 있는 짧고 구체적인 문장으로 읽는다.
function buildCardFlowAnalysis(
  cards: typeof CARD_DATA,
  prevColors: { korName: string; hex: string }[],
  faith: string
): { flow: string; coaching: string; routine: string } {
  const selectedColors = prevColors
    .map((color) => COLOR_DATA.find((item) => item.korName === color.korName))
    .filter((color): color is NonNullable<typeof color> => Boolean(color));
  const selectedCards = cards.slice(0, 3);
  return buildRelationshipCardFlow(selectedCards, selectedColors, faith as '기독교' | '무교' | '기타');
}

function ReadableParagraphs({
  text,
  textStyle,
}: {
  text?: string;
  textStyle: object;
}) {
  const paragraphs = splitCoupleReadableParagraphs(text);

  return (
    <View style={styles.readableParagraphStack}>
      {paragraphs.map((paragraph, index) => (
        <Text key={`${index}-${paragraph.slice(0, 16)}`} style={textStyle}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function CoupleCardResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { person, relationshipToken, inviteToken, resultToken } = useLocalSearchParams<{
    person: 'A' | 'B';
    relationshipToken?: string | string[];
    inviteToken?: string | string[];
    resultToken?: string | string[];
  }>();
  const inviteAccessToken = one(relationshipToken);
  const relationshipInviteToken = one(inviteToken);
  const relationshipResultToken = one(resultToken);
  const relationshipContext = trpc.relationshipInvites.context.useQuery(
    { accessToken: inviteAccessToken ?? '' },
    { enabled: Boolean(inviteAccessToken && inviteAccessToken.length >= 32), retry: false },
  );
  const trpcUtils = trpc.useUtils();
  const submitRelationshipParticipant = trpc.relationshipInvites.submit.useMutation();
  const isInviteParticipant = Boolean(inviteAccessToken);
  const personLabel = person === 'A' ? '첫 번째 사람' : '두 번째 사람';
  const accentColor = person === 'A' ? '#3D6B3D' : '#7B5EA7';
  const accentBg = person === 'A' ? '#F0F5F0' : '#F5F0FA';
  const accentBorder = person === 'A' ? '#8BAF8B55' : '#7B5EA755';

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState<CardItem[]>([]);
  const [prevColors, setPrevColors] = useState<{ korName: string; hex: string }[]>([]);
  const [cardFlow, setCardFlow] = useState<{ flow: string; coaching: string; routine: string } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const applyExistingCardAnalysis = (session: PersonSession, relationType: string) => {
      if (!session?.cards || session.cards.length !== 3 || !session?.colors || session.colors.length !== 3) return;
      const cards = session.cards
        .map(id => CARD_DATA.find(c => c.id === id))
        .filter(Boolean) as typeof CARD_DATA;
      setSelectedCards(cards);

      const colors = session.colors
        .map((id: string) => COLOR_DATA.find((color) => color.id === id))
        .filter((color): color is (typeof COLOR_DATA)[number] => Boolean(color));
      const prevColorsMapped = colors.map((c: any) => ({ korName: c.korName, hex: c.hex }));
      setPrevColors(prevColorsMapped);

      // 선택한 컬러와 카드가 모두 반영된 공통 문구를 사용한다.
      const flow = buildCardFlowAnalysis(cards as any, prevColorsMapped, session.info?.faith ?? '무교');
      setCardFlow(flow);
      setIsLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    };

    if (isInviteParticipant) {
      const inviteContext = relationshipContext.data;
      const draft = inviteContext?.draft;
      if (!inviteContext || !draft?.info?.gender || !draft.info.faith || !draft.info.relationshipRole || !draft.colors || !draft.cards) return;
      applyExistingCardAnalysis({
        info: draft.info,
        colors: draft.colors,
        cards: draft.cards,
      }, inviteContext.relationType);
      return;
    }
    AsyncStorage.getItem('@couple_session').then(raw => {
      if (!raw) return;
      const data: CoupleSessionData = JSON.parse(raw);
      const session: PersonSession = person === 'A' ? data.personA : data.personB;
      applyExistingCardAnalysis(session, data.relationType);
    });
  }, [person, isInviteParticipant, relationshipContext.data?.draftRevision]);

  const handleNext = async () => {
    if (isInviteParticipant) {
      const current = relationshipContext.data;
      const draft = current?.draft;
      if (!current || !draft?.info?.gender || !draft.info.faith || !draft.info.relationshipRole || !draft.colors || draft.colors.length !== 3 || !draft.cards || draft.cards.length !== 3 || !inviteAccessToken) {
        Alert.alert('검사 정보를 다시 확인해 주세요', '초대 세션 답변을 불러오지 못했습니다. 초대 링크를 다시 열어 주세요.');
        return;
      }
      try {
        const submittedContext = await submitRelationshipParticipant.mutateAsync({
          accessToken: inviteAccessToken,
          expectedRevision: current.draftRevision,
          submission: {
            info: draft.info,
            colors: draft.colors,
            cards: draft.cards,
          },
        });
        // The server returns the authoritative post-submit status. Store it
        // before navigating so an already-submitted participant never sees the
        // editable basic-information screen again due to a stale query cache.
        trpcUtils.relationshipInvites.context.setData(
          { accessToken: inviteAccessToken },
          submittedContext,
        );
        router.replace({
          pathname: '/(tabs)/relationship-invite',
          params: {
            token: inviteAccessToken,
            inviteToken: relationshipInviteToken ?? '',
            resultToken: relationshipResultToken ?? '',
          },
        } as any);
      } catch (error) {
        const conflict = error instanceof Error && error.message.includes('REVISION_CONFLICT');
        Alert.alert('검사를 제출하지 못했습니다', conflict ? '다른 창에서 변경된 내용이 있습니다. 초대 링크를 다시 열어 최신 상태를 확인해 주세요.' : '네트워크를 확인한 뒤 다시 시도해 주세요.');
      }
      return;
    }
    if (person === 'A') {
      router.push({ pathname: '/(tabs)/couple-select', params: { person: 'B' } } as any);
    } else {
      router.push('/(tabs)/couple-result' as any);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🌿 카드 에너지를 읽는 중...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const readings = selectedCards.map((card, index) => buildRelationshipCardNarrative(
    card,
    index === 0 ? 'inner' : index === 1 ? 'current' : 'recovery',
  ));
  const integratedAnalysisSections = cardFlow?.flow
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((text, index) => ({
      title: ["선택에서 읽는 마음", "현재 대화의 단서", "다음의 작은 실천"][index] ?? "통합 해석",
      text,
    })) ?? [];

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
              <Text style={[styles.stepBadgeText, { color: accentColor }]}>2단계 · 심리카드 심화 코칭</Text>
            </View>
          </View>

          {/* 타이틀 */}
          <View style={styles.titleArea}>
            <Text style={styles.title}>심리카드 에너지 흐름</Text>
            <Text style={styles.subtitle}>무의식 · 현재 · 미래 카드가 연결하는 내면의 이야기입니다</Text>
          </View>

          {/* 이전 단계 컬러 요약 */}
          {prevColors.length > 0 && (
            <View style={[styles.prevColorBanner, { backgroundColor: accentBg, borderColor: accentBorder }]}>
              <Text style={[styles.prevColorTitle, { color: accentColor }]}>🌿 1단계 컬러 흐름</Text>
              <View style={styles.prevColorRow}>
                {prevColors.map((c, i) => (
                  <View key={i} style={styles.prevColorItem}>
                    <View style={[styles.prevColorDot, { backgroundColor: c.hex }]} />
                    <Text style={[styles.prevColorName, { color: accentColor }]}>{c.korName}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 선택된 카드 3장 + 위치별 해석 */}
          {selectedCards.map((card, i) => (
            <View key={card.id} style={[styles.cardSection, { borderColor: POSITION_COLORS[i] + '44' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardVisual, { backgroundColor: card.colorHex }]}>
                  <Text style={[styles.cardShape, {
                    color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.92)',
                  }]}>{card.shapeSymbol}</Text>
                  <Text style={[styles.cardColorName, {
                    color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.95)',
                  }]}>{card.colorKor}</Text>
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={[styles.positionLabel, { color: POSITION_COLORS[i] }]}>
                    {i + 1}번 · {POSITION_LABELS[i]}
                  </Text>
                  <Text style={styles.cardName}>{card.colorKor} · {card.shapeKor}</Text>
                  <Text style={styles.positionDesc}>{POSITION_DESCS[i]}</Text>
                </View>
              </View>
              <View style={[styles.readingBox, { backgroundColor: POSITION_COLORS[i] + '0D' }]}>
                <ReadableParagraphs text={readings[i]} textStyle={styles.readingText} />
              </View>
            </View>
          ))}

          {/* 1단계 컬러 + 2단계 심리카드 통합 분석 */}
          {cardFlow && (
            <>
              <View style={[styles.flowCard, { borderColor: accentColor + '44', backgroundColor: accentBg }]}>
                <Text style={[styles.flowCardLabel, { color: accentColor }]}>🌿 컬러 × 심리카드 통합 분석</Text>
                <Text style={[styles.flowCardTitle, { color: '#3D3530' }]}>선택 컬러 · 무의식 → 현재 → 다음 방향</Text>
                {integratedAnalysisSections.map((section, index) => (
                  <View
                    key={section.title}
                    style={[styles.integratedSection, index > 0 && styles.integratedSectionDivider]}
                  >
                    <Text style={[styles.integratedSectionTitle, { color: accentColor }]}>{section.title}</Text>
                    <ReadableParagraphs text={section.text} textStyle={styles.integratedSectionText} />
                  </View>
                ))}
              </View>

              {/* 코칭 메시지 */}
              <View style={[styles.coachingCard, { borderColor: accentColor + '55', backgroundColor: accentColor + '0F' }]}>
                <Text style={[styles.coachingLabel, { color: accentColor }]}>🌿 오늘의 코칭 메시지</Text>
                <ReadableParagraphs text={cardFlow.coaching} textStyle={styles.coachingText} />
              </View>

              {/* 보완 루틴 */}
              <View style={[styles.routineCard, { borderColor: '#C4956A44' }]}>
                <Text style={[styles.routineLabel, { color: '#C4956A' }]}>✨ 회복을 위한 보완 루틴</Text>
                <ReadableParagraphs text={cardFlow.routine} textStyle={styles.routineText} />
              </View>
            </>
          )}

          {/* 다음 단계 안내 */}
          <View style={[styles.nextHint, { backgroundColor: accentBg, borderColor: accentBorder }]}>
            {person === 'A' ? (
              <>
                <Text style={[styles.nextHintTitle, { color: accentColor }]}>🌿 다음 단계</Text>
                <Text style={styles.nextHintText}>
                  첫 번째 사람의 컬러와 카드 흐름을 확인했습니다.{"\n"}
                  이제 두 번째 사람이 같은 방식으로 진행합니다.
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.nextHintTitle, { color: accentColor }]}>🌿 마지막 단계</Text>
                <Text style={styles.nextHintText}>
                  두 사람의 컬러와 카드 흐름을 모두 확인했습니다.{"\n"}
                  이제 두 사람의 관계 에너지를 통합 해석합니다.
                </Text>
              </>
            )}
          </View>

          {/* 다음 버튼 */}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: accentColor }]}
            onPress={() => void handleNext()}
            activeOpacity={0.85}
            disabled={isInviteParticipant && submitRelationshipParticipant.isPending}
          >
            <Text style={styles.nextBtnText}>
              {isInviteParticipant
                ? submitRelationshipParticipant.isPending
                  ? '검사 최종 제출 중...'
                  : person === 'A'
                    ? '🌿 내 검사 최종 제출 · 초대 링크 보내기 →'
                    : '🌿 내 검사 최종 제출 →'
                : person === 'A' ? '🌿 두 번째 사람 시작하기 →' : '🌿 커플 통합 결과 보기 →'}
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
  titleArea: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#3D3530', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#5F4B3B', textAlign: 'center', lineHeight: 22 },
  prevColorBanner: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16, gap: 8 },
  prevColorTitle: { fontSize: 12, fontWeight: '700' },
  prevColorRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  prevColorItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prevColorDot: { width: 18, height: 18, borderRadius: 9 },
  prevColorName: { fontSize: 12, fontWeight: '600' },
  cardSection: {
    borderRadius: 16, borderWidth: 1.5, padding: 22, marginBottom: 18, gap: 16,
    backgroundColor: '#FAFAF8',
  },
  cardHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  cardVisual: {
    width: 64, height: 88, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 5, elevation: 4,
  },
  cardShape: { fontSize: 22 },
  cardColorName: { fontSize: 9, fontWeight: '700' },
  cardHeaderInfo: { flex: 1, gap: 4 },
  positionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#3D3530' },
  positionDesc: { fontSize: 13, color: '#5F4B3B', lineHeight: 22 },
  readingBox: { borderRadius: 10, padding: 18 },
  readableParagraphStack: { gap: 14 },
  readingText: { fontSize: 18, color: '#3D3530', lineHeight: 32 },
  flowCard: {
    borderRadius: 14, borderWidth: 1, padding: 24, marginBottom: 18, gap: 14,
  },
  flowCardLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  flowCardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  integratedSection: { gap: 12, paddingVertical: 8 },
  integratedSectionDivider: { borderTopWidth: 1, borderTopColor: '#3D6B3D1C', paddingTop: 22, marginTop: 12 },
  integratedSectionTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 0.1 },
  integratedSectionText: { fontSize: 18, color: '#3D3530', lineHeight: 32 },
  coachingCard: {
    borderRadius: 14, borderWidth: 1.5, padding: 24, marginBottom: 16, gap: 12,
  },
  coachingLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  coachingText: { fontSize: 18, color: '#3D3530', lineHeight: 32, fontWeight: '500' },
  routineCard: {
    borderRadius: 14, borderWidth: 1, padding: 22, marginBottom: 24,
    backgroundColor: '#FDF8F2', gap: 12,
  },
  routineLabel: { fontSize: 12, fontWeight: '700' },
  routineText: { fontSize: 18, color: '#5F4B3B', lineHeight: 32 },
  nextHint: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, gap: 6 },
  nextHintTitle: { fontSize: 12, fontWeight: '700' },
  nextHintText: { fontSize: 13, color: '#5F4B3B', lineHeight: 21 },
  nextBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 8 },
  nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
