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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { COLOR_DATA, type ColorData } from "@/constants/colorData";
import { isPremiumActive } from "@/lib/trialUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWATCH_SIZE = (SCREEN_WIDTH - 48 - 24) / 5; // 5열 배치

// 밝은 컬러(크림, 화이트 등) 자동 테두리 처리
function getLightColorBorder(hex: string): { borderWidth: number; borderColor: string } | {} {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness >= 200) {
    return { borderWidth: 1.5, borderColor: '#C8BFB0' };
  }
  return {};
}

// 밝은 컬러 여부 판별 (brightness >= 190이면 어두운 텍스트 사용)
function getSwatchTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 190 ? '#5F4B3B' : '#FFFFFF';
}

function getSwatchTextShadow(hex: string): object {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness >= 190) {
    return { textShadowColor: 'rgba(255,255,255,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 };
  }
  return { textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 };
}

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

  // ── 심리 성향 ──
  // 섹션 분위기: 현재 성향·기질 흐름 중심 (진단보다 공감)
  const psychologyTendency =
    `${eun_neun(c1.korName)} ${c1.keywords[0]}${josa(c1.keywords[0], '과', '와')} ${c1.keywords[1]}${josa(c1.keywords[1], '을', '를')} 중요하게 여기는 성향을 나타냅니다. ` +
    `여기에 ${c2.korName}의 ${c2.keywords[0]} 기질이 더해지면서, ` +
    `${c3.korName}의 ${c3.keywords[0]}${josa(c3.keywords[0], '을', '를')} 함께 추구하는 흐름이 자연스럽게 나타나고 있습니다.`;

  // ── 성격 경향 ──
  // 섹션 분위기: 강점 중심 + 삶에서 드러나는 기질 (긍정적 서술)
  const allStrengths = [...new Set([...c1.strengths, ...c2.strengths, ...c3.strengths])];
  const strengths = allStrengths.slice(0, 5);
  const allShadows = [...new Set([...c1.shadows, ...c2.shadows, ...c3.shadows])];
  const shadows = allShadows.slice(0, 3);
  const s0 = strengths[0] ?? '';
  const s1 = strengths[1] ?? '';
  const personalityTendency =
    `${c1.korName}·${c2.korName}·${c3.korName} 성향을 선택한 당신은, ` +
    `${s0}${josa(s0, '과', '와')} ${s1}${josa(s1, '이', '가')} 자연스럽게 드러나는 기질입니다. ` +
    `사람들과 함께할 때 ${c2.keywords[0]}${josa(c2.keywords[0], '을', '를')} 느끼고, ` +
    `${c3.keywords[0]}${josa(c3.keywords[0], '을', '를')} 매우 중요하게 여깁니다. ` +
    `이러한 성향이 서로 연결되면서 지금의 삶을 만들어가고 있습니다.`;

  // ── 관계 성향 ──
  // 섹션 분위기: 실제 관계 언어 + 편안하고 공감되는 표현
  const c1Rel0 = c1.relStyle?.[0] ?? '자연스럽게 연결되는';
  const c2Rel1 = c2.relStyle?.[1] ?? '진심으로 소통하는';
  const c3Rel0 = c3.relStyle?.[0] ?? '안정적으로 이어가는';
  // c1 컬러 기반 관계 마무리 문장 분기
  const relEnding =
    (c1.id === 'orange' || c1.id === 'peach' || c1.id === 'coral')
      ? `따뜻하고 활기찬 관계 속에서 에너지를 얻는 편이며, 서로 편안하게 기댈 수 있는 관계를 소중히 여깁니다.`
    : (c1.id === 'violet' || c1.id === 'purple')
      ? `깊이 있는 대화와 진솔한 연결을 원하며, 혼자만의 성찰 시간도 관계만큼 소중하게 여깁니다.`
    : (c1.id === 'blue' || c1.id === 'navy' || c1.id === 'indigo')
      ? `신뢰를 바탕으로 한 안정적인 관계를 선호하며, 책임감 있게 관계를 이어가는 스타일입니다.`
    : (c1.id === 'yellow')
      ? `현실적인 균형 감각으로 관계를 이어가며, 서로 명료하게 소통하고 부담 없이 함께할 수 있는 관계를 선호합니다.`
    : (c1.id === 'green')
      ? `편안하고 안정적인 관계를 중요하게 여기며, 서로 부담 없이 성장할 수 있는 관계를 선호합니다.`
    : (c1.id === 'red')
      ? `열정적으로 관계에 임하며, 함께 목표를 향해 나아가는 관계에서 활력을 얻습니다.`
    : (c1.id === 'lavender')
      ? `섬세한 공감과 배려로 관계를 이어가며, 감정적으로 편안한 분위기를 중요하게 여깁니다.`
    : `깊이 있는 연결을 원하면서도, 자신만의 시간과 리듬이 필요한 스타일입니다.`;
  const relationshipTendency =
    `${c1.korName}의 성향은 ${c1Rel0} 방식으로 관계에서 드러납니다. ` +
    `${c2.korName}의 ${c2Rel1} 성향이 관계를 더 풍부하게 만들고, ` +
    `${c3.korName}의 ${c3Rel0} 흐름이 관계 속 안정감을 더해줍니다. ` +
    relEnding;

  return { psychologyTendency, personalityTendency, strengths, shadows, relationshipTendency };
}

export default function PremiumColorSelectScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 60 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.stepBadge, { color: "#3D6B3D", borderColor: "#8BAF8B55", backgroundColor: "#8BAF8B11" }]}>
            1단계 · 컬러 에너지 흐름
          </Text>
          <Text style={[styles.title, { color: '#3D3530' }]}>
            마음이 이끄는 컬러를{"\n"}3가지 선택해 주세요
          </Text>
          <Text style={[styles.subtitle, { color: '#5F4B3B' }]}>
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
                  backgroundColor: selectedColors[i] ? selectedColors[i].hex : '#F2EFE7',
                  borderColor: selectedColors[i] ? selectedColors[i].hex : '#DDD8CE',
                  borderStyle: selectedColors[i] ? "solid" : "dashed",
                },
              ]}
            >
              {selectedColors[i] ? (
                <Text style={styles.selectedSlotText}>{selectedColors[i].korName}</Text>
              ) : (
                <Text style={[styles.selectedSlotEmpty, { color: '#8A7A68' }]}>{i + 1}번</Text>
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
                    getLightColorBorder(color.hex),
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
                  <Text style={[styles.swatchLabel, { color: getSwatchTextColor(color.hex), ...getSwatchTextShadow(color.hex) }]}>
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
                backgroundColor: selectedColors.length === 3 ? "#3D6B3D" : '#F2EFE7',
                borderColor: selectedColors.length === 3 ? "#3D6B3D" : '#DDD8CE',
              },
            ]}
            onPress={handleAnalyze}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.analyzeBtnText,
              { color: selectedColors.length === 3 ? "#fff" : '#8A7A68' }
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
              <Text style={[styles.stageGuideText, { color: '#8A7A68' }]}>
                1단계는 현재 스스로 인식하고 있는 성향과 관계 흐름을 살펴보는 단계입니다.
              </Text>
            </View>

            {/* 선택 컬러 요약 */}
            <View style={[styles.colorSummary, { backgroundColor: '#F2EFE7', borderColor: '#DDD8CE' }]}>
              <Text style={[styles.colorSummaryTitle, { color: '#3D3530' }]}>
                선택한 컬러 흐름
              </Text>
              <View style={styles.colorSummaryRow}>
                {selectedColors.map((c, i) => (
                  <View key={c.id} style={styles.colorSummaryItem}>
                    <View style={[styles.colorDot, { backgroundColor: c.hex }, getLightColorBorder(c.hex)]} />
                    <Text style={[styles.colorSummaryName, { color: '#3D3530' }]}>{c.korName}</Text>
                    <Text style={[styles.colorSummaryKeyword, { color: '#8A7A68' }]}>{c.keywords[0]}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 심리 성향 */}
            <View style={[styles.sectionCard, { backgroundColor: '#F2EFE7', borderColor: "#8BAF8B44" }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#3D6B3D" }]} />
                <Text style={[styles.sectionLabel, { color: "#3D6B3D" }]}>심리 성향</Text>
              </View>
              <Text style={[styles.sectionText, { color: '#3D3530' }]}>
                {interpretation.psychologyTendency}
              </Text>
            </View>

            {/* 성격 경향 */}
            <View style={[styles.sectionCard, { backgroundColor: '#F2EFE7', borderColor: "#B5A0C844" }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#6B4A9A" }]} />
                <Text style={[styles.sectionLabel, { color: "#6B4A9A" }]}>성격 경향</Text>
              </View>
              <Text style={[styles.sectionText, { color: '#3D3530' }]}>
                {interpretation.personalityTendency}
              </Text>
            </View>

            {/* 장점 */}
            <View style={[styles.sectionCard, { backgroundColor: '#F2EFE7', borderColor: "#C4956A44" }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#7A4A10" }]} />
                <Text style={[styles.sectionLabel, { color: "#7A4A10" }]}>주요 장점</Text>
              </View>
              <View style={styles.tagRow}>
                {interpretation.strengths.map(s => (
                  <View key={s} style={[styles.tag, { backgroundColor: "#C4956A18", borderColor: "#C4956A44" }]}>
                    <Text style={[styles.tagText, { color: "#7A4A10" }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 성장 가능성 */}
            <View style={[styles.sectionCard, { backgroundColor: '#F2EFE7', borderColor: "#7B9FBF44" }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#2A5A80" }]} />
                <Text style={[styles.sectionLabel, { color: "#2A5A80" }]}>성장 가능성</Text>
              </View>
              <Text style={[{ color: '#8A7A68', fontSize: 11, marginBottom: 8, lineHeight: 16 }]}>이 성향을 이해하면 더 자연스러운 성장의 방향이 보입니다</Text>
              <View style={styles.tagRow}>
                {interpretation.shadows.map(s => (
                  <View key={s} style={[styles.tag, { backgroundColor: "#7B9FBF18", borderColor: "#7B9FBF44" }]}>
                    <Text style={[styles.tagText, { color: "#2A5A80" }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 관계 성향 */}
            <View style={[styles.sectionCard, { backgroundColor: '#F2EFE7', borderColor: "#A0845C44" }]}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: "#6B4A10" }]} />
                <Text style={[styles.sectionLabel, { color: "#6B4A10" }]}>관계 성향</Text>
              </View>
              <Text style={[styles.sectionText, { color: '#3D3530' }]}>
                {interpretation.relationshipTendency}
              </Text>
            </View>

            {/* 다음 단계 안내 */}
            <View style={[styles.nextStepBanner, { backgroundColor: "#8BAF8B11", borderColor: "#8BAF8B44" }]}>
              <Text style={[styles.nextStepTitle, { color: "#3D6B3D" }]}>
                🌿 2단계 · 심리카드 흐름
              </Text>
              <Text style={[styles.nextStepDesc, { color: '#8A7A68' }]}>
                이제 보지 않고 직관으로 카드 3장을 선택합니다.{"\n"}
                무의식 · 현재 · 회복 방향의 에너지를 확인해 보세요.
              </Text>
            </View>

            {/* 다음 단계 버튼 */}
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: "#3D6B3D" }]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueBtnText}>
                심리카드 3장 선택하기 →
              </Text>
            </TouchableOpacity>

            {/* 다시 선택 버튼 */}
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: '#DDD8CE' }]}
              onPress={() => {
                setShowResult(false);
                setSelectedColors([]);
                setInterpretation(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetBtnText, { color: '#8A7A68' }]}>
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
