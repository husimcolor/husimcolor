import { StyleSheet, Text, View } from "react-native";

import { ZhCnPilotShell, pilotStyles } from "@/components/zh-cn-pilot-shell";
import { ZH_CN_PERSONAL_PILOT_REPORT } from "@/shared/zh-cn-personal-pilot";

export default function ZhCnPilotRecoveryScreen() {
  const { complementColors, complementColorTerm, energyFlow, recoveryRoutine } = ZH_CN_PERSONAL_PILOT_REPORT;
  const routines = [
    ["推荐茶饮", recoveryRoutine.tea],
    ["推荐食物", recoveryRoutine.food],
    ["推荐呼吸", recoveryRoutine.breath],
    ["推荐活动", recoveryRoutine.movement],
    ["今天的小练习", recoveryRoutine.smallPractice],
  ];
  return (
    <ZhCnPilotShell eyebrow="代表 화면 3 / 3 · 恢复方向" title="给自己留出恢复的空间">
      <View style={pilotStyles.card}>
        <Text style={pilotStyles.sectionTitle}>此刻适合你的{complementColorTerm}</Text>
        <Text style={pilotStyles.sectionText}>{complementColorTerm}并不是要修正你，而是用来支持当前节奏、帮助放松容易过度用力部分的色彩参考。</Text>
        <View style={pilotStyles.chipRow}>
          {complementColors.map((color) => <View key={color.name} style={pilotStyles.chip}><Text style={pilotStyles.chipText}>{color.name} · {color.meaning}</Text></View>)}
        </View>
      </View>
      <View style={pilotStyles.card}>
        <Text style={pilotStyles.sectionTitle}>{energyFlow.title}</Text>
        <Text style={pilotStyles.sectionText}>{energyFlow.description}</Text>
        <View style={pilotStyles.divider} />
        <Text style={pilotStyles.label}>此刻可能需要的支持</Text>
        <Text style={pilotStyles.sectionText}>{energyFlow.recovery}</Text>
        <View style={pilotStyles.chipRow}>
          {energyFlow.balanceKeywords.map((keyword) => <View key={keyword} style={pilotStyles.chip}><Text style={pilotStyles.chipText}>{keyword}</Text></View>)}
        </View>
      </View>
      <View style={pilotStyles.card}>
        <Text style={pilotStyles.sectionTitle}>今天的专属恢复小练习</Text>
        {routines.map(([label, text]) => <View key={label} style={styles.routine}><Text style={pilotStyles.label}>{label}</Text><Text style={pilotStyles.sectionText}>{text}</Text></View>)}
        <View style={styles.message}><Text style={styles.messageText}>{recoveryRoutine.message}</Text></View>
      </View>
    </ZhCnPilotShell>
  );
}

const styles = StyleSheet.create({
  routine: { gap: 3, paddingBottom: 8, borderBottomColor: "#ECE3D8", borderBottomWidth: 1 },
  message: { backgroundColor: "#FFF7E8", borderRadius: 12, padding: 13, marginTop: 2 },
  messageText: { color: "#735B38", fontSize: 14, lineHeight: 22, fontWeight: "700" },
});
