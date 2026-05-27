import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, Animated, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColorContext } from '@/lib/colorContext';
import { useAdmin } from '@/lib/adminContext';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc } from '@/lib/trpc';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { resetColors } = useColorContext();
  useAdmin(); // 관리자 컨텍스트 유지 (admin 탭에서 사용)
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
            25가지 컬러 중 마음이 끌리는 3가지를 선택하세요.{'\n'}
            당신의 현재 심리와 회복 방향을{'\n'}
            감성적으로 안내해 드립니다.
          </Text>
        </Animated.View>

        {/* 카드 미리보기 */}
        <Animated.View style={[styles.cardPreview, { opacity: fadeAnim }]}>
          {[
            { label: '1번 카드', desc: '무의식 / 내면 흐름', color: '#5B8DB8' },
            { label: '2번 카드', desc: '현재 상태 / 심리 흐름', color: '#E05A4E' },
            { label: '3번 카드', desc: '회복 방향 / 필요한 에너지', color: '#8FA68E' },
          ].map((card, i) => (
            <View
              key={i}
              style={[
                styles.miniCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.miniCardDot, { backgroundColor: card.color }]} />
              <View style={styles.miniCardText}>
                <Text style={[styles.miniCardLabel, { color: colors.foreground }]}>{card.label}</Text>
                <Text style={[styles.miniCardDesc, { color: colors.muted }]}>{card.desc}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* 시작 버튼 */}
        <Animated.View style={[styles.buttonSection, { opacity: fadeAnim }]}>
          {/* 무료 버전 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleStart}
          >
            <Text style={styles.startButtonText}>무료 체험 · 컬러 선택 시작하기</Text>
          </Pressable>
          <Text style={[styles.hint, { color: colors.muted }]}>
            직관적으로 끌리는 색을 선택해 주세요
          </Text>
          {/* 커플 세션 버튼 - 일반 사용자 무료 테스트 오픈 (컬러+도형 위로 이동, 시각적 강조) */}
          <TouchableOpacity
            style={[styles.coupleButtonWrapper]}
            onPress={() => router.push('/(tabs)/couple-start' as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.coupleButton, styles.coupleButtonActive]}>
              <View style={styles.coupleButtonInner}>
                <View style={[styles.comingBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={[styles.comingBadgeText, { color: '#FFFFFF' }]}>무료 테스트</Text>
                </View>
                <Text style={[styles.coupleButtonText, { color: '#FFFFFF' }]}>💑 커플 세션</Text>
              </View>
              <Text style={[styles.coupleButtonSub, { color: 'rgba(255,255,255,0.85)' }]}>서로를 이해하는 감성 심리코칭 · 지금 무료로 체험하세요</Text>
            </View>
          </TouchableOpacity>

          {/* 컬러+도형 심층 해석 버튼 */}
          <Pressable
            style={({ pressed }) => [
              styles.premiumButton,
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={() => router.push('/payment' as any)}
          >
            <View style={styles.premiumButtonInner}>
              <Text style={styles.premiumButtonBadge}>NEW</Text>
              <Text style={styles.premiumButtonText}>🎨 컬러+도형 심층 해석</Text>
            </View>
            <Text style={styles.premiumButtonSub}>63장 카드 · 초기 오픈 무료체험중 · 정식 오픈 후 유료 전환 예정</Text>
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
    gap: 20,
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
  cardPreview: {
    width: '100%',
    gap: 8,
  },
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  miniCardDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  miniCardText: {
    flex: 1,
    gap: 2,
  },
  miniCardLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  miniCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  startButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 12,
  },
  premiumButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#F5F0E8',
    borderWidth: 1.5,
    borderColor: '#C4956A55',
    alignItems: 'center',
    gap: 4,
  },
  premiumButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumButtonBadge: {
    backgroundColor: '#C4956A',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  premiumButtonText: {
    color: '#7A5A3A',
    fontSize: 15,
    fontWeight: '700',
  },
  premiumButtonSub: {
    color: '#A08060',
    fontSize: 12,
  },
  coupleButtonWrapper: {
    width: '100%',
    marginTop: 4,
  },
  coupleButton: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 4,
    opacity: 0.7,
  },
  coupleButtonActive: {
    borderColor: '#6B8F6A',
    backgroundColor: '#7A9E79',
    borderStyle: 'solid',
    opacity: 1,
  },
  coupleButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  comingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  coupleButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  coupleButtonSub: {
    fontSize: 11,
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
