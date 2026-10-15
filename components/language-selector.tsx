import { Pressable, StyleSheet, Text, View } from "react-native";

import { useLocalization } from "@/lib/localization-context";
import type { AppLocale } from "@/shared/localization";

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocalization();

  const select = (next: AppLocale) => {
    if (next !== locale) void setLocale(next);
  };

  return (
    <View style={[styles.wrap, compact && styles.compactWrap]} accessibilityRole="radiogroup" accessibilityLabel={t("language")}>
      {!compact && <Text style={styles.label}>{t("language")}</Text>}
      <View style={styles.options}>
        <Option active={locale === "ko"} label={t("korean")} onPress={() => select("ko")} />
        <Option active={locale === "zh-CN"} label={t("simplifiedChinese")} onPress={() => select("zh-CN")} />
      </View>
      {!compact && <Text style={styles.notice}>{t("languageNotice")}</Text>}
    </View>
  );
}

function Option({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.option, active && styles.activeOption, pressed && styles.pressed]}
    >
      <Text style={[styles.optionText, active && styles.activeOptionText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "flex-end", gap: 8 },
  compactWrap: { alignItems: "center" },
  label: { color: "#6B5D52", fontSize: 12, fontWeight: "700" },
  options: { flexDirection: "row", borderWidth: 1, borderColor: "#DDD8CE", borderRadius: 999, overflow: "hidden" },
  option: { minHeight: 32, justifyContent: "center", paddingHorizontal: 11, backgroundColor: "#FCFAF6" },
  activeOption: { backgroundColor: "#556F54" },
  optionText: { color: "#6B5D52", fontSize: 12, fontWeight: "700" },
  activeOptionText: { color: "#FFFFFF" },
  pressed: { opacity: 0.78 },
  notice: { maxWidth: 260, color: "#87796D", fontSize: 10.5, lineHeight: 15, textAlign: "right" },
});
