import { StyleSheet, Text, View } from "react-native";

import { ZhCnPilotShell, pilotStyles } from "@/components/zh-cn-pilot-shell";
import { ZH_CN_PERSONAL_PILOT_REPORT } from "@/shared/zh-cn-personal-pilot";

export default function ZhCnPilotColorsScreen() {
  const { stage1 } = ZH_CN_PERSONAL_PILOT_REPORT;
  return (
    <ZhCnPilotShell eyebrow="代表 화면 1 / 3 · 色彩解读" title="三种色彩的细致解读">
      {stage1.colors.map((color) => (
        <View key={color.name} style={pilotStyles.card}>
          <View style={styles.titleRow}>
            <View style={[pilotStyles.colorDot, { backgroundColor: color.hex }]} />
            <View style={styles.titleCopy}>
              <Text style={pilotStyles.label}>{color.role}</Text>
              <Text style={styles.colorName}>{color.name}</Text>
            </View>
          </View>
          <View style={pilotStyles.chipRow}>
            {color.keywords.map((keyword) => <View key={keyword} style={pilotStyles.chip}><Text style={pilotStyles.chipText}>{keyword}</Text></View>)}
          </View>
          <Text style={pilotStyles.sectionText}>{color.description}</Text>
          <View style={pilotStyles.divider} />
          <Text style={pilotStyles.label}>优势</Text>
          <Text style={pilotStyles.sectionText}>{color.strengths.join(" · ")}</Text>
          <Text style={pilotStyles.label}>感到疲惫时</Text>
          <Text style={pilotStyles.sectionText}>{color.tiredStates.join(" · ")}</Text>
        </View>
      ))}
      <View style={pilotStyles.card}>
        <Text style={pilotStyles.sectionTitle}>三种色彩的整合解读</Text>
        <Text style={pilotStyles.label}>心理倾向</Text>
        <Text style={pilotStyles.sectionText}>{stage1.psychologyTendency}</Text>
        <Text style={pilotStyles.label}>性格倾向</Text>
        <Text style={pilotStyles.sectionText}>{stage1.personalityTendency}</Text>
      </View>
    </ZhCnPilotShell>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  titleCopy: { gap: 2 },
  colorName: { color: "#302821", fontSize: 21, lineHeight: 28, fontWeight: "900" },
});
