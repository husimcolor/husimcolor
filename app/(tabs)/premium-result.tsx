import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { type CardData } from "@/constants/cardData";
import { type UserProfile } from "./profile";

const POSITION_LABELS = [
  { label: "1번 카드", sub: "무의식 · 내면 에너지", color: "#8BAF8B" },
  { label: "2번 카드", sub: "현재 현실 에너지", color: "#B5A0C8" },
  { label: "3번 카드", sub: "미래 · 회복 · 희망 에너지", color: "#C4956A" },
];

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

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("premiumSelectedCards");
      const profileRaw = await AsyncStorage.getItem("userProfile");
      if (raw) setCards(JSON.parse(raw));
      if (profileRaw) setProfile(JSON.parse(profileRaw));
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

  // 3카드 조합 종합 코칭 메시지 생성
  const combinedCoaching = generateCombinedCoaching(card1, card2, card3);

  const handleShare = async () => {
    const shareText = `[휴심컬러 컬러에너지 흐름 해석]\n\n` +
      `1번(내면): ${card1.colorKor} ${card1.shapeKor} - ${card1.energyTitle}\n` +
      `2번(현재): ${card2.colorKor} ${card2.shapeKor} - ${card2.energyTitle}\n` +
      `3번(회복): ${card3.colorKor} ${card3.shapeKor} - ${card3.energyTitle}\n\n` +
      `${combinedCoaching}\n\nhusimcolor.vercel.app`;

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
        </View>

        {/* 선택 카드 3장 요약 */}
        <View style={styles.cardSummaryRow}>
          {cards.map((card, i) => (
            <View key={card.id} style={styles.cardSummaryItem}>
              <View
                style={[
                  styles.cardSummaryBadge,
                  { backgroundColor: card.colorHex },
                ]}
              >
                <Text style={styles.cardSummarySymbol}>{card.shapeSymbol}</Text>
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
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                  에너지 흐름
                </Text>
                <Text style={[styles.detailText, { color: colors.foreground }]}>
                  {card.psychologyFlow}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                  성격 흐름
                </Text>
                <Text style={[styles.detailText, { color: colors.foreground }]}>
                  {card.personalityFlow}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                  감정 패턴
                </Text>
                <Text style={[styles.detailText, { color: colors.foreground }]}>
                  {card.emotionPattern}
                </Text>
              </View>
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
              {i === 2 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>
                    회복 방향
                  </Text>
                  <Text
                    style={[styles.detailText, { color: colors.foreground }]}
                  >
                    {card.recoveryDirection}
                  </Text>
                </View>
              )}
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
                const allColors = [...card1.complementColors, ...card3.complementColors];
                const seen = new Set<string>();
                return allColors.filter(c => {
                  if (seen.has(c.name)) return false;
                  seen.add(c.name);
                  return true;
                });
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
                  · {item}
                </Text>
              ))}
            </View>
          </View>
        </View>

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
              if (Platform.OS === "web") {
                window.open("https://booking.naver.com/booking/13/bizes/1076765", "_blank");
              }
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
              if (Platform.OS === "web") {
                window.open("https://open.kakao.com/o/sp6nBerh", "_blank");
              }
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
              if (Platform.OS === "web") {
                window.open("https://www.instagram.com/husimcolor", "_blank");
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.coachingLinkInner}>
              <View style={[styles.coachingLinkIcon, { backgroundColor: "#FFFFFF33" }]}>
                <Text style={styles.coachingLinkIconText}>📷</Text>
              </View>
              <View style={styles.coachingLinkTexts}>
                <Text style={styles.coachingLinkTitle}>인스타그램</Text>
                <Text style={styles.coachingLinkDesc}>@husimcolor 팔로우</Text>
              </View>
              <Text style={styles.coachingLinkArrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* 유튜브 묵상채널 */}
          <TouchableOpacity
            style={[styles.coachingLinkBtn, { backgroundColor: "#FF0000" }]}
            onPress={() => {
              if (Platform.OS === "web") {
                window.open("https://youtube.com/@huali7603?si=4R0Hk-Xna6iS3OP9", "_blank");
              }
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

function generateCombinedCoaching(card1: CardData, card2: CardData, card3: CardData): string {
  return (
    `내면에서는 ${card1.energyTitle}의 에너지가 흐르고 있으며, ` +
    `현재는 ${card2.energyTitle}의 흐름 속에 있습니다.\n` +
    `${card3.energyTitle}의 에너지가 회복의 방향을 안내하고 있습니다.\n\n` +
    card3.coachingMessage
  );
}

const styles = StyleSheet.create({
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
});