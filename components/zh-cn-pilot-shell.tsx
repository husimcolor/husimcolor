import { Link, usePathname } from "expo-router";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";

const NAV_ITEMS = [
  { href: "/zh-cn-pilot", label: "概览" },
  { href: "/zh-cn-pilot/colors", label: "色彩解读" },
  { href: "/zh-cn-pilot/cards", label: "心理卡" },
  { href: "/zh-cn-pilot/recovery", label: "恢复方向" },
] as const;

export function ZhCnPilotShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const openPdf = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open("/api/zh-cn-pilot-personal-pdf", "_blank", "noopener,noreferrer");
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>简体中文翻译审核样本</Text>
            <Text style={styles.noticeText}>固定虚拟数据 · 仅供审核 · 不连接登录、付款、优惠券、数据库或自动邮件</Text>
          </View>
          <View style={styles.hero}>
            <Text style={styles.brand}>休心色彩</Text>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.nav}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href as never} asChild>
                  <Pressable style={[styles.navItem, active && styles.navItemActive]} accessibilityRole="link">
                    <Text style={[styles.navText, active && styles.navTextActive]}>{item.label}</Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
          {children}
          <View style={styles.pdfBox}>
            <Text style={styles.pdfTitle}>个人深度分析完整 PDF 样本</Text>
            <Text style={styles.pdfText}>与此页面使用相同的固定中文文案。PDF 为公开虚拟样本，不会生成或发送客户文件。</Text>
            <Pressable onPress={openPdf} style={({ pressed }) => [styles.pdfButton, pressed && styles.pressed]} accessibilityRole="link">
              <Text style={styles.pdfButtonText}>打开中文 PDF 样本</Text>
            </Pressable>
          </View>
          <Text style={styles.footer}>本报告以当前选择为线索，提供自我理解与日常身心照顾的参考；它不构成医疗诊断或治疗建议。</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

export const pilotStyles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDD2C4", borderRadius: 18, padding: 18, gap: 10 },
  sectionTitle: { color: "#2F4934", fontSize: 19, lineHeight: 27, fontWeight: "800" },
  sectionText: { color: "#5F554D", fontSize: 14, lineHeight: 23 },
  label: { color: "#806143", fontSize: 12, lineHeight: 18, fontWeight: "800" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { backgroundColor: "#EAF3E9", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { color: "#376849", fontSize: 12, lineHeight: 17, fontWeight: "700" },
  colorDot: { width: 16, height: 16, borderRadius: 8, borderColor: "#B9AA99", borderWidth: 1 },
  divider: { height: 1, backgroundColor: "#ECE3D8", width: "100%" },
});

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, backgroundColor: "#F8F3EA", paddingBottom: 36 },
  container: { width: "100%", maxWidth: 700, alignSelf: "center", paddingHorizontal: 18, paddingTop: 18, gap: 16 },
  notice: { backgroundColor: "#FFF3D7", borderColor: "#E8C879", borderWidth: 1, borderRadius: 14, padding: 13, gap: 4 },
  noticeTitle: { color: "#745218", fontSize: 13, fontWeight: "800" },
  noticeText: { color: "#806F50", fontSize: 12, lineHeight: 18 },
  hero: { backgroundColor: "#F1F5ED", borderRadius: 20, padding: 20, gap: 6, borderWidth: 1, borderColor: "#CCD9C8" },
  brand: { color: "#325C40", fontSize: 17, fontWeight: "900", letterSpacing: 1 },
  eyebrow: { color: "#7D6550", fontSize: 12, fontWeight: "800", letterSpacing: 0.4 },
  title: { color: "#302821", fontSize: 26, lineHeight: 36, fontWeight: "900" },
  nav: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  navItem: { minHeight: 37, paddingHorizontal: 12, justifyContent: "center", borderRadius: 99, backgroundColor: "#FFFFFF", borderColor: "#DED2C4", borderWidth: 1 },
  navItemActive: { backgroundColor: "#496E50", borderColor: "#496E50" },
  navText: { color: "#685C51", fontSize: 12, fontWeight: "800" },
  navTextActive: { color: "#FFFFFF" },
  pdfBox: { backgroundColor: "#F2F5EF", borderColor: "#B8C9B4", borderWidth: 1, borderRadius: 18, padding: 18, gap: 8 },
  pdfTitle: { color: "#365C3E", fontSize: 16, fontWeight: "900" },
  pdfText: { color: "#5D6C58", fontSize: 13, lineHeight: 20 },
  pdfButton: { alignSelf: "flex-start", backgroundColor: "#496E50", minHeight: 42, justifyContent: "center", paddingHorizontal: 15, borderRadius: 10, marginTop: 3 },
  pdfButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  footer: { color: "#8A7E71", fontSize: 11.5, lineHeight: 18, paddingHorizontal: 4 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
