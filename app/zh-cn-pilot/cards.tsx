import { StyleSheet, Text, View } from "react-native";

import { ZhCnPilotShell, pilotStyles } from "@/components/zh-cn-pilot-shell";
import { ZH_CN_PERSONAL_PILOT_REPORT } from "@/shared/zh-cn-personal-pilot";

export default function ZhCnPilotCardsScreen() {
  const { cards, stage2Bridge } = ZH_CN_PERSONAL_PILOT_REPORT;
  return (
    <ZhCnPilotShell eyebrow="代表 화면 2 / 3 · 心理卡" title="三张心理卡的流动">
      <View style={pilotStyles.card}>
        <Text style={pilotStyles.sectionTitle}>从内在愿望到恢复方向</Text>
        <Text style={pilotStyles.sectionText}>{stage2Bridge}</Text>
      </View>
      {cards.map((card) => (
        <View key={card.position} style={pilotStyles.card}>
          <View style={styles.header}>
            <View style={[styles.cardVisual, { backgroundColor: card.colorHex }]}><Text style={[styles.shapeText, card.colorName === "白色" && styles.darkShape]}>{card.shapeName}</Text></View>
            <View style={styles.headerCopy}>
              <Text style={pilotStyles.label}>{card.position}</Text>
              <Text style={styles.cardName}>{card.label}</Text>
            </View>
          </View>
          <Text style={pilotStyles.label}>色彩关键词</Text>
          <Text style={pilotStyles.sectionText}>{card.colorKeywords}</Text>
          <Text style={pilotStyles.label}>图形关键词</Text>
          <Text style={pilotStyles.sectionText}>{card.shapeKeywords}</Text>
          <View style={pilotStyles.divider} />
          <Text style={pilotStyles.label}>{card.roleLabel}</Text>
          <Text style={pilotStyles.sectionText}>{card.narrative}</Text>
        </View>
      ))}
    </ZhCnPilotShell>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 11 },
  cardVisual: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", borderColor: "#D8CABA", borderWidth: 1 },
  shapeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  darkShape: { color: "#4B4036" },
  headerCopy: { flex: 1, gap: 2 },
  cardName: { color: "#302821", fontSize: 18, lineHeight: 25, fontWeight: "900" },
});
