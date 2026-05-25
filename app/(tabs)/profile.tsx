import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export type UserProfile = {
  nickname?: string;
  age: string;
  job: string;
  faith: string;
  concerns?: string[];
};

const AGE_OPTIONS = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];

const JOB_OPTIONS = [
  "생산직",
  "서비스직",
  "사역자",
  "주부",
  "학생",
  "프리랜서",
  "자영업",
  "무직",
  "기타",
];

const FAITH_OPTIONS = ["기독교", "타종교", "무교"];

const CONCERN_OPTIONS = [
  "감정·마음",
  "관계·소통",
  "직업·진로",
  "회복·쉼",
  "방향성·의미",
  "가족·육아",
  "자존감·자기이해",
  "신앙·영성",
];

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();

  const [nickname, setNickname] = useState("");
  const [selectedAge, setSelectedAge] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedFaith, setSelectedFaith] = useState("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);

  const toggleConcern = (concern: string) => {
    setSelectedConcerns((prev) => {
      if (prev.includes(concern)) {
        return prev.filter((c) => c !== concern);
      }
      if (prev.length >= 2) {
        // 최대 2개 — 가장 오래된 항목 제거 후 새 항목 추가
        return [prev[1], concern];
      }
      return [...prev, concern];
    });
  };

  const isReady = selectedAge && selectedJob && selectedFaith;

  const handleNext = async () => {
    if (!isReady) {
      Alert.alert("선택 확인", "나이대, 직업, 종교를 선택해 주세요.");
      return;
    }
    const profile: UserProfile = {
      nickname: nickname.trim() || undefined,
      age: selectedAge,
      job: selectedJob,
      faith: selectedFaith,
      concerns: selectedConcerns.length > 0 ? selectedConcerns : undefined,
    };
    await AsyncStorage.setItem("userProfile", JSON.stringify(profile));
    router.push("/premium-select" as any);
  };

  const accentColor = "#8BAF8B";

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            나를 소개해요
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            더 정확한 컬러 에너지 흐름 분석을 위해{"\n"}간단히 선택해 주세요
          </Text>
        </View>

        {/* 닉네임 (선택) */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
              닉네임
            </Text>
            <Text style={[styles.optionalBadge, { color: colors.muted }]}>
              선택
            </Text>
          </View>
          <TextInput
            style={[
              styles.nicknameInput,
              {
                backgroundColor: colors.surface,
                borderColor: nickname.trim() ? accentColor : colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="원하시면 닉네임을 입력하세요"
            placeholderTextColor={colors.muted}
            value={nickname}
            onChangeText={setNickname}
            maxLength={20}
            returnKeyType="done"
          />
        </View>

        {/* 나이대 */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            나이대
          </Text>
          <View style={styles.chipGrid}>
            {AGE_OPTIONS.map((age) => (
              <TouchableOpacity
                key={age}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      selectedAge === age ? accentColor : colors.surface,
                    borderColor:
                      selectedAge === age ? accentColor : colors.border,
                  },
                ]}
                onPress={() => setSelectedAge(age)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        selectedAge === age ? "#FFFFFF" : colors.foreground,
                      fontWeight: selectedAge === age ? "700" : "400",
                    },
                  ]}
                >
                  {age}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 직업 */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            직업
          </Text>
          <View style={styles.chipGrid}>
            {JOB_OPTIONS.map((job) => (
              <TouchableOpacity
                key={job}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      selectedJob === job ? accentColor : colors.surface,
                    borderColor:
                      selectedJob === job ? accentColor : colors.border,
                  },
                ]}
                onPress={() => setSelectedJob(job)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color:
                        selectedJob === job ? "#FFFFFF" : colors.foreground,
                      fontWeight: selectedJob === job ? "700" : "400",
                    },
                  ]}
                >
                  {job}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 종교 */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            종교
          </Text>
          <View style={styles.faithRow}>
            {FAITH_OPTIONS.map((faith) => (
              <TouchableOpacity
                key={faith}
                style={[
                  styles.faithChip,
                  {
                    backgroundColor:
                      selectedFaith === faith ? accentColor : colors.surface,
                    borderColor:
                      selectedFaith === faith ? accentColor : colors.border,
                  },
                ]}
                onPress={() => setSelectedFaith(faith)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.faithChipText,
                    {
                      color:
                        selectedFaith === faith ? "#FFFFFF" : colors.foreground,
                      fontWeight: selectedFaith === faith ? "700" : "400",
                    },
                  ]}
                >
                  {faith}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 고민 분야 (최대 2개) */}
        <View style={styles.section}>
          <View style={styles.labelRow}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
              요즘 고민 분야
            </Text>
            <Text style={[styles.optionalBadge, { color: colors.muted }]}>
              최대 2개 · 선택
            </Text>
          </View>
          <View style={styles.chipGrid}>
            {CONCERN_OPTIONS.map((concern) => {
              const selected = selectedConcerns.includes(concern);
              return (
                <TouchableOpacity
                  key={concern}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected
                        ? accentColor + "22"
                        : colors.surface,
                      borderColor: selected ? accentColor : colors.border,
                      borderWidth: selected ? 1.8 : 1.5,
                    },
                  ]}
                  onPress={() => toggleConcern(concern)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: selected ? accentColor : colors.muted,
                        fontWeight: selected ? "700" : "400",
                      },
                    ]}
                  >
                    {concern}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedConcerns.length > 0 && (
            <Text style={[styles.concernHint, { color: accentColor }]}>
              선택됨: {selectedConcerns.join(", ")}
            </Text>
          )}
        </View>

        {/* 다음 버튼 */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: isReady ? accentColor : colors.border,
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>카드 선택하기 →</Text>
        </TouchableOpacity>

        <Text style={[styles.privacyNote, { color: colors.muted }]}>
          입력하신 정보는 결과 해석에만 활용되며{"\n"}외부로 전송되지 않습니다.
        </Text>
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
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  section: {
    marginBottom: 28,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  optionalBadge: {
    fontSize: 12,
    fontWeight: "400",
  },
  nicknameInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 14,
  },
  faithRow: {
    flexDirection: "row",
    gap: 12,
  },
  faithChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  faithChipText: {
    fontSize: 15,
  },
  concernHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
  },
  nextButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  privacyNote: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 20,
  },
});
