import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { CARD_DATA, type CardData } from "@/constants/cardData";
import { isPremiumActive } from "@/lib/trialUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 32) / 5;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const POSITION_LABELS = ["무의식 · 내면 에너지", "현재 현실 에너지", "미래 · 회복 · 희망 에너지"];
const POSITION_COLORS = ["#8BAF8B", "#B5A0C8", "#C4956A"];

const CARD_BACK_COLOR = "#EDE8DF";
const CARD_BACK_BORDER = "#C8BFB0";
const CARD_BACK_SYMBOL_COLOR = "rgba(140, 128, 112, 0.65)";

// 각 카드에 개별 Animated.Value를 생성하는 컴포넌트
function AnimatedCard({
  card,
  index,
  isFlipped,
  isSelected,
  flipAnim,
  revealDelay,
  onPress,
}: {
  card: CardData;
  index: number;
  isFlipped: boolean;
  isSelected: boolean;
  flipAnim: Animated.Value;
  revealDelay: number;
  onPress: () => void;
}) {
  const revealAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(revealAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, revealDelay);
    return () => clearTimeout(timer);
  }, []);

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  return (
    <Animated.View
      style={{
        opacity: revealAnim,
        transform: [
          {
            translateY: revealAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
        ],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.cardWrapper, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
      >
        {/* 카드 뒷면 - 연베이지 */}
        <Animated.View
          style={[
            styles.cardFace,
            styles.cardBack,
            {
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              transform: [{ rotateY: frontRotate }],
              backfaceVisibility: "hidden",
              position: "absolute",
            },
          ]}
        >
          <Text style={styles.cardBackSymbol}>✦</Text>
        </Animated.View>

        {/* 카드 앞면 */}
        <Animated.View
          style={[
            styles.cardFace,
            {
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              backgroundColor: card.colorHex,
              transform: [{ rotateY: backRotate }],
              backfaceVisibility: "hidden",
              position: "absolute",
              // 블랙 카드: 골드 테두리, 화이트 카드: 다크 테두리, 나머지: 흰색 테두리
              borderWidth: isSelected ? 2.5 : 0,
              borderColor: card.colorKor === "블랙"
                ? "#D4AF37"
                : card.colorKor === "화이트"
                ? "#555555"
                : "#FFFFFF",
            },
          ]}
        >
          {/* 화이트 카드: 도형·텍스트 골드 / 블랙 카드: 흰색 유지 */}
          <Text
            style={[
              styles.shapeSymbol,
              card.colorKor === "화이트" && { color: "#D4AF37" },
            ]}
          >
            {card.shapeSymbol}
          </Text>
          <Text
            style={[
              styles.cardFrontColorName,
              card.colorKor === "화이트" && { color: "#D4AF37" },
            ]}
            numberOfLines={1}
          >
            {card.colorKor}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PremiumSelectScreen() {
  const colors = useColors();
  const router = useRouter();

  // 진입 시 체험/결제 상태 확인 - 미활성화면 결제 화면으로 이동
  useEffect(() => {
    isPremiumActive().then((active) => {
      if (!active) {
        router.replace("/payment" as any);
      }
    });
  }, []);

  const [shuffledCards, setShuffledCards] = useState<CardData[]>(() => shuffleArray(CARD_DATA));
  const [selectedCards, setSelectedCards] = useState<(CardData | null)[]>([null, null, null]);
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());
  const [isShuffling, setIsShuffling] = useState(true);

  // 각 카드의 flip 애니메이션
  const flipAnims = useRef<Animated.Value[]>(
    Array.from({ length: 63 }, () => new Animated.Value(0))
  ).current;

  // 화면 포커스 시마다 카드 상태 초기화 (이전 선택 카드 남아있는 문제 방지)
  useFocusEffect(
    useCallback(() => {
      setShuffledCards(shuffleArray(CARD_DATA));
      setSelectedCards([null, null, null]);
      setFlippedIndices(new Set());
      setIsShuffling(true);
      flipAnims.forEach((anim) => anim.setValue(0));
    }, [])
  );

  const selectedCount = selectedCards.filter(Boolean).length;

  // 셔플 완료 타이머 - 마지막 카드가 나타나는 시간 이후 isShuffling = false
  useEffect(() => {
    // 63장 카드의 마지막 딜레이: 62 * 18 = 1116ms + 300ms 애니메이션 = 약 1420ms
    const timer = setTimeout(() => {
      setIsShuffling(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleCardPress = useCallback(
    (index: number) => {
      if (isShuffling) return;
      const card = shuffledCards[index];

      const selectedIndex = selectedCards.findIndex((c) => c?.id === card.id);
      if (selectedIndex !== -1) {
        const newSelected = [...selectedCards];
        newSelected[selectedIndex] = null;
        setSelectedCards(newSelected);
        setFlippedIndices((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
        Animated.timing(flipAnims[index], {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        return;
      }

      if (selectedCount >= 3) return;

      Animated.timing(flipAnims[index], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      setFlippedIndices((prev) => new Set([...prev, index]));

      const newSelected = [...selectedCards];
      const emptyIndex = newSelected.findIndex((c) => c === null);
      if (emptyIndex !== -1) {
        newSelected[emptyIndex] = card;
        setSelectedCards(newSelected);
      }
    },
    [isShuffling, shuffledCards, selectedCards, selectedCount, flipAnims]
  );

  const handleConfirm = async () => {
    if (selectedCount < 3) return;
    const cards = selectedCards.filter(Boolean) as CardData[];
    await AsyncStorage.setItem("premiumSelectedCards", JSON.stringify(cards));
    router.push("/premium-result" as any);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            컬러 에너지 카드 선택
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            마음이 이끄는 카드를 3장 선택해 주세요
          </Text>
        </View>

        {/* 선택 현황 슬롯 */}
        <View style={styles.slotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.slotWrapper}>
              <View
                style={[
                  styles.slot,
                  {
                    backgroundColor: selectedCards[i]
                      ? POSITION_COLORS[i] + "33"
                      : colors.surface,
                    borderColor: selectedCards[i]
                      ? POSITION_COLORS[i]
                      : colors.border,
                    borderStyle: selectedCards[i] ? "solid" : "dashed",
                  },
                ]}
              >
                {selectedCards[i] ? (
                  <>
                    <View
                      style={[
                        styles.slotColorDot,
                        { backgroundColor: selectedCards[i]!.colorHex },
                      ]}
                    />
                    <Text style={[styles.slotCardName, { color: colors.foreground }]}>
                      {selectedCards[i]!.colorKor}
                    </Text>
                    <Text style={[styles.slotShapeName, { color: colors.muted }]}>
                      {selectedCards[i]!.shapeKor}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.slotEmpty, { color: colors.muted }]}>
                    {i + 1}번
                  </Text>
                )}
              </View>
              <Text
                style={[styles.slotLabel, { color: POSITION_COLORS[i] }]}
                numberOfLines={2}
              >
                {POSITION_LABELS[i]}
              </Text>
            </View>
          ))}
        </View>

        {/* 진행 안내 */}
        <Text style={[styles.progressText, { color: colors.muted }]}>
          {isShuffling
            ? "✨ 카드를 섞는 중..."
            : selectedCount < 3
            ? `마음이 이끄는 카드를 ${3 - selectedCount}장 더 선택해 주세요`
            : "3장 선택 완료 · 아래 버튼을 눌러 해석을 확인하세요"}
        </Text>

        {/* 카드 그리드 */}
        <View style={styles.cardGrid}>
          {shuffledCards.map((card, index) => {
            const isFlipped = flippedIndices.has(index);
            const isSelected = selectedCards.some((c) => c?.id === card.id);
            // 카드마다 순차적 딜레이 (0~62번 카드: 0ms ~ 1116ms)
            const revealDelay = index * 18;

            return (
              <AnimatedCard
                key={card.id}
                card={card}
                index={index}
                isFlipped={isFlipped}
                isSelected={isSelected}
                flipAnim={flipAnims[index]}
                revealDelay={revealDelay}
                onPress={() => handleCardPress(index)}
              />
            );
          })}
        </View>

        {/* 확인 버튼 */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            {
              backgroundColor: selectedCount === 3 ? "#8BAF8B" : colors.border,
            },
          ]}
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={selectedCount < 3}
        >
          <Text style={styles.confirmButtonText}>
            {selectedCount === 3
              ? "컬러 에너지 흐름 해석하기 →"
              : `${selectedCount} / 3 선택됨`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  slotsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  slotWrapper: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  slot: {
    width: "100%",
    aspectRatio: 0.65,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    gap: 5,
  },
  slotColorDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginBottom: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  slotCardName: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  slotShapeName: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  slotEmpty: {
    fontSize: 22,
    fontWeight: "200",
  },
  slotLabel: {
    textAlign: "center",
    lineHeight: 14,
    fontWeight: "600",
    fontSize: 10,
  },
  progressText: {
    textAlign: "center",
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 20,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
    marginBottom: 24,
  },
  cardWrapper: {
    position: "relative",
  },
  cardFace: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardBack: {
    backgroundColor: CARD_BACK_COLOR,
    borderWidth: 1.5,
    borderColor: CARD_BACK_BORDER,
    shadowColor: "#9A8E7E",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
  },
  cardBackSymbol: {
    color: CARD_BACK_SYMBOL_COLOR,
    fontSize: 18,
  },
  shapeSymbol: {
    fontSize: 24,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 2,
  },
  cardFrontColorName: {
    fontSize: 8,
    color: "rgba(255,255,255,0.95)",
    fontWeight: "700",
  },
  confirmButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
