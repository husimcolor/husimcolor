import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { CARD_DATA, type CardData } from "@/constants/cardData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48 - 32) / 5; // 5 columns
const CARD_HEIGHT = CARD_WIDTH * 1.5;

// 카드 배열 셔플
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

export default function PremiumSelectScreen() {
  const colors = useColors();
  const router = useRouter();

  const [shuffledCards] = useState<CardData[]>(() => shuffleArray(CARD_DATA));
  const [selectedCards, setSelectedCards] = useState<(CardData | null)[]>([null, null, null]);
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());
  const flipAnims = useRef<Animated.Value[]>(
    Array.from({ length: 63 }, () => new Animated.Value(0))
  ).current;

  const selectedCount = selectedCards.filter(Boolean).length;

  const handleCardPress = (index: number) => {
    const card = shuffledCards[index];

    // 이미 선택된 카드 클릭 → 선택 해제
    const selectedIndex = selectedCards.findIndex(
      (c) => c?.id === card.id
    );
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

    // 이미 3장 선택된 경우 무시
    if (selectedCount >= 3) return;

    // 카드 뒤집기 애니메이션
    Animated.timing(flipAnims[index], {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    setFlippedIndices((prev) => new Set([...prev, index]));

    // 빈 슬롯에 추가
    const newSelected = [...selectedCards];
    const emptyIndex = newSelected.findIndex((c) => c === null);
    if (emptyIndex !== -1) {
      newSelected[emptyIndex] = card;
      setSelectedCards(newSelected);
    }
  };

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
                      ? POSITION_COLORS[i] + "22"
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
                style={[
                  styles.slotLabel,
                  { color: POSITION_COLORS[i], fontSize: 9 },
                ]}
                numberOfLines={2}
              >
                {POSITION_LABELS[i]}
              </Text>
            </View>
          ))}
        </View>

        {/* 진행 안내 */}
        <Text style={[styles.progressText, { color: colors.muted }]}>
          {selectedCount < 3
            ? `${3 - selectedCount}장 더 선택해 주세요`
            : "3장 선택 완료 · 아래 버튼을 눌러 해석을 확인하세요"}
        </Text>

        {/* 카드 그리드 */}
        <View style={styles.cardGrid}>
          {shuffledCards.map((card, index) => {
            const isFlipped = flippedIndices.has(index);
            const isSelected = selectedCards.some((c) => c?.id === card.id);

            const frontRotate = flipAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "180deg"],
            });
            const backRotate = flipAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: ["180deg", "360deg"],
            });

            return (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleCardPress(index)}
                activeOpacity={0.85}
                style={[
                  styles.cardWrapper,
                  { width: CARD_WIDTH, height: CARD_HEIGHT },
                ]}
              >
                {/* 카드 뒷면 (기본) */}
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
                  <View style={styles.cardBackPattern}>
                    <Text style={styles.cardBackSymbol}>✦</Text>
                  </View>
                </Animated.View>

                {/* 카드 앞면 (선택 후) */}
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
                      borderWidth: isSelected ? 2.5 : 0,
                      borderColor: "#FFFFFF",
                    },
                  ]}
                >
                  <Text style={styles.shapeSymbol}>{card.shapeSymbol}</Text>
                  <Text style={styles.cardFrontColorName} numberOfLines={1}>
                    {card.colorKor}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
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
            {selectedCount === 3 ? "컬러 에너지 흐름 해석하기 →" : `${selectedCount} / 3 선택됨`}
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
    aspectRatio: 0.7,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  slotColorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginBottom: 4,
  },
  slotCardName: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  slotShapeName: {
    fontSize: 10,
    textAlign: "center",
  },
  slotEmpty: {
    fontSize: 16,
    fontWeight: "300",
  },
  slotLabel: {
    textAlign: "center",
    lineHeight: 13,
  },
  progressText: {
    textAlign: "center",
    fontSize: 13,
    marginBottom: 16,
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
    backgroundColor: "#2A2A3A",
  },
  cardBackPattern: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardBackSymbol: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 18,
  },
  shapeSymbol: {
    fontSize: 22,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 2,
  },
  cardFrontColorName: {
    fontSize: 8,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
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
