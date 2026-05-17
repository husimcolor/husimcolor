import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { CARD_DATA, type CardData } from "@/constants/cardData";
import { COLOR_DATA, type ColorData } from "@/constants/colorData";
import { isPremiumActive } from "@/lib/trialUtils";
import Svg, { Path, Circle } from "react-native-svg";

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
const POSITION_COLORS = ["#3D6B3D", "#B5A0C8", "#C4956A"];

const CARD_BACK_COLOR = "#D8CEBC";
const CARD_BACK_BORDER = "#B8A898";
const CARD_BACK_SYMBOL_COLOR = "rgba(120, 105, 88, 0.60)";

// ─── CSS 주입 (웹 전용) ──────────────────────────────────────────────────────
let premiumCSSInjected = false;
function injectPremiumCSS() {
  if (Platform.OS !== "web") return;
  if (typeof document === "undefined") return;
  if (premiumCSSInjected) return;
  premiumCSSInjected = true;

  const existing = document.getElementById("hyusim-premium-anim");
  if (existing) existing.remove();

  const style = document.createElement("style");
  style.id = "hyusim-premium-anim";
  style.textContent = `
    /* 셔플 등장: 아래에서 페이드인 (0.9초) */
    @keyframes premiumCardEnter {
      0%   { opacity: 0; transform: translateY(20px) scale(0.96); }
      60%  { opacity: 1; }
      100% { opacity: 1; transform: translateY(0px) scale(1); }
    }
    /* 뒤집기 out: scaleX 1→0 (0.28초) */
    @keyframes premiumFlipOut {
      0%   { transform: scaleX(1); }
      100% { transform: scaleX(0); }
    }
    /* 뒤집기 in: scaleX 0→1 (0.28초) */
    @keyframes premiumFlipIn {
      0%   { transform: scaleX(0); }
      100% { transform: scaleX(1); }
    }

    /* 카드 래퍼: 초기 숨김 */
    .premium-card-wrapper {
      display: inline-block;
      opacity: 0;
    }
    /* 셔플 등장 클래스 */
    .premium-card-wrapper.entering {
      animation: premiumCardEnter 0.9s ease both;
    }
    /* 뒤집기 래퍼 */
    .premium-flip-inner {
      display: block;
      width: 100%;
      height: 100%;
    }
    .premium-flip-inner.flip-out {
      animation: premiumFlipOut 0.28s ease forwards;
    }
    .premium-flip-inner.flip-in {
      animation: premiumFlipIn 0.28s ease forwards;
    }
    .premium-flip-inner.selected {
      transform: scale(1.06);
    }
  `;
  document.head.appendChild(style);
}

// ─── 웹 카드 컴포넌트 ────────────────────────────────────────────────────────
interface WebCardProps {
  card: CardData;
  index: number;
  isFlipped: boolean;
  isSelected: boolean;
  onPress: () => void;
  entryDelay: number;
}

function WebCard({ card, index, isFlipped, isSelected, onPress, entryDelay }: WebCardProps) {
  const wrapperRef = useRef<any>(null);
  const flipRef = useRef<any>(null);
  const prevFlipped = useRef(isFlipped);
  const [showFront, setShowFront] = useState(isFlipped);

  // 셔플 등장 애니메이션 (rAF 두 번 중첩으로 첫 paint 후 시작)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    // 딜레이 적용
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (el) {
            el.style.animationDelay = "0ms";
            el.classList.add("entering");
          }
        });
      });
    }, entryDelay);
    return () => clearTimeout(timer);
  }, []);

  // 카드 뒤집기 애니메이션
  useEffect(() => {
    if (prevFlipped.current === isFlipped) return;
    prevFlipped.current = isFlipped;

    const flipEl = flipRef.current;
    if (!flipEl) return;

    // flip-out
    flipEl.classList.remove("flip-in", "selected");
    flipEl.classList.add("flip-out");

    const onFlipOutEnd = () => {
      flipEl.removeEventListener("animationend", onFlipOutEnd);
      setShowFront(isFlipped);
      flipEl.classList.remove("flip-out");

      // flip-in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flipEl.classList.add("flip-in");
          const onFlipInEnd = () => {
            flipEl.removeEventListener("animationend", onFlipInEnd);
            flipEl.classList.remove("flip-in");
            if (isFlipped) {
              flipEl.classList.add("selected");
            }
          };
          flipEl.addEventListener("animationend", onFlipInEnd);
        });
      });
    };
    flipEl.addEventListener("animationend", onFlipOutEnd);
  }, [isFlipped]);

  const borderStyle = card.colorKor === "화이트"
    ? { borderWidth: isSelected ? 2.5 : 1.5, borderColor: isSelected ? "#A08050" : "#D8C7A5", borderStyle: "solid" as const }
    : card.colorKor === "블랙"
    ? { borderWidth: isSelected ? 2.5 : 1.5, borderColor: "#D4AF37", borderStyle: "solid" as const }
    : isSelected
    ? { borderWidth: 2.5, borderColor: "#FFFFFF", borderStyle: "solid" as const }
    : {};

  return (
    <div
      ref={wrapperRef}
      className="premium-card-wrapper"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        cursor: "pointer",
        flexShrink: 0,
      }}
      onClick={onPress}
    >
      <div
        ref={flipRef}
        className="premium-flip-inner"
        style={{
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: showFront ? card.colorHex : CARD_BACK_COLOR,
          ...borderStyle,
          boxShadow: isSelected
            ? `0 4px 14px ${card.colorHex}88`
            : "0 2px 6px rgba(0,0,0,0.18)",
        }}
      >
        {showFront ? (
          // 앞면: 컬러 + 도형
          <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}>
            <span style={{
              fontSize: 22,
              color: card.colorKor === "화이트" ? "#D4AF37" : "rgba(255,255,255,0.92)",
              lineHeight: 1.2,
            }}>{card.shapeSymbol}</span>
            <span style={{
              fontSize: 8,
              color: card.colorKor === "화이트" ? "#D4AF37" : "rgba(255,255,255,0.95)",
              fontWeight: "700",
              letterSpacing: 0.2,
            }}>{card.colorKor}</span>
          </div>
        ) : (
          // 뒷면: 베이지 + 물결 패턴
          <div style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}>
            {/* SVG 물결 패턴 */}
            <svg
              width={CARD_WIDTH}
              height={CARD_HEIGHT}
              viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
              style={{ position: "absolute", top: 0, left: 0 }}
            >
              <path
                d={`M -10 ${CARD_HEIGHT * 0.25} Q ${CARD_WIDTH * 0.25} ${CARD_HEIGHT * 0.18} ${CARD_WIDTH * 0.5} ${CARD_HEIGHT * 0.25} Q ${CARD_WIDTH * 0.75} ${CARD_HEIGHT * 0.32} ${CARD_WIDTH + 10} ${CARD_HEIGHT * 0.25}`}
                stroke="rgba(120, 105, 88, 0.18)" strokeWidth="1" fill="none"
              />
              <path
                d={`M -10 ${CARD_HEIGHT * 0.5} Q ${CARD_WIDTH * 0.25} ${CARD_HEIGHT * 0.43} ${CARD_WIDTH * 0.5} ${CARD_HEIGHT * 0.5} Q ${CARD_WIDTH * 0.75} ${CARD_HEIGHT * 0.57} ${CARD_WIDTH + 10} ${CARD_HEIGHT * 0.5}`}
                stroke="rgba(120, 105, 88, 0.14)" strokeWidth="1" fill="none"
              />
              <path
                d={`M -10 ${CARD_HEIGHT * 0.75} Q ${CARD_WIDTH * 0.25} ${CARD_HEIGHT * 0.68} ${CARD_WIDTH * 0.5} ${CARD_HEIGHT * 0.75} Q ${CARD_WIDTH * 0.75} ${CARD_HEIGHT * 0.82} ${CARD_WIDTH + 10} ${CARD_HEIGHT * 0.75}`}
                stroke="rgba(120, 105, 88, 0.12)" strokeWidth="1" fill="none"
              />
              <circle cx={CARD_WIDTH * 0.5} cy={CARD_HEIGHT * 0.5} r="2.5" fill="rgba(120, 105, 88, 0.25)" />
              <circle cx={CARD_WIDTH * 0.5} cy={CARD_HEIGHT * 0.5} r="5" stroke="rgba(120, 105, 88, 0.15)" strokeWidth="0.8" fill="none" />
              <circle cx={CARD_WIDTH * 0.5} cy={CARD_HEIGHT * 0.5} r="8.5" stroke="rgba(120, 105, 88, 0.10)" strokeWidth="0.6" fill="none" />
            </svg>
            <span style={{ fontSize: 10, color: CARD_BACK_SYMBOL_COLOR, position: "relative", zIndex: 1 }}>✦</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 네이티브 카드 컴포넌트 ──────────────────────────────────────────────────
function NativeCard({
  card,
  isFlipped,
  isSelected,
  flipAnim,
  revealDelay,
  onPress,
}: {
  card: CardData;
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
        {/* 카드 뒷면 */}
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
          <Svg
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            <Path
              d={`M -10 ${CARD_HEIGHT * 0.25} Q ${CARD_WIDTH * 0.25} ${CARD_HEIGHT * 0.18} ${CARD_WIDTH * 0.5} ${CARD_HEIGHT * 0.25} Q ${CARD_WIDTH * 0.75} ${CARD_HEIGHT * 0.32} ${CARD_WIDTH + 10} ${CARD_HEIGHT * 0.25}`}
              stroke="rgba(120, 105, 88, 0.18)" strokeWidth="1" fill="none"
            />
            <Path
              d={`M -10 ${CARD_HEIGHT * 0.5} Q ${CARD_WIDTH * 0.25} ${CARD_HEIGHT * 0.43} ${CARD_WIDTH * 0.5} ${CARD_HEIGHT * 0.5} Q ${CARD_WIDTH * 0.75} ${CARD_HEIGHT * 0.57} ${CARD_WIDTH + 10} ${CARD_HEIGHT * 0.5}`}
              stroke="rgba(120, 105, 88, 0.14)" strokeWidth="1" fill="none"
            />
            <Path
              d={`M -10 ${CARD_HEIGHT * 0.75} Q ${CARD_WIDTH * 0.25} ${CARD_HEIGHT * 0.68} ${CARD_WIDTH * 0.5} ${CARD_HEIGHT * 0.75} Q ${CARD_WIDTH * 0.75} ${CARD_HEIGHT * 0.82} ${CARD_WIDTH + 10} ${CARD_HEIGHT * 0.75}`}
              stroke="rgba(120, 105, 88, 0.12)" strokeWidth="1" fill="none"
            />
            <Circle cx={CARD_WIDTH * 0.5} cy={CARD_HEIGHT * 0.5} r="2.5" fill="rgba(120, 105, 88, 0.25)" />
            <Circle cx={CARD_WIDTH * 0.5} cy={CARD_HEIGHT * 0.5} r="5" stroke="rgba(120, 105, 88, 0.15)" strokeWidth="0.8" fill="none" />
            <Circle cx={CARD_WIDTH * 0.5} cy={CARD_HEIGHT * 0.5} r="8.5" stroke="rgba(120, 105, 88, 0.10)" strokeWidth="0.6" fill="none" />
          </Svg>
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
              borderWidth: card.colorKor === "화이트" ? (isSelected ? 2.5 : 1.5) : (isSelected ? 2.5 : 0),
              borderColor: card.colorKor === "블랙"
                ? "#D4AF37"
                : card.colorKor === "화이트"
                ? (isSelected ? "#A08050" : "#D8C7A5")
                : "#FFFFFF",
            },
          ]}
        >
          <Text style={[styles.shapeSymbol, card.colorKor === "화이트" && { color: "#D4AF37" }]}>
            {card.shapeSymbol}
          </Text>
          <Text
            style={[styles.cardFrontColorName, card.colorKor === "화이트" && { color: "#D4AF37" }]}
            numberOfLines={1}
          >
            {card.colorKor}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── 메인 화면 ──────────────────────────────────────────────────────────────
export default function PremiumSelectScreen() {
  const router = useRouter();

  // 진입 시 체험/결제 상태 확인
  useEffect(() => {
    isPremiumActive().then((active) => {
      if (!active) {
        router.replace("/payment" as any);
      }
    });
  }, []);

  // CSS 주입 (웹 전용, 최초 1회)
  useEffect(() => {
    injectPremiumCSS();
  }, []);

  const [shuffledCards] = useState<CardData[]>(() => shuffleArray(CARD_DATA));
  const [selectedCards, setSelectedCards] = useState<(CardData | null)[]>([null, null, null]);
  const [flippedIndices, setFlippedIndices] = useState<Set<number>>(new Set());
  const [isShuffling, setIsShuffling] = useState(true);
  const [prevSelectedColors, setPrevSelectedColors] = useState<ColorData[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("premiumSelectedColors").then(data => {
      if (data) {
        try {
          const ids: ColorData[] = JSON.parse(data);
          setPrevSelectedColors(ids);
        } catch {}
      }
    });
  }, []);

  // 네이티브용 flip 애니메이션
  const flipAnims = useRef<Animated.Value[]>(
    Array.from({ length: 63 }, () => new Animated.Value(0))
  ).current;

  const selectedCount = selectedCards.filter(Boolean).length;

  // 셔플 완료 타이머 (63장 × 18ms + 900ms 애니메이션 = 약 2034ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShuffling(false);
    }, 2100);
    return () => clearTimeout(timer);
  }, []);

  const handleCardPress = useCallback(
    (index: number) => {
      if (isShuffling) return;
      const card = shuffledCards[index];

      const selectedIndex = selectedCards.findIndex((c) => c?.id === card.id);
      if (selectedIndex !== -1) {
        // 선택 취소
        const newSelected = [...selectedCards];
        newSelected[selectedIndex] = null;
        setSelectedCards(newSelected);
        setFlippedIndices((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
        if (Platform.OS !== "web") {
          Animated.timing(flipAnims[index], {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
        return;
      }

      if (selectedCount >= 3) return;

      if (Platform.OS !== "web") {
        Animated.timing(flipAnims[index], {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }

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
        {/* 단계 배지 */}
        <View style={styles.stepBadgeRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>2단계 · 심리카드 흐름</Text>
          </View>
        </View>

        {/* 이전 단계 컬러 요약 */}
        {prevSelectedColors.length > 0 && (
          <View style={[styles.colorFlowBanner, { backgroundColor: "#8BAF8B11", borderColor: "#8BAF8B44" }]}>
            <Text style={[styles.colorFlowTitle, { color: "#3D6B3D" }]}>
              🌿 1단계 컬러 흐름
            </Text>
            <View style={styles.colorFlowRow}>
              {prevSelectedColors.map((c: ColorData) => (
                <View key={c.id} style={styles.colorFlowItem}>
                  <View style={[styles.colorFlowDot, { backgroundColor: c.hex }]} />
                  <Text style={[styles.colorFlowName, { color: "#3D6B3D" }]}>{c.korName}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.colorFlowDesc, { color: '#8A7A68' }]}>
              이 컬러 흐름을 바탕으로, 직관이 이끄는 카드를 선택해 주세요
            </Text>
          </View>
        )}

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: '#3D3530' }]}>
            컨러 에너지 카드 선택
          </Text>
          <Text style={[styles.subtitle, { color: '#5F4B3B' }]}>
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
                      : '#F2EFE7',
                    borderColor: selectedCards[i]
                      ? POSITION_COLORS[i]
                      : '#DDD8CE',
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
                    <Text style={[styles.slotCardName, { color: '#3D3530' }]}>
                      {selectedCards[i]!.colorKor}
                    </Text>
                    <Text style={[styles.slotShapeName, { color: '#5F4B3B' }]}>
                      {selectedCards[i]!.shapeKor}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.slotEmpty, { color: '#8A7A68' }]}>
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
        <Text style={[styles.progressText, { color: '#5F4B3B' }]}>
          {isShuffling
            ? "✨ 카드를 섞는 중..."
            : selectedCount < 3
            ? `마음이 이끄는 카드를 ${3 - selectedCount}장 선택해 주세요`
            : "3장 선택 완료 · 아래 버튼을 눌러 해석을 확인하세요"}
        </Text>

        {/* 카드 그리드 */}
        <View style={styles.cardGrid}>
          {shuffledCards.map((card, index) => {
            const isFlipped = flippedIndices.has(index);
            const isSelected = selectedCards.some((c) => c?.id === card.id);
            // 순차 딜레이: 0~62번 카드 → 0ms ~ 1116ms (18ms 간격)
            const entryDelay = index * 18;

            if (Platform.OS === "web") {
              return (
                <WebCard
                  key={card.id}
                  card={card}
                  index={index}
                  isFlipped={isFlipped}
                  isSelected={isSelected}
                  onPress={() => handleCardPress(index)}
                  entryDelay={entryDelay}
                />
              );
            }

            return (
              <NativeCard
                key={card.id}
                card={card}
                isFlipped={isFlipped}
                isSelected={isSelected}
                flipAnim={flipAnims[index]}
                revealDelay={entryDelay}
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
              backgroundColor: selectedCount === 3 ? "#3D6B3D" : '#DDD8CE',
            },
          ]}
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={selectedCount < 3}
        >
          <Text style={styles.confirmButtonText}>
            {selectedCount === 3
              ? "나의 컬러 심리 해석하기 →"
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
  stepBadgeRow: {
    alignItems: "center",
    marginBottom: 8,
  },
  stepBadge: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#8BAF8B55",
    backgroundColor: "#8BAF8B11",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3D6B3D",
  },
  colorFlowBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  colorFlowTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  colorFlowRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  colorFlowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  colorFlowDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  colorFlowName: {
    fontSize: 12,
    fontWeight: "600",
  },
  colorFlowDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
});
