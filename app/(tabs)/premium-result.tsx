import React, { useState, useEffect } from "react";
import { Linking } from "react-native";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { type CardData } from "@/constants/cardData";
import { type ColorData } from "@/constants/colorData";
import { type UserProfile } from "./profile";
import { getTrialStatus, getTrialRemainingLabel, type TrialStatus } from "@/lib/trialUtils";

const POSITION_LABELS = [
  { label: "1번 카드", sub: "무의식 · 내면 에너지", color: "#8BAF8B" },
  { label: "2번 카드", sub: "현재 현실 에너지", color: "#B5A0C8" },
  { label: "3번 카드", sub: "미래 · 회복 · 희망 에너지", color: "#C4956A" },
];

// 직업별 맞춤 코칭 문구
type JobCoaching = {
  routineNote: string;   // 보완 루틴 하단에 추가될 한 문장
  coachingNote: string;  // 종합 코칭 메시지 하단에 추가될 한 문장
};

// 신앙에 따라 루틴 표현을 자연스럽게 치환
function sanitizeRecovery(text: string, faith: string): string {
  const isChristian = faith === '기독교' || faith === '천주교';
  if (isChristian) {
    // 기독교/천주교: 명상 → 묵상 시간으로 자연스럽게 치환
    return text
      .replace(/명상 또는 기도/g, '묵상 또는 기도')
      .replace(/'명상'/g, "'묵상 시간'")
      .replace(/^명상$/gm, '묵상 시간')
      .replace(/명상 호흡/g, '조용한 호흡 시간')
      .replace(/명상이나 조용한/g, '묵상이나 조용한');
  }
  // 무교/기타: 기도·예배 표현을 마음 정리·조용한 시간으로 치환
  return text
    .replace(/기도, 예배, 상담/g, '마음 정리, 감정 일기, 상담')
    .replace(/기도나 묵상/g, '조용한 호흡이나 내면 안정 시간')
    .replace(/기도, 명상/g, '마음 정리 시간, 조용한 호흡')
    .replace(/기도나 명상/g, '내면 안정 시간이나 조용한 호흡')
    .replace(/명상 또는 기도/g, '조용한 호흡 또는 마음 정리 시간')
    .replace(/'명상'/g, "'마음 정리 시간'")
    .replace(/명상 호흡/g, '조용한 호흡 시간')
    .replace(/\(기도 등\)/g, '(감정 일기, 조용한 산책 등)')
    .replace(/\(글쓰기, 기도, 정리 등\)/g, '(글쓰기, 감정 정리, 산책 등)')
    .replace(/기도/g, '마음 정리 시간')
    .replace(/예배/g, '조용한 휴식');
}

function getJobCoaching(job: string, faith: string): JobCoaching {
  const faithNote =
    faith === "기독교"
      ? "말씀 묵상이나 기도 시간을 루틴에 더하면 내면 회복이 더 깊어질 수 있습니다."
      : "";

  const jobMap: Record<string, JobCoaching> = {
    서비스직: {
      routineNote: "타인에게 쏟은 감정 에너지를 회복하는 혼자만의 조용한 시간이 필요합니다.",
      coachingNote: "오늘 하루 감정을 많이 쓰셨다면, 퇴근 후 10분만 아무것도 하지 않는 시간을 허락해 보세요.",
    },
    사역자: {
      routineNote: "섬기는 역할 속에서도 나 자신을 돌보는 경계와 쉼이 회복의 시작입니다.",
      coachingNote: "주는 것에 익숙한 당신에게, 오늘은 받는 것을 연습해 보세요. 쉬는 것도 사역입니다.",
    },
    프리랜서: {
      routineNote: "분산된 에너지를 모아주는 하루 한 가지 집중 루틴이 리듬 회복에 도움이 됩니다.",
      coachingNote: "일과 쉼의 경계가 흐릿할 때, 작은 마감 의식(차 한 잔, 산책 5분)이 에너지를 정리해 줍니다.",
    },
    학생: {
      routineNote: "집중력을 높이고 불안을 완화하는 짧은 호흡 루틴이 학습 전후에 도움이 됩니다.",
      coachingNote: "잘해야 한다는 마음이 클수록, 오늘 하루 '충분히 했다'고 스스로에게 말해 주세요.",
    },
    주부: {
      routineNote: "가족을 위한 돌봄 속에서 나를 위한 5분이 가장 중요한 회복 루틴입니다.",
      coachingNote: "당신의 수고는 보이지 않는 곳에서도 빛나고 있습니다. 오늘 하루도 충분합니다.",
    },
    생산직: {
      routineNote: "몸의 피로가 마음에도 영향을 줍니다. 퇴근 후 몸을 먼저 쉬게 해 주세요.",
      coachingNote: "반복되는 일상 속에서도 작은 변화 하나가 에너지의 흐름을 바꿀 수 있습니다.",
    },
    자영업: {
      routineNote: "책임감과 긴장이 쌓이기 쉬운 환경입니다. 의도적인 이완 루틴이 필요합니다.",
      coachingNote: "모든 것을 혼자 감당하려 하지 않아도 됩니다. 오늘 하루 한 가지만 내려놓아 보세요.",
    },
    무직: {
      routineNote: "지금의 멈춤은 다음 흐름을 준비하는 시간입니다. 작은 루틴이 방향을 만들어 줍니다.",
      coachingNote: "쉬는 것도 용기가 필요합니다. 지금 이 시간이 당신에게 필요한 과정일 수 있습니다.",
    },
    기타: {
      routineNote: "자신의 리듬에 맞는 회복 루틴을 하나씩 찾아가는 것이 가장 좋은 방법입니다.",
      coachingNote: "당신만의 속도로 흘러가도 괜찮습니다. 지금 이 순간이 이미 회복의 시작입니다.",
    },
  };

  const base = jobMap[job] ?? jobMap["기타"];

  // 기독교 신앙인인 경우 루틴 노트에 묵상 문구 추가
  if (faithNote) {
    return {
      routineNote: base.routineNote,
      coachingNote: base.coachingNote + "\n" + faithNote,
    };
  }

  return base;
}

function SectionCard({
  title,
  children,
  accentColor,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  accentColor: string;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.sectionTitleBar, { borderLeftColor: accentColor }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

export default function PremiumResultScreen() {
  const colors = useColors();
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>("none");
  const [remainingLabel, setRemainingLabel] = useState<string | null>(null);
  const [prevColors, setPrevColors] = useState<ColorData[]>([]);

  // 후기 state
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const REVIEW_TAGS = ["성향 해석", "관계 흐름", "무의식 흐름", "회복 방향", "코칭 메시지", "보완 루틴"];

  const handleReviewSubmit = async () => {
    if (reviewRating === 0) {
      Alert.alert("별점을 선택해 주세요");
      return;
    }
    setReviewSubmitting(true);
    Keyboard.dismiss();
    try {
      const reviewData = {
        rating: reviewRating,
        text: reviewText.trim(),
        tags: reviewTags,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem("premiumReview", JSON.stringify(reviewData));
      setReviewDone(true);
    } catch {}
    setReviewSubmitting(false);
  };

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("premiumSelectedCards");
      const profileRaw = await AsyncStorage.getItem("userProfile");
      const colorsRaw = await AsyncStorage.getItem("premiumSelectedColors");
      const reviewRaw = await AsyncStorage.getItem("premiumReview");
      if (raw) setCards(JSON.parse(raw));
      if (profileRaw) setProfile(JSON.parse(profileRaw));
      if (colorsRaw) {
        try { setPrevColors(JSON.parse(colorsRaw)); } catch {}
      }
      if (reviewRaw) {
        try {
          const saved = JSON.parse(reviewRaw);
          setReviewDone(true);
          setReviewRating(saved.rating ?? 0);
          setReviewText(saved.text ?? "");
          setReviewTags(saved.tags ?? []);
        } catch {}
      }
      const status = await getTrialStatus();
      setTrialStatus(status);
      if (status === "active") {
        const label = await getTrialRemainingLabel();
        setRemainingLabel(label);
      }
    })();
  }, []);

  if (cards.length < 3) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            카드 정보를 불러오는 중...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const [card1, card2, card3] = cards;

  // 직업별 맞춤 문구
  const jobCoaching = profile ? getJobCoaching(profile.job, profile.faith) : null;

  // 3카드 조합 종합 코칭 메시지 생성
  const combinedCoaching = generateCombinedCoaching(card1, card2, card3, prevColors.length >= 3 ? prevColors : undefined);

  const handleShare = async () => {
    // 보완 루틴 텍스트 구성 (card3 wellness 기준)
    const routineLines = card3.wellness.routine
      .slice(0, 2)
      .map((r: string) => `  · ${sanitizeRecovery(r, profile?.faith ?? '')}`);
    const wellnessText =
      `🌿 오늘의 보완 루틴\n` +
      `  · 추천 차: ${card3.wellness.tea}\n` +
      `  · 추천 호흡: ${card3.wellness.breath}\n` +
      routineLines.join('\n');

    const shareText = `[휴심컬러 컬러에너지 흐름 해석]\n\n` +
      `1번(내면): ${card1.colorKor} ${card1.shapeKor} - ${card1.energyTitle}\n` +
      `2번(현재): ${card2.colorKor} ${card2.shapeKor} - ${card2.energyTitle}\n` +
      `3번(회복): ${card3.colorKor} ${card3.shapeKor} - ${card3.energyTitle}\n\n` +
      `${combinedCoaching}\n\n` +
      `${wellnessText}\n\nhusimcolor.vercel.app`;

    if (Platform.OS !== "web" && typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: shareText, title: "휴심컬러 에너지 흐름 해석" });
      } catch {}
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      Alert.alert("복사 완료", "결과가 클립보드에 복사되었습니다.");
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            컬러 에너지 흐름 해석
          </Text>
          {profile && (
            <Text style={[styles.headerProfile, { color: colors.muted }]}>
              {profile.age}세 · {profile.job} · {profile.faith}
            </Text>
          )}
          {profile?.concerns && profile.concerns.length > 0 && (
            <View style={styles.concernsRow}>
              {profile.concerns.map((c) => (
                <View key={c} style={[styles.concernBadge, { backgroundColor: '#7B9FBF22', borderColor: '#7B9FBF55' }]}>
                  <Text style={[styles.concernBadgeText, { color: '#5A7FA0' }]}>{c}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 선택 카드 3장 요약 */}
        <View style={styles.cardSummaryRow}>
          {cards.map((card, i) => (
            <View key={card.id} style={styles.cardSummaryItem}>
              <View
                style={[
                  styles.cardSummaryBadge,
                  {
                    backgroundColor: card.colorHex,
                    // 블랙 카드: 골드 테두리
                    borderWidth: card.colorKor === "블랙" ? 2 : 0,
                    borderColor: card.colorKor === "블랙" ? "#D4AF37" : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardSummarySymbol,
                    card.colorKor === "화이트" && { color: "#D4AF37" },
                  ]}
                >
                  {card.shapeSymbol}
                </Text>
              </View>
              <Text
                style={[
                  styles.cardSummaryPosition,
                  { color: POSITION_LABELS[i].color },
                ]}
              >
                {POSITION_LABELS[i].label}
              </Text>
              <Text
                style={[styles.cardSummaryName, { color: colors.foreground }]}
              >
                {card.colorKor}
              </Text>
              <Text style={[styles.cardSummaryShape, { color: colors.muted }]}>
                {card.shapeKor}
              </Text>
              <Text
                style={[styles.cardSummaryEnergy, { color: POSITION_LABELS[i].color }]}
                numberOfLines={2}
              >
                {card.energyTitle}
              </Text>
            </View>
          ))}
        </View>

        {/* 카드별 상세 해석 */}
        {cards.map((card, i) => (
          <SectionCard
            key={card.id}
            title={`${POSITION_LABELS[i].label} · ${card.colorKor} ${card.shapeKor}`}
            accentColor={POSITION_LABELS[i].color}
            colors={colors}
          >
            <View style={styles.cardDetailContent}>
              {/* 오각형 안내 배지 */}
              {card.shape === 'pentagon' && (
                <View style={[styles.pentagonBadge, { backgroundColor: POSITION_LABELS[i].color + '18', borderColor: POSITION_LABELS[i].color + '40' }]}>
                  <Text style={[styles.pentagonBadgeText, { color: POSITION_LABELS[i].color }]}>
                    ⬠ 오각형 에너지 · 연결 · 통합 · 의미 확장
                  </Text>
                </View>
              )}
              {/* 1번 카드: 무의식/내면 에너지 흐름 */}
              {i === 0 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    무의식 에너지 흐름
                  </Text>
                  <Text style={[styles.detailText, { color: colors.foreground }]}>
                    {card.psychologyFlow}
                  </Text>
                </View>
              )}
              {/* 2번 카드: 현재 에너지 흐름 */}
              {i === 1 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    현재 에너지 흐름
                  </Text>
                  <Text style={[styles.detailText, { color: colors.foreground }]}>
                    {card.personalityFlow}
                  </Text>
                </View>
              )}
              {/* 3번 카드: 회복 방향 */}
              {i === 2 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    회복 방향
                  </Text>
                  <Text style={[styles.detailText, { color: colors.foreground }]}>
                    {sanitizeRecovery(card.recoveryDirection, profile?.faith ?? '')}
                  </Text>
                </View>
              )}
              {/* 감정 패턴 - 공통 */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                  감정 패턴
                </Text>
                <Text style={[styles.detailText, { color: colors.foreground }]}>
                  {card.emotionPattern}
                </Text>
              </View>
              {/* 장점 - 공통 */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                  장점
                </Text>
                <View style={styles.tagsRow}>
                  {card.strengths.map((s) => (
                    <View
                      key={s}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: POSITION_LABELS[i].color + "22",
                          borderColor: POSITION_LABELS[i].color + "55",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          { color: POSITION_LABELS[i].color },
                        ]}
                      >
                        {s}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </SectionCard>
        ))}

        {/* 보완 컬러 */}
        <SectionCard
          title="보완 컬러 에너지"
          accentColor="#C4956A"
          colors={colors}
        >
          <View style={styles.complementContent}>
            <Text style={[styles.complementDesc, { color: colors.muted }]}>
              지금의 에너지 흐름을 보완해 줄 컬러입니다
            </Text>
            <View style={styles.tagsRow}>
              {(() => {
                // 정화·안정·내면 성향 콜러: 레드·오렌지 같은 고에너지 콜러와 충돌
                const CALM_RECOVERY = [
                  '화이트', '아이보리', '비이지', '그린', '세이지그린',
                  '네이비', '블루', '라이트블루', '스카이블루',
                  '라벤더', '퍼플', '라일랙', '인디고', '실버', '미드나이트',
                ];
                // 강한 확장·추진 에너지 콜러: 정화·안정 회복 방향에는 제외
                const HIGH_ENERGY = ['레드', '오렌지', '마젠타'];
                // 유사 계열 그룹: 같은 그룹에서 하나만 추천
                const SIMILAR_GROUPS: string[][] = [
                  ['블루', '네이비', '인디고', '미드나이트'],
                  ['레드', '코랄', '마젠타'],
                  ['그린', '세이지그린', '올리브'],
                  ['라벤더', '라일랙', '퍼플'],
                  ['화이트', '아이보리', '크림', '비이지'],
                  ['민트', '스카이블루', '라이트블루', '틸'],
                ];
                const isCalm = CALM_RECOVERY.includes(card3.colorKor);
                // 현재 이미 강하게 활성화된 컬러(3장 카드에 사용된 컬러) 목록
                const activeColors = new Set([card1.colorKor, card2.colorKor, card3.colorKor]);
                // 활성화 컬러와 같은 계열 그룹도 제외 대상에 포함
                const activeGroups = new Set<number>();
                activeColors.forEach(name => {
                  const gIdx = SIMILAR_GROUPS.findIndex(g => g.includes(name));
                  if (gIdx >= 0) activeGroups.add(gIdx);
                });
                // card3 보완 컬러를 우선, card1 보완 컬러를 보조로 추가
                const allColors = [...card3.complementColors, ...card1.complementColors];
                const seen = new Set<string>();
                const usedGroups = new Set<number>();
                const filtered = allColors.filter(c => {
                  if (seen.has(c.name)) return false;
                  seen.add(c.name);
                  // 이미 카드에서 강하게 나타난 컬러 자체는 제외
                  if (activeColors.has(c.name)) return false;
                  // 회복 방향이 안정·정리 성향이면 고에너지 콜러는 제외
                  if (isCalm && HIGH_ENERGY.includes(c.name)) return false;
                  // 유사 계열 중복 방지: 같은 그룹에서 이미 추천된 컬러가 있으면 제외
                  const groupIdx = SIMILAR_GROUPS.findIndex(g => g.includes(c.name));
                  if (groupIdx >= 0) {
                    // 이미 활성화된 컬러와 같은 계열이면 우선순위 낮춤(뒤로 미룸)
                    if (activeGroups.has(groupIdx)) return false;
                    if (usedGroups.has(groupIdx)) return false;
                    usedGroups.add(groupIdx);
                  }
                  return true;
                });
                // 필터 후 3개 미만이면 계열 제한 없이 보충 (activeColors 자체만 제외)
                if (filtered.length < 3) {
                  const seen2 = new Set(filtered.map(c => c.name));
                  const usedGroups2 = new Set<number>();
                  filtered.forEach(c => {
                    const gIdx = SIMILAR_GROUPS.findIndex(g => g.includes(c.name));
                    if (gIdx >= 0) usedGroups2.add(gIdx);
                  });
                  const extra = allColors.filter(c => {
                    if (seen2.has(c.name)) return false;
                    if (activeColors.has(c.name)) return false;
                    if (isCalm && HIGH_ENERGY.includes(c.name)) return false;
                    const gIdx = SIMILAR_GROUPS.findIndex(g => g.includes(c.name));
                    if (gIdx >= 0) {
                      if (usedGroups2.has(gIdx)) return false;
                      usedGroups2.add(gIdx);
                    }
                    seen2.add(c.name);
                    return true;
                  });
                  return [...filtered, ...extra].slice(0, 3);
                }
                return filtered.slice(0, 3); // 최대 3개까지만 표시
              })().map((c) => (
                <View
                  key={c.name}
                  style={[styles.tag, { backgroundColor: '#C4956A22', borderColor: '#C4956A55', flexDirection: 'column', alignItems: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, minWidth: 100 }]}
                >
                  <Text style={[styles.tagText, { color: '#C4956A', fontWeight: '700' }]}>
                    {c.name}
                  </Text>
                  <Text style={{ color: '#C4956A', fontSize: 11, marginTop: 2, lineHeight: 15 }}>
                    {c.meaning}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </SectionCard>

        {/* 컬러 성향 흐름 섹션 */}
        {prevColors.length >= 3 && (
          <View style={[styles.colorFlowSection, { backgroundColor: "#F8F4EE", borderColor: "#D4C8B844" }]}>
            <Text style={[styles.colorFlowSectionTitle, { color: "#8B6914" }]}>
              🎨 컬러 성향 흐름
            </Text>
            <Text style={[styles.colorFlowSectionSub, { color: "#A0845C" }]}>
              1단계에서 선택한 컬러가 보여주는 기질과 성향
            </Text>
            <View style={styles.colorFlowSectionRow}>
              {prevColors.map((c: ColorData, i: number) => (
                <View key={c.id} style={styles.colorFlowSectionItem}>
                  <View style={[styles.colorFlowSectionDot, { backgroundColor: c.hex }]} />
                  <Text style={[styles.colorFlowSectionName, { color: "#5C4A1E" }]}>{c.korName}</Text>
                  <Text style={[styles.colorFlowSectionKeyword, { color: "#A0845C" }]}>{c.keywords[0]}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.colorFlowSectionDesc, { color: "#7A6040" }]}>
              {prevColors[0].korName}의 {prevColors[0].keywords[0]}·{prevColors[1].korName}의 {prevColors[1].keywords[0]}·{prevColors[2].korName}의 {prevColors[2].keywords[0]} 흐름이
              {" "}당신의 기질과 성향을 이루고 있습니다.
            </Text>
          </View>
        )}
        {/* 종합 코칭 메시지 */}
        <View
          style={[
            styles.coachingBox,
            { backgroundColor: "#8BAF8B18", borderColor: "#8BAF8B55" },
          ]}
        >
          <Text style={[styles.coachingLabel, { color: "#8BAF8B" }]}>
            💚 종합 코칭 메시지
          </Text>
          <Text style={[styles.coachingText, { color: colors.foreground }]}>
            {combinedCoaching}
          </Text>
          {/* 직업별 맞춤 코칭 메시지 */}
          {jobCoaching && (
            <View style={styles.jobCoachingNote}>
              <Text style={[styles.jobCoachingText, { color: "#6B8F6B" }]}>
                {jobCoaching.coachingNote}
              </Text>
            </View>
          )}
        </View>

        {/* 보완 루틴 섹션 */}
        <View style={[styles.wellnessSection, { backgroundColor: '#FFF8F0', borderColor: '#E8D5B0' }]}>
          <Text style={[styles.wellnessSectionTitle, { color: '#8B6914' }]}>
            🌿 오늘의 보완 루틴
          </Text>
          <Text style={[styles.wellnessSectionSub, { color: '#A0845C' }]}>
            지금 당신의 에너지 흐름에 맞는 회복 가이드입니다
          </Text>
          <View style={styles.wellnessRow}>
            <Text style={styles.wellnessIcon}>🍵</Text>
            <View style={styles.wellnessContent}>
              <Text style={[styles.wellnessLabel, { color: '#8B6914' }]}>추천 차</Text>
              <Text style={[styles.wellnessValue, { color: '#5C4A1E' }]}>{card3.wellness.tea}</Text>
            </View>
          </View>
          <View style={styles.wellnessDivider} />
          <View style={styles.wellnessRow}>
            <Text style={styles.wellnessIcon}>🌬️</Text>
            <View style={styles.wellnessContent}>
              <Text style={[styles.wellnessLabel, { color: '#8B6914' }]}>추천 호흡</Text>
              <Text style={[styles.wellnessValue, { color: '#5C4A1E' }]}>{card3.wellness.breath}</Text>
            </View>
          </View>
          <View style={styles.wellnessDivider} />
          <View style={styles.wellnessRow}>
            <Text style={styles.wellnessIcon}>🌱</Text>
            <View style={styles.wellnessContent}>
              <Text style={[styles.wellnessLabel, { color: '#8B6914' }]}>추천 루틴</Text>
              {card3.wellness.routine.map((item, idx) => (
                <Text key={idx} style={[styles.wellnessRoutineItem, { color: '#5C4A1E' }]}>
                  · {sanitizeRecovery(item, profile?.faith ?? '')}
                </Text>
              ))}
            </View>
          </View>
          {/* 직업별 루틴 노트 */}
          {jobCoaching && (
            <View style={styles.jobRoutineNote}>
              <Text style={[styles.jobRoutineText, { color: '#8B6914' }]}>
                💡 {jobCoaching.routineNote}
              </Text>
            </View>
          )}
        </View>

        {/* 체험 중 결제 유도 배너 */}
        {(trialStatus === "active" || trialStatus === "expired") && (
          <View style={[styles.trialBanner, {
            backgroundColor: trialStatus === "expired" ? "#F5EDE0" : "#EDF5ED",
            borderColor: trialStatus === "expired" ? "#C4956A55" : "#8BAF8B55",
          }]}>
            {trialStatus === "active" && remainingLabel ? (
              <>
                <Text style={[styles.trialBannerTitle, { color: "#5A8A5A" }]}>
                  🌿 무료체험 중 · 남은 시간 {remainingLabel}
                </Text>
                <Text style={[styles.trialBannerDesc, { color: "#5A8A5A" }]}>
                  체험 기간 종료 후에는 결제 후 이용 가능합니다
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.trialBannerTitle, { color: "#C4956A" }]}>
                  무료체험이 종료되었습니다
                </Text>
                <Text style={[styles.trialBannerDesc, { color: "#C4956A" }]}>
                  심층 해석을 계속 이용하시려면 결제해 주세요
                </Text>
              </>
            )}
            <TouchableOpacity
              style={[styles.trialBannerBtn, {
                backgroundColor: trialStatus === "expired" ? "#C4956A" : "#8BAF8B",
              }]}
              onPress={() => router.push("/payment" as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.trialBannerBtnText}>
                {trialStatus === "expired" ? "지금 결제하기 →" : "심화코칭 예약 · 결제하기 →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* 공유 버튼 */}
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Text style={[styles.shareButtonText, { color: colors.foreground }]}>
            결과 공유하기
          </Text>
        </TouchableOpacity>

        {/* 1:1 코칭 연결 섹션 */}
        <View style={styles.coachingSection}>
          <Text style={[styles.coachingSectionTitle, { color: "#2A2A2A" }]}>
            지금의 마음 흐름을{"\n"}더 깊이 이해하고 싶다면
          </Text>
          <Text style={[styles.coachingSectionSub, { color: colors.muted }]}>
            휴심컬러와 함께하는 1:1 컬러코칭을 만나보세요
          </Text>

          <TouchableOpacity
            style={[styles.coachingLinkBtn, { backgroundColor: "#03C75A" }]}
            onPress={() => {
              Linking.openURL("https://naver.me/ID3fxw2W");
            }}
            activeOpacity={0.8}
          >
            <View style={styles.coachingLinkInner}>
              <View style={[styles.coachingLinkIcon, { backgroundColor: "#FFFFFF33" }]}>
                <Text style={styles.coachingLinkIconText}>N</Text>
              </View>
              <View style={styles.coachingLinkTexts}>
                <Text style={styles.coachingLinkTitle}>네이버 예약</Text>
                <Text style={styles.coachingLinkDesc}>1:1 컬러코칭 예약하기</Text>
                <Text style={styles.coachingLinkDesc}>이음트레이드 · 동소문로 47 701호</Text>
              </View>
              <Text style={styles.coachingLinkArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.coachingLinkBtn, { backgroundColor: "#FEE500" }]}
            onPress={() => {
              Linking.openURL("https://open.kakao.com/o/sp6nBerh");
            }}
            activeOpacity={0.8}
          >
            <View style={styles.coachingLinkInner}>
              <View style={[styles.coachingLinkIcon, { backgroundColor: "#00000022" }]}>
                <Text style={[styles.coachingLinkIconText, { color: "#3A1D00" }]}>💬</Text>
              </View>
              <View style={styles.coachingLinkTexts}>
                <Text style={[styles.coachingLinkTitle, { color: "#3A1D00" }]}>온라인 상담 문의</Text>
                <Text style={[styles.coachingLinkDesc, { color: "#3A1D00AA" }]}>멀리 계시거나 방문이 어려운 분은</Text>
                <Text style={[styles.coachingLinkDesc, { color: "#3A1D00AA" }]}>카카오톡으로 온라인 코칭 가능 여부를 문의해 주세요.</Text>
              </View>
              <Text style={[styles.coachingLinkArrow, { color: "#3A1D00" }]}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.coachingLinkBtn, { backgroundColor: "#E1306C" }]}
            onPress={() => {
              Linking.openURL("https://www.instagram.com/husim_lumiere?igsh=MTh6bWhpdWRjb2Rtcw==");
            }}
            activeOpacity={0.8}
          >
            <View style={styles.coachingLinkInner}>
              <View style={[styles.coachingLinkIcon, { backgroundColor: "#FFFFFF33" }]}>
                <Text style={styles.coachingLinkIconText}>📷</Text>
              </View>
              <View style={styles.coachingLinkTexts}>
                <Text style={styles.coachingLinkTitle}>인스타그램</Text>
                <Text style={styles.coachingLinkDesc}>@husim_lumiere 팔로우</Text>
              </View>
              <Text style={styles.coachingLinkArrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* 유튜브 묵상채널 */}
          <TouchableOpacity
            style={[styles.coachingLinkBtn, { backgroundColor: "#FF0000" }]}
            onPress={() => {
              Linking.openURL("https://youtube.com/@huali7603?si=4R0Hk-Xna6iS3OP9");
            }}
            activeOpacity={0.8}
          >
            <View style={styles.coachingLinkInner}>
              <View style={[styles.coachingLinkIcon, { backgroundColor: "#FFFFFF33" }]}>
                <Text style={styles.coachingLinkIconText}>▶️</Text>
              </View>
              <View style={styles.coachingLinkTexts}>
                <Text style={styles.coachingLinkTitle}>유튜브 묵상채널</Text>
                <Text style={styles.coachingLinkDesc}>마음을 쉬게 하는 묵상 영상</Text>
              </View>
              <Text style={styles.coachingLinkArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 코칭 흐름 마무리 + 후기 인라인 섹션 */}
        <View style={[styles.reviewSection, { backgroundColor: colors.surface, borderColor: "#8BAF8B44" }]}>
          {/* 마무리 문구 */}
          <Text style={[styles.reviewClosingText, { color: colors.muted }]}>
           오늘의 코칭이{"\n"}당신에게 작은 쉼과 이해가 되었기를 바랍니다 🌿
          </Text>

          {reviewDone ? (
            /* 후기 완료 상태 */
            <View style={styles.reviewDoneBox}>
              <Text style={[styles.reviewDoneIcon]}>🌿</Text>
              <Text style={[styles.reviewDoneText, { color: "#8BAF8B" }]}>
                후기를 남겼주셔서 감사합니다
              </Text>
              <Text style={[styles.reviewDoneSub, { color: colors.muted }]}>
                {"⭐".repeat(reviewRating)} · {reviewTags.join(" · ")}
              </Text>
            </View>
          ) : (
            /* 후기 입력 폼 */
            <View style={styles.reviewForm}>
              <Text style={[styles.reviewAskText, { color: colors.foreground }]}>
                짧은 후기를 남겨주시면{"\n"}휴심컬러가 더 따뜻하게 성장하는 데 큰 힘이 됩니다 😊
              </Text>

              {/* 별점 */}
              <View style={styles.reviewStarRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    activeOpacity={0.7}
                    style={styles.reviewStarBtn}
                  >
                    <Text style={[styles.reviewStarText, { color: star <= reviewRating ? "#F59E0B" : colors.border }]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 공감 포인트 선택 */}
              <Text style={[styles.reviewTagLabel, { color: colors.muted }]}>
                어떤 부분이 가장 공감되셨나요?
              </Text>
              <View style={styles.reviewTagRow}>
                {REVIEW_TAGS.map((tag) => {
                  const selected = reviewTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => {
                        setReviewTags(prev =>
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        );
                      }}
                      activeOpacity={0.75}
                      style={[
                        styles.reviewTag,
                        selected
                          ? { backgroundColor: "#8BAF8B", borderColor: "#8BAF8B" }
                          : { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.reviewTagText, { color: selected ? "#FFFFFF" : colors.muted }]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 한줄 후기 */}
              <TextInput
                style={[
                  styles.reviewInput,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
                ]}
                placeholder="짧은 후기를 남겨주세요 (선택)"
                placeholderTextColor={colors.muted}
                value={reviewText}
                onChangeText={setReviewText}
                maxLength={100}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              {/* 제출 버튼 */}
              <TouchableOpacity
                style={[styles.reviewSubmitBtn, { backgroundColor: "#8BAF8B" }]}
                onPress={handleReviewSubmit}
                activeOpacity={0.85}
                disabled={reviewSubmitting}
              >
                <Text style={styles.reviewSubmitBtnText}>
                  {reviewSubmitting ? "저장 중..." : "후기 남기기"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 다시 선택 */}
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: colors.border }]}
          onPress={() => router.push("/premium-select" as any)}
          activeOpacity={0.7}
        >
          <Text style={[styles.retryButtonText, { color: colors.muted }]}>
            다시 선택하기
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

// energyTitle 끝에 '에너지'가 포함되어 있으면 '의 에너지' 대신 자연스러운 조사로 연결
function toFlowPhrase(title: string): string {
  if (title.endsWith('에너지')) {
    return `${title}의 흐름이 나타나고 있으며`;
  }
  if (title.endsWith('흐름') || title.endsWith('균형') || title.endsWith('조화')) {
    return `${title}이 이어지고 있으며`;
  }
  return `${title}의 에너지가 흐르고 있으며`;
}

function toRecoveryPhrase(title: string): string {
  if (title.endsWith('에너지')) {
    return `${title}가 회복의 방향을 안내하고 있습니다`;
  }
  if (title.endsWith('흐름') || title.endsWith('균형') || title.endsWith('조화')) {
    return `${title}이 회복의 방향을 안내하고 있습니다`;
  }
  return `${title}의 에너지가 회복의 방향을 안내하고 있습니다`;
}

function generateCombinedCoaching(card1: CardData, card2: CardData, card3: CardData, colorFlow?: ColorData[]): string {
  const line1 = `내면에서는 ${toFlowPhrase(card1.energyTitle)}, `;
  const line2 = `현재는 ${card2.energyTitle.endsWith('에너지') ? card2.energyTitle + '의 흐름' : card2.energyTitle} 속에 있습니다.\n`;
  const line3 = `${toRecoveryPhrase(card3.energyTitle)}.\n\n`;
  // 컬러 흐름 통합 문장
  let colorLine = '';
  if (colorFlow && colorFlow.length >= 3) {
    const [c1, c2, c3] = colorFlow;
    colorLine = `\n\n${c1.korName}·${c2.korName}·${c3.korName}의 컬러 흐름이 이 여정을 함께 안내하고 있습니다. ` +
      `${c1.korName}의 ${c1.keywords[0]}과 ${c3.korName}의 ${c3.recovery} 방향이 ` +
      `지금 당신에게 필요한 회복의 실마리가 될 것입니다.`;
  }
  return line1 + line2 + line3 + card3.coachingMessage + colorLine;
}

const styles = StyleSheet.create({
  colorFlowSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  colorFlowSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  colorFlowSectionSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  colorFlowSectionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  colorFlowSectionItem: {
    alignItems: "center",
    gap: 4,
  },
  colorFlowSectionDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorFlowSectionName: {
    fontSize: 12,
    fontWeight: "700",
  },
  colorFlowSectionKeyword: {
    fontSize: 11,
  },
  colorFlowSectionDesc: {
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerProfile: {
    fontSize: 13,
  },
  concernsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  concernBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  concernBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardSummaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  cardSummaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  cardSummaryBadge: {
    width: 44,
    height: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardSummarySymbol: {
    fontSize: 22,
    color: "rgba(255,255,255,0.9)",
  },
  cardSummaryPosition: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardSummaryName: {
    fontSize: 13,
    fontWeight: "700",
  },
  cardSummaryShape: {
    fontSize: 11,
  },
  cardSummaryEnergy: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
  },
  sectionTitleBar: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 12,
    paddingRight: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardDetailContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  detailRow: {
    gap: 4,
  },
  pentagonBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  pentagonBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  complementContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  complementDesc: {
    fontSize: 13,
  },
  coachingBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
    gap: 10,
  },
  coachingLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  coachingText: {
    fontSize: 15,
    lineHeight: 26,
    fontStyle: "italic",
    fontWeight: "500",
  },
  jobCoachingNote: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#8BAF8B33",
  },
  jobCoachingText: {
    fontSize: 13,
    lineHeight: 22,
    fontStyle: "normal",
    fontWeight: "500",
  },
  shareButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 28,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  coachingSection: {
    gap: 10,
    marginBottom: 20,
  },
  coachingSectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 30,
  },
  coachingSectionSub: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 4,
  },
  coachingLinkBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  coachingLinkInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coachingLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  coachingLinkIconText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  coachingLinkTexts: {
    flex: 1,
    gap: 2,
  },
  coachingLinkTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  coachingLinkDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  coachingLinkArrow: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  retryButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  retryButtonText: {
    fontSize: 14,
    color: '#888',
  },
  wellnessSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  wellnessSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  wellnessSectionSub: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  wellnessRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  wellnessIcon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },
  wellnessContent: {
    flex: 1,
  },
  wellnessLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  wellnessValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  wellnessDivider: {
    height: 1,
    backgroundColor: '#E8D5B055',
    marginVertical: 2,
  },
  wellnessRoutineItem: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  jobRoutineNote: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8D5B0',
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
  },
  jobRoutineText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  // 체험 중/만료 배너
  trialBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 8,
    alignItems: 'center',
  },
  trialBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  trialBannerDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  trialBannerBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  trialBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // 후기 섹션 스타일
  reviewSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
    gap: 16,
  },
  reviewClosingText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  reviewAskText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  reviewDoneBox: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  reviewDoneIcon: {
    fontSize: 28,
  },
  reviewDoneText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewDoneSub: {
    fontSize: 13,
    textAlign: 'center',
  },
  reviewForm: {
    gap: 12,
  },
  reviewStarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  reviewStarBtn: {
    padding: 4,
  },
  reviewStarText: {
    fontSize: 32,
  },
  reviewTagLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  reviewTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  reviewTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  reviewTagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  reviewSubmitBtn: {
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
  },
  reviewSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
