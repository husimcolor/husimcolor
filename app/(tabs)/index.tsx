import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, Animated, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColorContext } from '@/lib/colorContext';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { resetColors } = useColorContext();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  // 인앱브라우저 하단 safe area + 여유 padding
  const bottomPad = Math.max(insets.bottom, 20) + 24;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  // 로고 5번 탭 관리자 진입
  const [logoTapCount, setLogoTapCount] = useState(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLogoTap = () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    if (newCount >= 5) {
      setLogoTapCount(0);
      router.push('/admin' as any);
      return;
    }
    logoTapTimer.current = setTimeout(() => setLogoTapCount(0), 2000);
  };

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  // 방문자 수 집계 (기기별 고유 UUID, 하루 1회 기준)
  // 카카오/네이버 인앱브라우저 대응: sessionStorage + localStorage + AsyncStorage 삼중 저장
  const logVisitor = trpc.visitors.log.useMutation();
  const commerceTestMode = trpc.commerce.checkout.testMode.useQuery();
  const paidAnalysisPublicEnabled = commerceTestMode.data?.paidAnalysisPublicEnabled ?? false;
  useEffect(() => {
    const trackVisit = async () => {
      try {
        const DEVICE_ID_KEY = 'husim_device_id';
        const VISIT_DATE_KEY = 'husim_visit_date';

        // UUID v4 생성 헬퍼
        const genUuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });

        // 1단계: 웹 환경에서 sessionStorage → localStorage → AsyncStorage 순서로 deviceId 복원
        let deviceId: string | null = null;
        if (typeof window !== 'undefined') {
          // sessionStorage에서 먼저 확인 (인앱브라우저 세션 내 유지)
          try { deviceId = window.sessionStorage.getItem(DEVICE_ID_KEY); } catch (_) {}
          // localStorage에서 확인 (영구 저장)
          if (!deviceId) {
            try { deviceId = window.localStorage.getItem(DEVICE_ID_KEY); } catch (_) {}
          }
        }
        // AsyncStorage에서 확인 (네이티브 앱 환경)
        if (!deviceId) {
          deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
        }

        // 2단계: deviceId가 없으면 새로 생성하고 모든 저장소에 저장
        if (!deviceId) {
          deviceId = genUuid();
        }
        // 모든 저장소에 동기화 (인앱브라우저 재진입 시 복원 가능하도록)
        try { await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId); } catch (_) {}
        if (typeof window !== 'undefined') {
          try { window.localStorage.setItem(DEVICE_ID_KEY, deviceId); } catch (_) {}
          try { window.sessionStorage.setItem(DEVICE_ID_KEY, deviceId); } catch (_) {}
        }

        // 3단계: 하루 1회 방문 기록 (날짜 비교)
        const today = new Date().toDateString();
        let lastVisit: string | null = null;
        if (typeof window !== 'undefined') {
          try { lastVisit = window.localStorage.getItem(VISIT_DATE_KEY); } catch (_) {}
        }
        if (!lastVisit) {
          lastVisit = await AsyncStorage.getItem(VISIT_DATE_KEY);
        }
        if (lastVisit !== today) {
          try { await AsyncStorage.setItem(VISIT_DATE_KEY, today); } catch (_) {}
          if (typeof window !== 'undefined') {
            try { window.localStorage.setItem(VISIT_DATE_KEY, today); } catch (_) {}
          }
          logVisitor.mutate({ deviceId, visitType: 'home' });
        }
      } catch (_) {}
    };
    trackVisit();
  }, []);

  const handleStart = () => {
    resetColors();
    router.push({ pathname: '/(tabs)/select', params: { step: '0' } });
  };

  const handlePersonalDeepEntry = () => {
    if (!paidAnalysisPublicEnabled) return;
    if (commerceTestMode.data?.tossTestEnabled) {
      router.push('/(tabs)/commerce-checkout?product=personal_deep' as any);
      return;
    }
    router.push('/(tabs)/premium-info' as any);
  };

  return (
    <ScreenContainer
      containerClassName="bg-background"
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
      >
      <View style={styles.container}>
        {/* 배경 장식 원 */}
        <View style={[styles.decorCircle1, { backgroundColor: colors.sage + '20' }]} />
        <View style={[styles.decorCircle2, { backgroundColor: colors.warmgold + '15' }]} />
        <View style={[styles.decorCircle3, { backgroundColor: colors.primary + '10' }]} />

        {/* 로고 영역 - 5번 탭 시 관리자 진입 */}
        <Animated.View style={[styles.logoSection, { opacity: logoAnim }]}>
          <TouchableOpacity
            onPress={handleLogoTap}
            activeOpacity={0.9}
            style={[styles.logoContainer, { backgroundColor: colors.surface, shadowColor: colors.foreground }]}
          >
            <Image
              source={{ uri: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663646006927/mTvBGzpe4naoi2CdDkbujz/icon-fBSxKFHiCtYA4p9pczpHqG.png' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* 텍스트 영역 */}
        <Animated.View
          style={[
            styles.textSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={[styles.brandName, { color: '#3D2B1F' }]}>휴심컬러</Text>
          <Text style={[styles.slogan, { color: colors.primary }]}>색으로 읽는 나의 마음</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.description, { color: colors.muted }]}>
            지금의 나와 두 사람의 관계를{'\n'}
            원하는 방식으로 천천히 살펴보세요.
          </Text>
        </Animated.View>

        {/* 세 가지 서비스 진입 */}
        <Animated.View style={[styles.buttonSection, { opacity: fadeAnim }]}>
          <Pressable
            style={({ pressed }) => [
              styles.serviceCard,
              styles.freeServiceCard,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleStart}
          >
            <View style={styles.serviceHeadingRow}>
              <Text style={styles.primaryServiceTitle}>🌿 무료 컬러 체험</Text>
              <Text style={styles.primaryServicePrice}>무료</Text>
            </View>
            <Text style={styles.primaryServiceSummary}>3가지 컬러로 지금의 마음과 회복 방향을 살펴보세요.</Text>
            <View style={styles.primaryServiceCta}>
              <Text style={styles.primaryServiceCtaText}>무료로 체험하기 →</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.serviceCard,
              styles.individualServiceCard,
              !paidAnalysisPublicEnabled && styles.preparingServiceCard,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handlePersonalDeepEntry}
            disabled={!paidAnalysisPublicEnabled}
          >
            <View style={styles.serviceHeadingRow}>
              <Text style={styles.serviceTitle}>🎨 컬러 + 심리카드 개인 심화분석</Text>
              <Text style={styles.servicePrice}>29,000원</Text>
            </View>
            <Text style={styles.serviceSummary}>컬러 3개와 심리카드 3장으로 나를 깊이 살펴봅니다.</Text>
            <Text style={[styles.serviceCta, !paidAnalysisPublicEnabled && styles.preparingServiceCta]}>
              {paidAnalysisPublicEnabled ? '나를 깊이 알아보기 →' : '정식 오픈 준비중'}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.serviceCard,
              styles.relationshipServiceCard,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => router.push('/(tabs)/couple-start' as any)}
          >
            <View style={styles.serviceHeadingRow}>
              <Text style={styles.serviceTitle}>💞 관계 분석</Text>
              <Text style={styles.relationshipServiceTag}>3가지 관계 상품</Text>
            </View>
            <Text style={styles.serviceSummary}>부부·연인 · 부모·자녀 · 친구 관계를 선택할 수 있습니다.</Text>
            <Text style={styles.serviceCta}>두 사람의 관계 알아보기 →</Text>
          </Pressable>
         </Animated.View>
      </View>

      {/* 관리자 링크 - 하단 */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/admin' as any)}
        activeOpacity={0.5}
        style={styles.adminLink}
      >
        <Text style={[styles.adminLinkText, { color: colors.muted }]}>관리자</Text>
      </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    // 스크롤 콘테이너: 콘텐츠가 짧을 때도 코너에서 시작하도록
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 18,
  },
  decorCircle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -60,
    right: -80,
  },
  decorCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    bottom: 60,
    left: -60,
  },
  decorCircle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: height * 0.35,
    right: -40,
  },
  logoSection: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  textSection: {
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
  },
  slogan: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  divider: {
    width: 40,
    height: 1.5,
    borderRadius: 1,
    marginVertical: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonSection: {
    width: '100%',
    gap: 10,
  },
  serviceCard: {
    width: '100%',
    minHeight: 116,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'center',
    gap: 7,
  },
  freeServiceCard: {
    shadowColor: '#527A5C',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  individualServiceCard: {
    backgroundColor: '#F8F2E9',
    borderColor: '#D8C6AA',
    borderWidth: 1,
  },
  preparingServiceCard: {
    opacity: 0.72,
  },
  relationshipServiceCard: {
    backgroundColor: '#F2F5EF',
    borderColor: '#B8C9B4',
    borderWidth: 1,
  },
  serviceHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryServiceTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 25,
  },
  serviceTitle: {
    flex: 1,
    color: '#3D2B1F',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 23,
  },
  primaryServicePrice: {
    color: '#ECF5E9',
    fontSize: 14,
    fontWeight: '800',
  },
  servicePrice: {
    color: '#8B5D2E',
    fontSize: 14,
    fontWeight: '800',
  },
  relationshipServiceTag: {
    color: '#577351',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryServiceSummary: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 19,
  },
  serviceSummary: {
    color: '#6E6257',
    fontSize: 13,
    lineHeight: 19,
  },
  primaryServiceCta: {
    alignSelf: 'flex-start',
    marginTop: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  primaryServiceCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  serviceCta: {
    color: '#587050',
    fontSize: 13,
    fontWeight: '800',
  },
  preparingServiceCta: {
    color: '#8B5D2E',
  },
  adminLink: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  adminLinkText: {
    fontSize: 11,
    opacity: 0.45,
    letterSpacing: 0.3,
  },
});
