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
  age: string;
  job: string;
  faith: string;
  concerns?: string[];
};

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

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();

  const [age, setAge] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedFaith, setSelectedFaith] = useState("");

  const handleNext = async () => {
    if (!age || !selectedJob || !selectedFaith) {
      Alert.alert("입력 확인", "나이, 직업, 신앙 여부를 모두 선택해 주세요.");
      return;
    }
    const profile: UserProfile = {
      age,
      job: selectedJob,
      faith: selectedFaith,
    };
    await AsyncStorage.setItem("userProfile", JSON.stringify(profile));
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            기본 정보 입력
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            더 정확한 컬러 에너지 흐름 분석을 위해{"\n"}간단한 정보를 입력해 주세요
          </Text>
        </View>

        {/* 나이 입력 */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            나이
          </Text>
          <TextInput
            style={[
              styles.ageInput,
              {
                backgroundColor: colors.surface,
                borderColor: age ? "#8BAF8B" : colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="나이를 입력하세요 (예: 35)"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={age}
            onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ""))}
            maxLength={3}
            returnKeyType="done"
          />
        </View>

        {/* 직업 선택 */}
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
                      selectedJob === job ? "#8BAF8B" : colors.surface,
                    borderColor:
                      selectedJob === job ? "#8BAF8B" : colors.border,
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

        {/* 신앙 여부 */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            신앙 여부
          </Text>
          <View style={styles.faithRow}>
            {FAITH_OPTIONS.map((faith) => (
              <TouchableOpacity
                key={faith}
                style={[
                  styles.faithChip,
                  {
                    backgroundColor:
                      selectedFaith === faith ? "#8BAF8B" : colors.surface,
                    borderColor:
                      selectedFaith === faith ? "#8BAF8B" : colors.border,
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

        {/* 다음 버튼 */}
        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor:
                age && selectedJob && selectedFaith ? "#8BAF8B" : colors.border,
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
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  ageInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
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
