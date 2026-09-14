import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { BUSINESS_INFO } from '@/lib/business-info';

export default function BusinessInfoScreen() {
  const router = useRouter();

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="이전 화면으로 돌아가기"
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>사업자정보</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.card}>
          <Text style={styles.brand}>휴심컬러</Text>
          <Text style={styles.description}>서비스 이용 전 사업자정보와 고객문의 연락처를 확인하실 수 있습니다.</Text>

          <InfoRow label="상호명" value={BUSINESS_INFO.legalName} />
          <InfoRow label="대표자" value={BUSINESS_INFO.representative} />
          <InfoRow label="사업자등록번호" value={BUSINESS_INFO.registrationNumber} />
          <InfoRow label="사업장 주소" value={BUSINESS_INFO.address} />
          <InfoRow label="고객문의" value={BUSINESS_INFO.customerPhone} isLast />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2EFE7',
  },
  backButtonText: {
    color: '#5A5047',
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    color: '#332A24',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 38,
  },
  card: {
    borderWidth: 1,
    borderColor: '#DED7CA',
    borderRadius: 18,
    backgroundColor: '#FBF9F4',
    padding: 20,
  },
  brand: {
    color: '#42633F',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  description: {
    color: '#75695E',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
  },
  infoRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E1D6',
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  label: {
    color: '#7B7066',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 5,
  },
  value: {
    color: '#332A24',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
});
