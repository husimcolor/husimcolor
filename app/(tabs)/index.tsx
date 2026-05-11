import { useEffect, useRef } from 'react';
import { View, Text, Pressable, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColorContext } from '@/lib/colorContext';
import { useColors } from '@/hooks/use-colors';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { resetColors } = useColorContext();
  const colors = useColors();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

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

  const handleStart = () => {
    resetColors();
    router.push({ pathname: '/(tabs)/select', params: { step: '0' } });
  };

  return (
    <ScreenContainer
      containerClassName="bg-background"
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.container}>
        {/* 배경 장식 원 */}
        <View style={[styles.decorCircle1, { backgroundColor: colors.sage + '20' }]} />
        <View style={[styles.decorCircle2, { backgroundColor: colors.warmgold + '15' }]} />
        <View style={[styles.decorCircle3, { backgroundColor: colors.primary + '10' }]} />

        {/* 로고 영역 */}
        <Animated.View style={[styles.logoSection, { opacity: logoAnim }]}>
          <View style={[styles.logoContainer, { backgroundColor: colors.surface, shadowColor: colors.foreground }]}>
            <Image
              source={{ uri: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663646006927/mTvBGzpe4naoi2CdDkbujz/icon-fBSxKFHiCtYA4p9pczpHqG.png' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
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
          <Text style={[styles.brandName, { color: colors.foreground }]}>휴심컬러</Text>
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
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleStart}
          >
            <Text style={styles.startButtonText}>컬러 선택 시작하기</Text>
          </Pressable>
          <Text style={[styles.hint, { color: colors.muted }]}>
            직관적으로 끌리는 색을 선택해 주세요
          </Text>
        </Animated.View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
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
});
