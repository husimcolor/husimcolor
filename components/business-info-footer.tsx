import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BUSINESS_INFO } from '@/lib/business-info';

type BusinessInfoFooterProps = {
  compact?: boolean;
};

/** 공개 서비스 화면에서 사업자정보를 동일하게 안내하는 공통 푸터입니다. */
export function BusinessInfoFooter({ compact = false }: BusinessInfoFooterProps) {
  const router = useRouter();

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {!compact ? (
        <>
          <Text style={styles.title}>사업자정보</Text>
          <Text style={styles.line}>상호명: {BUSINESS_INFO.legalName}</Text>
          <Text style={styles.line}>대표자: {BUSINESS_INFO.representative}</Text>
          <Text style={styles.line}>사업자등록번호: {BUSINESS_INFO.registrationNumber}</Text>
          <Text style={styles.line}>사업장 주소: {BUSINESS_INFO.address}</Text>
          <Text style={styles.line}>고객문의: {BUSINESS_INFO.customerPhone}</Text>
        </>
      ) : null}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="사업자정보 상세 보기"
        onPress={() => router.push('/(tabs)/business-info' as any)}
        style={({ pressed }) => [styles.detailLink, pressed && styles.pressed]}
      >
        <Text style={styles.detailLinkText}>{compact ? '사업자정보 확인' : '사업자정보 상세 보기 →'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#DED7CA',
    paddingTop: 18,
    alignItems: 'center',
  },
  compactContainer: {
    marginTop: 16,
    paddingTop: 12,
  },
  title: {
    color: '#5B5149',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  line: {
    color: '#766C62',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
  },
  detailLink: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detailLinkText: {
    color: '#5C7958',
    fontSize: 11,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.65,
  },
});
