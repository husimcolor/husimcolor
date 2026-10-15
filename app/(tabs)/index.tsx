import { createElement, useEffect, useRef, useState } from 'react';
import { View, Pressable, Image, Animated, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Platform, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { LocalizedText as Text } from '@/components/localized-text';
import { useColorContext } from '@/lib/colorContext';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';
import { BusinessInfoFooter } from '@/components/business-info-footer';
import { isOpeningCampaignActive } from '@/shared/opening-campaign';
import { getSampleReportButtonLabel, type SampleReportProduct } from '@/shared/sample-reports';
import { startKakaoLogin } from '@/constants/oauth';
import { useAuth } from '@/hooks/use-auth';
import { LanguageSelector } from '@/components/language-selector';
import { useLocalization } from '@/lib/localization-context';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const auth = useAuth();
  const { locale } = useLocalization();
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
  const kakao = trpc.auth.kakaoStatus.useQuery();
  // 설정을 불러오는 동안에는 상품 안내를 열어 둔다. 서버가 결제 가능 여부를
  // 최종 판정하며, 운영에서 공개가 꺼진 경우에도 안내 화면은 확인할 수 있다.
  const paidAnalysisPublicEnabled = commerceTestMode.data?.paidAnalysisPublicEnabled ?? true;
  const tossCardReviewEnabled = commerceTestMode.data?.tossCardReviewEnabled ?? false;
  const tossLiveEnabled = commerceTestMode.data?.tossLiveEnabled === true;
  const tossPaymentEnabled = tossLiveEnabled || commerceTestMode.data?.tossTestEnabled === true;
  const openingCampaignActive = isOpeningCampaignActive();
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

  const handleMemberEntry = () => {
    if (auth.isAuthenticated) {
      router.push('/my-page' as any);
      return;
    }
    if (!kakao.data?.enabled) return;
    if (!startKakaoLogin('/my-page')) {
      Alert.alert('카카오 로그인 안내', '카카오 로그인은 현재 휴심컬러 웹앱에서 이용할 수 있습니다.');
    }
  };

  const handlePersonalDeepEntry = () => {
    // 공개 결제 runtime이 열려 있으면 심사용 review-only보다 persistent 결제
    // lifecycle을 우선한다. 라이브와 테스트 주문은 서버 provider에서 분리된다.
    if (paidAnalysisPublicEnabled && tossPaymentEnabled) {
      router.push(`/(tabs)/commerce-checkout?product=personal_deep${tossLiveEnabled ? '' : '&testLifecycle=toss-test-lifecycle'}` as any);
      return;
    }
    if (tossCardReviewEnabled) {
      router.push('/(tabs)/commerce-checkout?product=personal_deep&review=toss-card-review' as any);
      return;
    }
    if (tossPaymentEnabled) {
      router.push('/(tabs)/commerce-checkout?product=personal_deep' as any);
      return;
    }
    router.push('/(tabs)/premium-info' as any);
  };

  // 공개 샘플은 앱 내 열람 화면으로 이동한다. 결제·로그인·개인 결과에는 접근하지 않는다.
  const handleOpenSampleReport = (product: SampleReportProduct) => {
    router.push({ pathname: '/(tabs)/sample-report', params: { product, returnTo: 'home' } } as any);
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
        <View style={styles.languageSelectorWrap}>
          <LanguageSelector compact />
        </View>
        {/* 배경 장식 원 */}
        <View style={[styles.decorCircle1, { backgroundColor: colors.sage + '20' }]} />
        <View style={[styles.decorCircle2, { backgroundColor: colors.warmgold + '15' }]} />
        <View style={[styles.decorCircle3, { backgroundColor: colors.primary + '10' }]} />

        {/* 로고 영역 - 5번 탭 시 관리자 진입 */}
        <Animated.View style={[styles.logoSection, { opacity: logoAnim }]}>
          <TouchableOpacity
            onPress={handleLogoTap}
            activeOpacity={0.9}
            style={styles.logoContainer}
          >
            {Platform.OS === 'web'
              ? createElement('img', {
                  src: '/husimcolor-home-symbol.png',
                  alt: '휴심컬러 심볼',
                  style: {
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: 20,
                  },
                })
              : <Image
                  source={require('../../assets/images/icon.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                  accessibilityLabel="휴심컬러 심볼"
                />}

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
            지금의 나와 두 사람의 관계를 원하는 방식으로 천천히 살펴보세요.
          </Text>
          {openingCampaignActive && <View style={styles.openingCampaign}>
            <Text style={styles.openingCampaignTitle}>오픈 기념 20% 할인</Text>
            <Text style={styles.openingCampaignDeadline}>10월 30일까지</Text>
            <Text style={styles.openingCampaignText}>회원·비회원 동일 · 결제 시 자동 적용</Text>
            <Text style={styles.openingCampaignNote}>개인·부부/연인·부모/자녀 심화분석 대상 · 오프라인 코칭 제외</Text>
          </View>}
        </Animated.View>

        <Animated.View style={[styles.memberEntry, { opacity: fadeAnim }]}>
          {auth.loading ? <Text style={styles.memberLoadingText}>회원 상태를 확인하고 있습니다.</Text> : auth.isAuthenticated ? <>
            <Pressable onPress={handleMemberEntry} style={({ pressed }) => [styles.memberPrimaryButton, pressed && styles.memberButtonPressed]} accessibilityRole="button"><Text style={styles.memberPrimaryText}>마이페이지</Text></Pressable>
            <Pressable onPress={() => { void auth.logout(); }} style={({ pressed }) => [styles.memberSecondaryButton, pressed && styles.memberButtonPressed]} accessibilityRole="button"><Text style={styles.memberSecondaryText}>로그아웃</Text></Pressable>
          </> : <Pressable onPress={handleMemberEntry} disabled={!kakao.data?.enabled} style={({ pressed }) => [styles.memberKakaoButton, !kakao.data?.enabled && styles.memberButtonDisabled, pressed && kakao.data?.enabled && styles.memberButtonPressed]} accessibilityRole="button" accessibilityLabel="로그인 또는 회원가입 후 카카오로 시작하기"><Text style={styles.memberKakaoText}>{kakao.isLoading ? '로그인 준비 중…' : kakao.data?.enabled ? '로그인 · 회원가입 · 카카오로 시작하기' : '카카오 로그인 준비 중'}</Text></Pressable>}
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

          <View style={styles.serviceCardGroup}>
            <Pressable
              style={({ pressed }) => [
                styles.serviceCard,
                styles.individualServiceCard,
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              onPress={handlePersonalDeepEntry}
            >
                <View style={styles.serviceHeadingRow}>
                  <Text style={styles.serviceTitle}>🎨 컬러 + 심리카드 개인 심화분석</Text>
                  <View style={styles.servicePriceGroup}>
                    {openingCampaignActive ? <>
                      <Text style={styles.serviceRegularPrice}>정가 29,000원</Text>
                      <Text style={styles.serviceDiscountPrice}>→ 23,200원</Text>
                    </> : <Text style={styles.servicePrice}>29,000원</Text>}
                  </View>
                </View>
                <Text style={styles.serviceSummary}>컬러 3개와 심리카드 3장으로 나를 깊이 살펴봅니다.</Text>
                {openingCampaignActive ? <Text style={styles.serviceCampaignCaption}>20% 할인 결제금액 · 자동 적용</Text> : null}
              <Text style={styles.serviceCta}>나를 깊이 알아보기 →</Text>
              {paidAnalysisPublicEnabled && commerceTestMode.data?.tossTestEnabled && !tossLiveEnabled ? (
                <Text style={styles.openingCampaignNote}>현재 테스트 운영 중 · Toss 테스트키 사용 · 실제 청구 없음</Text>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => handleOpenSampleReport('personal_deep')}
              style={({ pressed }) => [styles.sampleReportButton, pressed && styles.sampleReportButtonPressed]}
              accessibilityRole="link"
              accessibilityLabel={getSampleReportButtonLabel('personal_deep')}
            >
              <Text style={styles.sampleReportButtonText}>{getSampleReportButtonLabel('personal_deep')}</Text>
            </Pressable>
          </View>

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
      <View style={styles.businessInfoWrap}>
        <BusinessInfoFooter />
      </View>
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
  languageSelectorWrap: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    marginBottom: 4,
    zIndex: 3,
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
  openingCampaign: { width: '100%', marginTop: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E4C978', backgroundColor: '#FFF7DA', padding: 14, gap: 4 },
  openingCampaignTitle: { color: '#75561B', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  openingCampaignDeadline: { color: '#5E4512', fontSize: 22, lineHeight: 28, fontWeight: '900', textAlign: 'center', letterSpacing: -0.3 },
  openingCampaignText: { color: '#8D6B25', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  openingCampaignNote: { color: '#806F50', fontSize: 11, lineHeight: 16, textAlign: 'center' },
  logoContainer: {
    width: 122,
    height: 122,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF9EE',
    borderWidth: 1,
    borderColor: '#F2E8D7',
    shadowColor: '#B9A98A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  logoImage: {
    width: 102,
    height: 102,
    borderRadius: 20,
  },
  textSection: {
    alignItems: 'center',
    gap: 8,
  },
  memberEntry: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  memberLoadingText: { color: '#7A7166', fontSize: 12, fontWeight: '700' },
  memberKakaoButton: { minHeight: 42, borderRadius: 12, backgroundColor: '#FEE500', paddingHorizontal: 16, justifyContent: 'center', borderWidth: 1, borderColor: '#E6D100' },
  memberKakaoText: { color: '#3B3422', fontSize: 13, fontWeight: '800' },
  memberPrimaryButton: { minHeight: 40, borderRadius: 11, backgroundColor: '#557A59', paddingHorizontal: 18, justifyContent: 'center' },
  memberPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  memberSecondaryButton: { minHeight: 40, borderRadius: 11, borderWidth: 1, borderColor: '#B8C9B4', backgroundColor: '#FFFFFF', paddingHorizontal: 15, justifyContent: 'center' },
  memberSecondaryText: { color: '#557A59', fontSize: 13, fontWeight: '800' },
  memberButtonDisabled: { backgroundColor: '#DEDAD0', borderColor: '#D2CDC2' },
  memberButtonPressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
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
  serviceCardGroup: {
    gap: 4,
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
  servicePriceGroup: { alignItems: 'flex-end', gap: 1 },
  serviceRegularPrice: { color: '#8B5D2E', fontSize: 11, fontWeight: '700', textDecorationLine: 'line-through' },
  serviceDiscountPrice: { color: '#7A5420', fontSize: 17, lineHeight: 22, fontWeight: '900' },
  serviceCampaignCaption: { color: '#8A6826', fontSize: 11, lineHeight: 16, fontWeight: '700' },
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
  sampleReportButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#9CB797',
    backgroundColor: '#EDF4E9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sampleReportButtonText: {
    color: '#3E6A3A',
    fontSize: 16,
    fontWeight: '800',
  },
  sampleReportButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
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
  businessInfoWrap: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
});
