import { StyleSheet, Text, View } from "react-native";

import { ZhCnPilotShell, pilotStyles } from "@/components/zh-cn-pilot-shell";
import { ZH_CN_PERSONAL_PILOT_REPORT } from "@/shared/zh-cn-personal-pilot";

export default function ZhCnPilotOverviewScreen() {
  const report = ZH_CN_PERSONAL_PILOT_REPORT;
  return (
    <ZhCnPilotShell eyebrow="个人深度分析 · 中文样本" title="从色彩与图形，温和地看看此刻的自己">
      <View style={styles.summaryCard}>
        <Text style={pilotStyles.label}>固定审核输入</Text>
        <Text style={styles.summaryText}>红色 · 蓝色 · 白色　/　红色三角形 · 蓝色菱形 · 白色方形</Text>
        <Text style={styles.summaryNote}>此页面只使用固定的虚拟人物样本，不读取本机存储或任何客户资料。</Text>
      </View>
      <View style={pilotStyles.card}>
        <Text style={pilotStyles.sectionTitle}>三种色彩形成的线索</Text>
        <Text style={pilotStyles.sectionText}>{report.stage1.integrationBridge}</Text>
        <View style={pilotStyles.divider} />
        <Text style={pilotStyles.label}>关系倾向</Text>
        <Text style={pilotStyles.sectionText}>{report.stage1.relationshipTendency}</Text>
      </View>
      <View style={pilotStyles.card}>
        <Text style={pilotStyles.sectionTitle}>本次中文化的审核重点</Text>
        <Text style={pilotStyles.sectionText}>保留韩国语原文的解读顺序与信息量，同时避免把心理倾向写成诊断或确定的结论。页面中的“主要心理特征”“辅助心理特征”“调和色”使用本次确认的术语。</Text>
      </View>
    </ZhCnPilotShell>
  );
}

const styles = StyleSheet.create({
  summaryCard: { backgroundColor: "#FFFDF9", borderColor: "#E4D8C9", borderWidth: 1, borderRadius: 18, padding: 18, gap: 8 },
  summaryText: { color: "#3C322B", fontSize: 15, lineHeight: 24, fontWeight: "800" },
  summaryNote: { color: "#7B6E62", fontSize: 12.5, lineHeight: 19 },
});
