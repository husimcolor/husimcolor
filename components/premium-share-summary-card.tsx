import { StyleSheet, Text, View } from "react-native";

import type { PremiumShareCardData } from "@/lib/premium-share-card";

export function PremiumShareSummaryCard({ data }: { data: PremiumShareCardData }) {
  return (
    <View style={styles.card} collapsable={false}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoDots}>
            <View style={[styles.dot, { backgroundColor: '#8FA68E' }]} />
            <View style={[styles.dot, { backgroundColor: '#D3B8DD' }]} />
            <View style={[styles.dot, { backgroundColor: '#E7C28A' }]} />
          </View>
          <Text style={styles.brand}>HUSIM COLOR</Text>
        </View>
        <Text style={styles.title}>나의 컬러 심리 해석</Text>
        <Text style={styles.subtitle}>색과 도형이 보여준 오늘의 마음 흐름</Text>
      </View>

      <View style={styles.colorRow}>
        {data.colors.map((color, index) => (
          <View key={`${color.name}-${index}`} style={styles.colorChip}>
            <View style={[styles.colorDot, { backgroundColor: color.hex }]} />
            <Text style={styles.colorName} numberOfLines={1}>{color.name}</Text>
            <Text style={styles.shape} numberOfLines={1}>{color.shape}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        {data.cards.map((card) => (
          <View key={card.index} style={styles.cardRow}>
            <View style={styles.numberBadge}><Text style={styles.numberText}>{card.index}</Text></View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardLabel}>{card.label} <Text style={styles.cardMeta}>· {card.colorShape}</Text></Text>
              <Text style={styles.cardSummary}>{card.summary}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.section, styles.greenSection]}>
        <Text style={styles.sectionLabel}>지금 마음의 흐름</Text>
        <Text style={styles.highlightText}>{data.currentFlow}</Text>
      </View>

      <View style={[styles.section, styles.purpleSection]}>
        <Text style={styles.sectionLabel}>나의 역할 에너지</Text>
        <Text style={styles.roleTitle}>{data.role.title}</Text>
        <Text style={styles.roleDescription}>{data.role.description}</Text>
      </View>

      <View style={styles.energyBox}>
        <Text style={styles.energyLine}><Text style={styles.energyLabel}>현재 주요 오행</Text> {data.currentElements.join(' · ')}</Text>
        <Text style={styles.energyLine}><Text style={styles.energyLabel}>보완 에너지</Text> {data.complementaryElements.join(' · ')}</Text>
        <Text style={styles.energyLine}><Text style={styles.energyLabel}>보완 컬러</Text> {data.complementaryColors.join(' · ') || '현재 결과의 보완 컬러'}</Text>
      </View>

      <View style={styles.messageBox}>
        <Text style={styles.messageLabel}>오늘의 회복 메시지</Text>
        <Text style={styles.messageText}>{data.recoveryMessage}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerBrand}>휴심컬러</Text>
        <Text style={styles.footerUrl}>husimcolor.vercel.app</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 360, minHeight: 640, backgroundColor: '#FAF8F3', padding: 24, justifyContent: 'space-between' },
  header: { alignItems: 'center', marginBottom: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  logoDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  brand: { color: '#4E725B', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: '#3D3530', fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#7A6E63', fontSize: 10.5, marginTop: 4 },
  colorRow: { flexDirection: 'row', gap: 7, marginBottom: 12 },
  colorChip: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1D9CD', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  colorDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: '#CFC5B8', marginBottom: 4 },
  colorName: { color: '#403831', fontSize: 10.5, fontWeight: '700' },
  shape: { color: '#887A6D', fontSize: 9, marginTop: 1 },
  section: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E3DBD0', borderRadius: 12, padding: 11, marginBottom: 9 },
  cardRow: { flexDirection: 'row', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EEE8DF' },
  numberBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#E4EFE5', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numberText: { color: '#52735A', fontSize: 10, fontWeight: '800' },
  cardCopy: { flex: 1 },
  cardLabel: { color: '#4B4036', fontSize: 10.5, fontWeight: '800' },
  cardMeta: { color: '#8B7D70', fontSize: 9.5, fontWeight: '500' },
  cardSummary: { color: '#5C5148', fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  greenSection: { backgroundColor: '#F1F7F1', borderColor: '#CFE0D0' },
  purpleSection: { backgroundColor: '#F7F4FC', borderColor: '#DDD4EC' },
  sectionLabel: { color: '#52735A', fontSize: 10, fontWeight: '800', marginBottom: 4 },
  highlightText: { color: '#3E5444', fontSize: 11, lineHeight: 16, fontWeight: '600' },
  roleTitle: { color: '#58466D', fontSize: 12, fontWeight: '800', marginBottom: 3 },
  roleDescription: { color: '#5B5065', fontSize: 10.5, lineHeight: 15 },
  energyBox: { backgroundColor: '#FFF9EE', borderWidth: 1, borderColor: '#EADABC', borderRadius: 11, padding: 10, marginBottom: 9 },
  energyLine: { color: '#655848', fontSize: 10.5, lineHeight: 17 },
  energyLabel: { color: '#91733B', fontWeight: '800' },
  messageBox: { backgroundColor: '#EEF5F0', borderLeftWidth: 3, borderLeftColor: '#8FA68E', borderRadius: 8, padding: 11 },
  messageLabel: { color: '#52735A', fontSize: 10, fontWeight: '800', marginBottom: 3 },
  messageText: { color: '#405B49', fontSize: 11, lineHeight: 16, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 13 },
  footerBrand: { color: '#526E5A', fontSize: 10, fontWeight: '800' },
  footerUrl: { color: '#8A8076', fontSize: 9, marginTop: 2 },
});
