import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColorContext } from '@/lib/colorContext';
import { useColors } from '@/hooks/use-colors';
import { generateInterpretation } from '@/constants/colorData';

const SOCIAL_LINKS = {
  naver: 'https://naver.me/ID3fxw2W',
  youtube: 'https://youtube.com/@huali7603?si=C82e7o_sUCPaEVWT',
  instagram: 'https://www.instagram.com/husim_lumiere?igsh=MTh6bWhpdWRjb2Rtcw==',
};

export default function ResultScreen() {
  const router = useRouter();
  const { selectedColors, resetColors } = useColorContext();
  const colors = useColors();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const card1 = selectedColors[0];
  const card2 = selectedColors[1];
  const card3 = selectedColors[2];

  useEffect(() => {
    if (!card1 || !card2 || !card3) {
      router.replace('/(tabs)');
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!card1 || !card2 || !card3) return null;

  const interpretation = generateInterpretation(card1, card2, card3);

  const handleRestart = () => {
    resetColors();
    router.replace('/(tabs)');
  };

  const openLink = async (url: string, name: string) => {
    try {
      if (Platform.OS === 'web') {
        // 웹 환경: window.open으로 새 탭에서 열기
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) {
          // 팝업 차단 시 Linking 폴백
          await Linking.openURL(url);
        }
      } else {
        // 모바일(iOS/Android): 인앱 브라우저로 열기
        await WebBrowser.openBrowserAsync(url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });
      }
    } catch {
      // 폴백: Linking.openURL로 시도
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert('알림', `${name} 링크를 열 수 없습니다.\n직접 접속해 주세요.`);
      }
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          onPress={() => router.push({ pathname: '/(tabs)/select', params: { step: '2' } })}
        >
          <Text style={[styles.backButtonText, { color: colors.muted }]}>← 다시 선택</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>나의 컬러 해석</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 선택한 컬러 카드 3개 */}
        <Animated.View
          style={[styles.colorCardsSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>오늘 선택한 컬러</Text>
          <View style={styles.colorCards}>
            {[
              { card: card1, label: '1번 카드', desc: '무의식 / 내면 흐름' },
              { card: card2, label: '2번 카드', desc: '현재 상태' },
              { card: card3, label: '3번 카드', desc: '회복 방향' },
            ].map(({ card, label, desc }, i) => (
              <View
                key={i}
                style={[
                  styles.colorCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.colorCardCircle,
                    {
                      backgroundColor: card.hex,
                      shadowColor: card.hex,
                      shadowOpacity: 0.4,
                      shadowOffset: { width: 0, height: 3 },
                      shadowRadius: 8,
                      elevation: 4,
                      overflow: 'hidden',
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      (card.highlightColor ?? 'rgba(255,255,255,0.25)') as string,
                      'transparent' as string,
                      'rgba(0,0,0,0.08)' as string,
                    ]}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0.3, y: 0 }}
                    end={{ x: 0.7, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </View>
                <Text style={[styles.colorCardLabel, { color: colors.muted }]}>{label}</Text>
                <Text style={[styles.colorCardName, { color: colors.foreground }]}>{card.korName}</Text>
                <Text style={[styles.colorCardDesc, { color: colors.muted }]}>{desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* 해석 결과 섹션들 */}
        <Animated.View style={[styles.resultSections, { opacity: fadeAnim }]}>

          {/* 현재 심리 흐름 */}
          <ResultCard
            icon="🌊"
            title="현재 심리 흐름"
            content={interpretation.psychologyFlow}
            bgColor={colors.surface}
            borderColor={colors.border}
            titleColor={colors.foreground}
            contentColor={colors.muted}
          />

          {/* 성격 흐름 */}
          <ResultCard
            icon="🌿"
            title="성격 흐름"
            content={interpretation.personalityFlow}
            bgColor={colors.surface}
            borderColor={colors.border}
            titleColor={colors.foreground}
            contentColor={colors.muted}
          />

          {/* 장점 & 감정 패턴 나란히 */}
          <View style={styles.twoColumnSection}>
            <View
              style={[
                styles.halfCard,
                { backgroundColor: '#F0F7F0', borderColor: '#C8DFC8' },
              ]}
            >
              <Text style={styles.halfCardIcon}>✨</Text>
              <Text style={[styles.halfCardTitle, { color: '#4A7A4A' }]}>장점</Text>
              {interpretation.strengths.map((s, i) => (
                <View key={i} style={styles.tagRow}>
                  <View style={[styles.tag, { backgroundColor: '#C8DFC8' }]}>
                    <Text style={[styles.tagText, { color: '#3A6A3A' }]}>{s}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View
              style={[
                styles.halfCard,
                { backgroundColor: '#FBF5EE', borderColor: '#E8D8C0' },
              ]}
            >
              <Text style={styles.halfCardIcon}>💛</Text>
              <Text style={[styles.halfCardTitle, { color: '#8A6A3A' }]}>감정 패턴</Text>
              {interpretation.shadows.map((s, i) => (
                <View key={i} style={styles.tagRow}>
                  <View style={[styles.tag, { backgroundColor: '#E8D8C0' }]}>
                    <Text style={[styles.tagText, { color: '#7A5A2A' }]}>{s}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 보완 컬러 */}
          <View
            style={[
              styles.complementCard,
              { backgroundColor: '#F8F5EE', borderColor: '#E0D8C8' },
            ]}
          >
            <View style={styles.complementHeader}>
              <Text style={styles.complementIcon}>🎨</Text>
              <Text style={[styles.complementTitle, { color: '#2A2A2A' }]}>보완 컬러</Text>
            </View>
            <Text style={[styles.complementDesc, { color: colors.muted }]}>
              지금 당신에게 필요한 에너지의 색
            </Text>
            <View style={styles.complementTags}>
              {interpretation.complementColors.map((c, i) => (
                <View
                  key={i}
                  style={[styles.complementTag, { backgroundColor: '#4A7A5A', borderColor: '#2E5C3E' }]}
                >
                  <Text style={[styles.complementTagText, { color: '#FFFFFF' }]}>{c}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 회복 방향 - 3번 카드 고유 회복 에너지 설명 */}
          <View
            style={[
              styles.recoveryCard,
              { backgroundColor: '#EFF7F0', borderColor: '#B8D8C0' },
            ]}
          >
            <View style={styles.recoveryHeader}>
              <Text style={styles.recoveryIcon}>🌱</Text>
              <Text style={[styles.recoveryTitle, { color: '#2A6A3A' }]}>회복 방향</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              <View style={[styles.recoveryBadge, { backgroundColor: '#B8D8C0', borderColor: '#8ABF9A' }]}>
                <Text style={[styles.recoveryBadgeText, { color: '#1A5A2A' }]}>{card3.korName} 에너지</Text>
              </View>
              <View style={[styles.recoveryBadge, { backgroundColor: '#D8EED8', borderColor: '#A8CEB0' }]}>
                <Text style={[styles.recoveryBadgeText, { color: '#1A5A2A' }]}>{card3.recovery}</Text>
              </View>
            </View>
            <Text style={[styles.recoveryDetail, { color: '#2A5A3A', lineHeight: 24 }]}>
              {interpretation.recoveryFlow}
            </Text>
          </View>

          {/* 오늘의 코칭 메시지 - 짧고 따뜻한 한 마디 */}
          <View
            style={[
              styles.coachingCard,
              { backgroundColor: '#FBF5EE', borderColor: '#E8D8C0' },
            ]}
          >
            <View style={styles.coachingHeader}>
              <Text style={styles.coachingIcon}>💌</Text>
              <Text style={[styles.coachingTitle, { color: '#8A6A3A' }]}>오늘의 코칭 메시지</Text>
            </View>
            <View style={[styles.coachingDivider, { backgroundColor: '#E8D8C0' }]} />
            <Text style={[styles.coachingMessage, { color: '#4A3010', lineHeight: 30, textAlign: 'center' }]}>
              {interpretation.coachingMessage}
            </Text>
          </View>

        </Animated.View>

        {/* 소셜 링크 섹션 */}
        <Animated.View style={[styles.socialSection, { opacity: fadeAnim }]}>
          <View style={[styles.socialDivider, { backgroundColor: colors.border }]} />

          {/* 브랜드 문구 */}
          <View style={styles.brandMessageBox}>
            <Text style={[styles.socialTitle, { color: colors.foreground }]}>
              지금의 마음 흐름을{'\n'}더 깊이 이해하고 싶다면
            </Text>
            <Text style={[styles.socialSubtitle, { color: colors.muted }]}>
              휴심컬러와 함께하는 1:1 컬러코칭을 만나보세요
            </Text>
          </View>

          <View style={styles.socialButtons}>
            {/* 네이버 예약 */}
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                { backgroundColor: '#03C75A', shadowColor: '#03C75A' },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => openLink(SOCIAL_LINKS.naver, '네이버 예약')}
            >
              <View style={styles.socialButtonContent}>
                <View style={[styles.socialIconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.socialIconText}>N</Text>
                </View>
                <View style={styles.socialTextGroup}>
                  <Text style={styles.socialButtonTitle}>네이버 예약</Text>
                  <Text style={styles.socialButtonDesc}>1:1 컬러코칭 예약하기</Text>
                </View>
                <Text style={styles.socialArrow}>→</Text>
              </View>
            </Pressable>

            {/* 유튜브 묵상채널 */}
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                { backgroundColor: '#FF0000', shadowColor: '#FF0000' },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => openLink(SOCIAL_LINKS.youtube, '유튜브 묵상채널')}
            >
              <View style={styles.socialButtonContent}>
                <View style={[styles.socialIconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.socialIconText}>▶</Text>
                </View>
                <View style={styles.socialTextGroup}>
                  <Text style={styles.socialButtonTitle}>유튜브 묵상채널</Text>
                  <Text style={styles.socialButtonDesc}>마음을 쉬게 하는 묵상 영상</Text>
                </View>
                <Text style={styles.socialArrow}>→</Text>
              </View>
            </Pressable>

            {/* 인스타그램 */}
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                {
                  backgroundColor: '#E1306C',
                  shadowColor: '#E1306C',
                },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => openLink(SOCIAL_LINKS.instagram, '인스타그램')}
            >
              <View style={styles.socialButtonContent}>
                <View style={[styles.socialIconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.socialIconText}>📷</Text>
                </View>
                <View style={styles.socialTextGroup}>
                  <Text style={styles.socialButtonTitle}>인스타그램</Text>
                  <Text style={styles.socialButtonDesc}>휴심컬러 감성 코칭 팔로우</Text>
                </View>
                <Text style={styles.socialArrow}>→</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* 다시 시작 버튼 */}
        <Animated.View style={[styles.restartSection, { opacity: fadeAnim }]}>
          <Pressable
            style={({ pressed }) => [
              styles.restartButton,
              { borderColor: colors.border, backgroundColor: colors.surface },
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleRestart}
          >
            <Text style={[styles.restartButtonText, { color: colors.muted }]}>
              ↺  처음부터 다시 시작하기
            </Text>
          </Pressable>
          <Text style={[styles.footer, { color: colors.muted }]}>
            휴심컬러 · 색으로 읽는 나의 마음
          </Text>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function ResultCard({
  icon,
  title,
  content,
  bgColor,
  borderColor,
  titleColor,
  contentColor,
}: {
  icon: string;
  title: string;
  content: string;
  bgColor: string;
  borderColor: string;
  titleColor: string;
  contentColor: string;
}) {
  return (
    <View style={[styles.resultCard, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.resultCardHeader}>
        <Text style={styles.resultCardIcon}>{icon}</Text>
        <Text style={[styles.resultCardTitle, { color: titleColor }]}>{title}</Text>
      </View>
      <Text style={[styles.resultCardContent, { color: contentColor }]}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
    minWidth: 80,
  },
  backButtonText: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  colorCardsSection: {
    marginBottom: 20,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  colorCards: {
    flexDirection: 'row',
    gap: 10,
  },
  colorCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  colorCardCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  colorCardLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  colorCardName: {
    fontSize: 13,
    fontWeight: '700',
  },
  colorCardDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  resultSections: {
    gap: 12,
  },
  resultCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultCardIcon: {
    fontSize: 18,
  },
  resultCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  resultCardContent: {
    fontSize: 14,
    lineHeight: 24,
  },
  twoColumnSection: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  halfCardIcon: {
    fontSize: 18,
  },
  halfCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  complementCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  complementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  complementIcon: {
    fontSize: 18,
  },
  complementTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  complementDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  complementTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  complementTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  complementTagText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  coachingCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  coachingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coachingIcon: {
    fontSize: 20,
  },
  coachingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  coachingDivider: {
    height: 1,
    borderRadius: 1,
  },
  coachingMessage: {
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 4,
  },
  recoveryCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recoveryIcon: {
    fontSize: 18,
  },
  recoveryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  recoveryContent: {
    fontSize: 15,
    fontWeight: '600',
  },
  recoveryDetail: {
    fontSize: 14,
    lineHeight: 22,
  },
  recoveryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  recoveryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  socialSection: {
    marginTop: 24,
    gap: 14,
  },
  socialDivider: {
    height: 1,
    borderRadius: 1,
    marginBottom: 4,
  },
  brandMessageBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  socialTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  socialSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  socialButtons: {
    gap: 10,
  },
  socialButton: {
    borderRadius: 14,
    padding: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  socialTextGroup: {
    flex: 1,
    gap: 2,
  },
  socialButtonTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  socialButtonDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
  socialArrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '300',
  },
  restartSection: {
    marginTop: 24,
    alignItems: 'center',
    gap: 16,
  },
  restartButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  restartButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
