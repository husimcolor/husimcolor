import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { COLOR_DATA, type ColorData } from "@/constants/colorData";
import { isPremiumActive } from "@/lib/trialUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWATCH_SIZE = (SCREEN_WIDTH - 48 - 24) / 5; // 5열 배치

// 한국어 조사 처리 헬퍼
function josa(word: string, jong: string, noJong: string): string {
  if (!word) return jong;
  const lastChar = word[word.length - 1];
  const code = lastChar.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const jongseong = (code - 0xAC00) % 28;
    return jongseong > 0 ? jong : noJong;
  }
  return jong;
}
function wa(word: string) { return word + josa(word, '과', '와'); }
function eul(word: string) { return word + josa(word, '을', '를'); }
function i_ga(word: string) { return word + josa(word, '이', '가'); }
function eun_neun(word: string) { return word + josa(word, '은', '는'); }

// 컬러 3개 조합으로 성향 해석 생성
function buildColorInterpretation(colors: ColorData[]): {
  psychologyTendency: string;
  personalityTendency: string;
  strengths: string[];
  shadows: string[];
  relationshipTendency: string;
} {
  const [c1, c2, c3] = colors;

  // 심리 성향: 3가지 컬러의 현재 성향·기질 흐름을 연결 + reading1 핵심 한 줄 반영
  // 각 컬러 reading1에서 첫 문장만 추출 (첫 마침표 기준)
  const c1Reading = c1.reading1.split('.')[0].trim();
  const c2Reading = c2.reading1.split('.')[0].trim();
  const c3Reading = c3.reading1.split('.')[0].trim();

  const psychologyTendency =
    `${eun_neun(c1.korName)} ${c1.keywords[0]}${josa(c1.keywords[0], '과', '와')} ${c1.keywords[1]}${josa(c1.keywords[1], '을', '를')} 중요하게 여기는 성향을 나타냅니다. ` +
    `${c2.korName}의 ${c2.keywords[0]} 기질과 ${c3.korName}의 ${c3.keywords[0]} 성향이 함께 작동하면서, ` +
    `${c2.keywords[1]}${josa(c2.keywords[1], '을', '를')} 바탕으로 ${c3.keywords[1]}${josa(c3.keywords[1], '을', '를')} 함께 추구하는 흐름이 나타나고 있습니다.`;

  // 성격 경향: 3가지 컬러의 strengths 조합
  const allStrengths = [...new Set([...c1.strengths, ...c2.strengths, ...c3.strengths])];
  const strengths = allStrengths.slice(0, 5);

  // 그림자: 3가지 컬러의 shadows 조합
  const allShadows = [...new Set([...c1.shadows, ...c2.shadows, ...c3.shadows])];
  const shadows = allShadows.slice(0, 3);

  // 성격 경향 텍스트 + reading1 핵심 한 줄 자연스럽게 연결
  const personalityTendency =
    `${c1.korName}·${c2.korName}·${c3.korName} 성향을 선택한 당신은, ` +
    `${strengths[0] ?? ''}${josa(strengths[0] ?? '', '과', '와')} ${strengths[1] ?? ''}${josa(strengths[1] ?? '', '이', '가')} 자연스럽게 드러나는 기질입니다. ` +
    `${c2Reading}. ${c3Reading}. ` +
    `이러한 성향들이 서로 어우러지며 지금 당신의 삶을 만들어가고 있습니다.`;

  // 관계 성향 (콜러별 고유 relStyle 키워드 기반)
  const c1Rel0 = c1.relStyle?.[0] ?? '자연스럽게 연결되는';
  const c2Rel1 = c2.relStyle?.[1] ?? '진심으로 소통하는';
  const c3Rel0 = c3.relStyle?.[0] ?? '안정적으로 연결되는';
  const relationshipTendency =
    `${c1.korName}의 ${c1Rel0} 방식과 ${c2.korName}의 ${c2Rel1} 성향이 함께 드러납니다. ` +
    `${c3.korName}의 ${c3Rel0} 흐름이 관계 속 안정감을 더해줍니다. ` +
    (c1.id === 'orange' || c1.id === 'peach' || c1.id === 'coral'
      ? `따뜻한 관계 속에서 활력을 얻고, 서로 편안하게 기댈 수 있는 관계를 소중히 여기는 스타일입니다.`
      : c1.id === 'violet' || c1.id === 'indigo' || c1.id === 'blue'
      ? `깊이 있는 연결을 원하면서도, 자신만의 조용한 시간이 필요한 스타일입니다.`
      : c1.id === 'yellow' || c1.id === 'green'
      ? `안정적이고 균형 잡힌 관계를 중요하게 여기며, 서로 편안하게 성장하는 관계를 선호합니다.`
      : `깊이 있는 연결을 원하면서도, 자신만의 시간과 리듬이 필요한 스타일입니다.`);

  return { psychologyTendency, personalityTendency, strengths, shadows, relationshipTendency };
}

export default function PremiumColorSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedColors, setSelectedColors] = useState<ColorData[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [interpretation, setInterpretation] = useState<ReturnType<typeof buildColorInterpretation> | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      const active = await isPremiumActive();
      if (!active) {
        router.replace("/payment" as any);
      }
    };
    checkAccess();
  }, []);

  const handleColorToggle = (color: ColorData) => {
    setSelectedColors(prev => {
      const exists = prev.find(c => c.id === color.id);
      if (exists) return prev.filter(c => c.id !== color.id);
      if (prev.length >= 3) {
        Alert.alert("3가지 컬러를 선택해 주세요", "이미 3가지 컬러를 선택하셨습니다.\n변경하려면 선택된 컬러를 먼저 해제해 주세요.");
        return prev;
      }
      return [...prev, color];
    });
  };

  const handleAnalyze = () => {
    if (selectedColors.length < 3) {
      Alert.alert("컬러 선택", "마음이 이끄는 컬러 3가지를 선택해 주세요.");
      return;
    }
    const result = buildColorInterpretation(selectedColors);
    setInterpretation(result);
    setShowResult(true);
  };

  const handleContinue = async () => {
    // 선택한 컬러 정보 저장 (심리카드 결과 화면에서 활용)
    await AsyncStorage.setItem("premiumSelectedColors", JSON.stringify(selectedColors));
    router.push("/premium-select" as any);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.stepBadge, { color: "#8BAF8B", borderColor: "#8BAF8B55", backgroundColor: "#8BAF8B11" }]}>
            1단계 · 컬러 에너지 흐름
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            마음이 이끄는 컬러를{"\n"}3가지 선택해 주세요
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            지금 이 순간 눈길이 가는 컬러를{"\n"}직관적으로 선택해 주세요
          </Text>
        </View>

        {/* 선택된 컬러 미리보기 */}
        <View style={styles.selectedPreview}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.selectedSlot,
                {
                  backgroundColor: selectedColors[i] ? selectedColors[i].hex : colors.surface,
                  borderColor: selectedColors[i] ? selectedColors[i].hex : colors.border,
                  borderStyle: selectedColors[i] ? "solid" : "dashed",
                },
              ]}
            >
              {selectedColors[i] ? (
                <Text style={styles.selectedSlotText}>{selectedColors[i].korName}</Text>
              ) : (
                <Text style={[styles.selectedSlotEmpty, { color: colors.muted }]}>{i + 1}번</Text>
              )}
            </View>
          ))}
        </View>

        {/* 컬러 팔레트 */}
        <View style={styles.paletteContainer}>
          <View style={styles.paletteGrid}>
            {COLOR_DATA.map(color => {
              const isSelected = selectedColors.some(c => c.id === color.id);
              const selectedIndex = selectedColors.findIndex(c => c.id === color.id);
              return (
                <TouchableOpacity
                  key={color.id}
                  style={[
                    styles.swatch,
                    { backgroundColor: color.hex },
                    isSelected && styles.swatchSelected,
                  ]}
                  onPress={() => handleColorToggle(color)}
                  activeOpacity={0.75}
                >
                  {isSelected && (
                    <View style={styles.swatchBadge}>
                      <Text style={styles.swatchBadgeText}>{selectedIndex + 1}</Text>
                    </View>
                  )}
                  <Text style={[styles.swatchLabel, { color: "#fff", textShadowColor: "rgba(0,0,0,0.4)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }]}>
                    {color.korName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 분석 버튼 */}
        {!showResult && (
          <TouchableOpacity
            style={[
              styles.analyzeBtn,
              {
                backgroundColor: selectedColors.length === 3 ? "#8BAF8B" : colors.surface,
                borderColor: selectedColors.length === 3 ? "#8BAF8B" : colors.border,
              },
            ]}
            onPress={handleAnalyze}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.analyzeBtnText,
              { color: selectedColors.length === 3 ? "#fff" : colors.muted }
            ]}>
              {selectedColors.length === 3
                ? "🌿 컬러 흐름 해석 보기"
                : `${selectedColors.length}/3 컬러 선택 중`}
            </Text>
          </TouchableOpacity>
        )}

        {/* 해석 결과 */}
        {showResult && interpretation && (
          <View style={styles.resultContainer}>
            {/* 1단계 역할 안내 문구 */}
            <View style={[styles.stageGuide, { backgroundColor: "#8BAF8B0D", borderColor: "#8BAF8B33" }]}>
              <Text style={[styles.stageGuideText, { color: colors.muted }]}>
                1단계는 현재 스스로 인식하고 있는 성향과 관계 흐름을 살펴보는 단계입니다.
              </Text>
            </View>

            {/* 선택 컬러 요약 */}
            <View style={[styles.colorSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.colorSummaryTitle, { color: colors.foreground }]}>
                선택한 컬러 흐름
              </Text>
              <View style={styles.colorSummaryRow}>
                {selectedColors.map((c, i) => (
                  <View key={c.id} style={styles.colorSummaryItem}>
                    <View style={[styles.colorDot, { backgroundColor: c.hex }]} />
                    <Text style={[styles.colorSummaryName, { color: colors.foreground }]}>{c.korName}</Text>
                    <Text style={[styles.colorSummaryKeyword, { color: colors.muted }]}>{c.keywords[0]}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 심리 성향 */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: "#8BAF8B44" }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#8BAF8B" }]} />
                <Text style={[styles.sectionLabel, { color: "#8BAF8B" }]}>심리 성향</Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.foreground }]}>
                {interpretation.psychologyTendency}
              </Text>
            </View>

            {/* 성격 경향 */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: "#B5A0C844" }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#B5A0C8" }]} />
                <Text style={[styles.sectionLabel, { color: "#B5A0C8" }]}>성격 경향</Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.foreground }]}>
                {interpretation.personalityTendency}
              </Text>
            </View>

            {/* 장점 */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: "#C4956A44" }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#C4956A" }]} />
                <Text style={[styles.sectionLabel, { color: "#C4956A" }]}>주요 장점</Text>
              </View>
              <View style={styles.tagRow}>
                {interpretation.strengths.map(s => (
                  <View key={s} style={[styles.tag, { backgroundColor: "#C4956A18", borderColor: "#C4956A44" }]}>
                    <Text style={[styles.tagText, { color: "#C4956A" }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 성장 가능성 */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: "#7B9FBF44" }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#7B9FBF" }]} />
                <Text style={[styles.sectionLabel, { color: "#7B9FBF" }]}>성장 가능성</Text>
              </View>
              <Text style={[{ color: colors.muted, fontSize: 11, marginBottom: 8, lineHeight: 16 }]}>이 성향을 이해하면 더 자연스러운 성장의 방향이 보입니다</Text>
              <View style={styles.tagRow}>
                {interpretation.shadows.map(s => (
                  <View key={s} style={[styles.tag, { backgroundColor: "#7B9FBF18", borderColor: "#7B9FBF44" }]}>
                    <Text style={[styles.tagText, { color: "#7B9FBF" }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 관계 성향 */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: "#A0845C44" }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#A0845C" }]} />
                <Text style={[styles.sectionLabel, { color: "#A0845C" }]}>관계 성향</Text>
              </View>
              <Text style={[styles.sectionText, { color: colors.foreground }]}>
                {interpretation.relationshipTendency}
              </Text>
            </View>

            {/* 다음 단계 안내 */}
            <View style={[styles.nextStepBanner, { backgroundColor: "#8BAF8B11", borderColor: "#8BAF8B44" }]}>
              <Text style={[styles.nextStepTitle, { color: "#8BAF8B" }]}>
                🌿 2단계 · 심리카드 흐름
              </Text>
              <Text style={[styles.nextStepDesc, { color: colors.muted }]}>
                이제 보지 않고 직관으로 카드 3장을 선택합니다.{"\n"}
                무의식 · 현재 · 회복 방향의 에너지를 확인해 보세요.
              </Text>
            </View>

            {/* 다음 단계 버튼 */}
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: "#8BAF8B" }]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueBtnText}>
                심리카드 3장 선택하기 →
              </Text>
            </TouchableOpacity>

            {/* 다시 선택 버튼 */}
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: colors.border }]}
              onPress={() => {
                setShowResult(false);
                setSelectedColors([]);
                setInterpretation(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetBtnText, { color: colors.muted }]}>
                컬러 다시 선택하기
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  stepBadge: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  selectedPreview: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  selectedSlot: {
    width: 80,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedSlotText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectedSlotEmpty: {
    fontSize: 13,
    fontWeight: "500",
  },
  paletteContainer: {
    marginBottom: 20,
  },
  paletteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
    overflow: "hidden",
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  swatchBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#333",
  },
  swatchLabel: {
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
  },
  analyzeBtn: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  analyzeBtnText: {
    fontSize: 16,
    fontWeight: "700",
  },
  resultContainer: {
    gap: 12,
  },
  colorSummary: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  colorSummaryTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },
  colorSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  colorSummaryItem: {
    alignItems: "center",
    gap: 4,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSummaryName: {
    fontSize: 12,
    fontWeight: "600",
  },
  colorSummaryKeyword: {
    fontSize: 10,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  nextStepBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    marginTop: 4,
  },
  nextStepTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  nextStepDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  continueBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  resetBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },
  stageGuide: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  stageGuideText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
