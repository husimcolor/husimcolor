import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColorContext } from '@/lib/colorContext';
import { useColors } from '@/hooks/use-colors';
import { COLOR_DATA, ColorData } from '@/constants/colorData';

const { width } = Dimensions.get('window');

// 밝은 컬러(크림, 화이트 등) 자동 테두리 색상 처리
function getLightBorderColor(hex: string, isSelected: boolean, foregroundColor: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (isSelected) return foregroundColor;
  if (brightness >= 200) return '#C8BFB0'; // 밝은 컬러는 웸 테두리
  return 'rgba(255,255,255,0.45)'; // 어두운 컬러는 기존 흰 테두리
}
const CIRCLE_SIZE = (width - 48 - 40) / 5;

const CARD_INFO = [
  {
    step: 0,
    number: '1',
    title: '무의식 / 내면 흐름',
    subtitle: '마음 깊은 곳에서 자연스럽게 끌리는 색을 선택하세요',
    accentColor: '#5B8DB8',
  },
  {
    step: 1,
    number: '2',
    title: '현재 상태 / 심리 흐름',
    subtitle: '지금 이 순간 나의 상태와 가장 가까운 색을 선택하세요',
    accentColor: '#E05A4E',
  },
  {
    step: 2,
    number: '3',
    title: '회복 방향 / 필요한 에너지',
    subtitle: '지금 당신에게 필요한 에너지의 색을 선택하세요',
    accentColor: '#8FA68E',
  },
];

/** glowStyle별 유리구슬 입체감 레이어 설정 */
function getGlassLayers(item: ColorData) {
  const { glowStyle, highlightColor, glowIntensity: hi } = item;
  switch (glowStyle) {
    case 'metallic': // 골드, 실버 - 강한 금속 광택
      return {
        mainColors: ['rgba(255,255,255,0.60)', highlightColor, 'rgba(0,0,0,0.14)'] as const,
        glowOpacity: hi * 0.20,
        highlight: { top: '6%', left: '12%', width: '38%', height: '26%', opacity: hi * 0.80 },
        smallHighlight: { top: '10%', left: '18%', width: '18%', height: '12%', opacity: hi * 0.90 },
        rimOpacity: hi * 0.14,
        innerShadowColor: `rgba(0,0,0,${hi * 0.18})`,
      };
    case 'luminous': // 라벤더, 스카이블루 - 안에서 퍼지는 빛
      return {
        mainColors: ['rgba(255,255,255,0.52)', highlightColor, 'rgba(200,200,255,0.04)'] as const,
        glowOpacity: hi * 0.24,
        highlight: { top: '7%', left: '14%', width: '42%', height: '30%', opacity: hi * 0.68 },
        smallHighlight: { top: '11%', left: '20%', width: '16%', height: '10%', opacity: hi * 0.85 },
        rimOpacity: hi * 0.16,
        innerShadowColor: `rgba(100,80,180,${hi * 0.10})`,
      };
    case 'misty': // 세이지, 민트 - 안개 느낌
      return {
        mainColors: ['rgba(255,255,255,0.50)', highlightColor, 'rgba(180,210,180,0.0)'] as const,
        glowOpacity: hi * 0.22,
        highlight: { top: '7%', left: '13%', width: '40%', height: '28%', opacity: hi * 0.62 },
        smallHighlight: { top: '11%', left: '19%', width: '16%', height: '10%', opacity: hi * 0.78 },
        rimOpacity: hi * 0.10,
        innerShadowColor: `rgba(60,100,60,${hi * 0.08})`,
      };
    case 'creamy': // 아이보리, 크림 - 크림빛 부드러움
      return {
        mainColors: ['rgba(255,255,255,0.48)', highlightColor, 'rgba(255,240,210,0.07)'] as const,
        glowOpacity: hi * 0.22,
        highlight: { top: '7%', left: '13%', width: '44%', height: '32%', opacity: hi * 0.60 },
        smallHighlight: { top: '11%', left: '19%', width: '18%', height: '12%', opacity: hi * 0.76 },
        rimOpacity: hi * 0.13,
        innerShadowColor: `rgba(180,140,90,${hi * 0.07})`,
      };
    case 'radiant': // 코랄, 오렌지, 핑크 - 따뜻한 내부 발광
      return {
        mainColors: ['rgba(255,255,255,0.50)', highlightColor, 'rgba(255,170,100,0.06)'] as const,
        glowOpacity: hi * 0.20,
        highlight: { top: '6%', left: '12%', width: '40%', height: '28%', opacity: hi * 0.65 },
        smallHighlight: { top: '10%', left: '18%', width: '16%', height: '10%', opacity: hi * 0.82 },
        rimOpacity: hi * 0.11,
        innerShadowColor: `rgba(180,70,30,${hi * 0.09})`,
      };
    case 'natural': // 그린, 올리브 - 자연스러운 빛
      return {
        mainColors: ['rgba(255,255,255,0.40)', highlightColor, 'rgba(180,220,180,0.0)'] as const,
        glowOpacity: hi * 0.16,
        highlight: { top: '8%', left: '14%', width: '38%', height: '26%', opacity: hi * 0.56 },
        smallHighlight: { top: '12%', left: '20%', width: '14%', height: '9%', opacity: hi * 0.72 },
        rimOpacity: hi * 0.08,
        innerShadowColor: `rgba(50,90,50,${hi * 0.08})`,
      };
    case 'matte':
    default:
      return {
        mainColors: ['rgba(255,255,255,0.30)', highlightColor, 'rgba(0,0,0,0.07)'] as const,
        glowOpacity: hi * 0.13,
        highlight: { top: '9%', left: '15%', width: '36%', height: '24%', opacity: hi * 0.50 },
        smallHighlight: { top: '13%', left: '21%', width: '13%', height: '8%', opacity: hi * 0.65 },
        rimOpacity: hi * 0.07,
        innerShadowColor: `rgba(0,0,0,${hi * 0.12})`,
      };
  }
}

export default function SelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string }>();
  const step = parseInt(params.step ?? '0', 10);
  const { selectedColors, setSelectedColor } = useColorContext();
  const colors = useColors();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const cardInfo = CARD_INFO[step] ?? CARD_INFO[0];
  const currentSelected = selectedColors[step];

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const handleColorSelect = (color: ColorData) => {
    setSelectedColor(step, color);
  };

  const handleNext = () => {
    if (!currentSelected) return;
    if (step < 2) {
      router.push({ pathname: '/(tabs)/select', params: { step: String(step + 1) } });
    } else {
      router.push('/(tabs)/result');
    }
  };

  const handleBack = () => {
    if (step > 0) {
      router.push({ pathname: '/(tabs)/select', params: { step: String(step - 1) } });
    } else {
      router.push('/(tabs)');
    }
  };

  const renderColorItem = ({ item }: { item: ColorData }) => {
    const isSelected = currentSelected?.id === item.id;
    const circleSize = CIRCLE_SIZE - 4;
    const borderRadius = circleSize / 2;
    const gl = getGlassLayers(item);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.colorItem,
          pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
        ]}
        onPress={() => handleColorSelect(item)}
      >
        {/* 콜러 서클 - 유리구슬 입체감 */}
        <View
          style={[
            {
              width: circleSize,
              height: circleSize,
              borderRadius,
              overflow: 'hidden',
              borderWidth: isSelected ? 2.5 : 1.5,
              borderColor: getLightBorderColor(item.hex, isSelected, colors.foreground),
              shadowColor: item.hex,
              shadowOpacity: isSelected ? 0.60 : 0.28,
              shadowOffset: { width: 0, height: isSelected ? 5 : 2 },
              shadowRadius: isSelected ? 12 : 6,
              elevation: isSelected ? 10 : 4,
              transform: [{ scale: isSelected ? 1.1 : 1 }],
            },
          ]}
        >
          {/* 레이어1: 베이스 콜러 */}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: item.hex }]} />

          {/* 레이어2: 메인 광택 그라디언트 (좌상단→우하단) */}
          <LinearGradient
            colors={gl.mainColors}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* 레이어3: 내부 발광 - 중앙에서 퍼지는 빛 */}
          <LinearGradient
            colors={['transparent', `rgba(255,255,255,${gl.glowOpacity})`, 'transparent']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* 레이어4: 상단 하이라이트 - 큰 반사광 */}
          <View
            style={{
              position: 'absolute',
              top: `${gl.highlight.top}` as any,
              left: `${gl.highlight.left}` as any,
              width: `${gl.highlight.width}` as any,
              height: `${gl.highlight.height}` as any,
              backgroundColor: 'rgba(255,255,255,0.55)',
              borderRadius: circleSize * 0.35,
              opacity: gl.highlight.opacity,
              transform: [{ rotate: '-15deg' }],
            }}
          />

          {/* 레이어5: 작은 하이라이트 포인트 - 유리구슬 반짝이는 빛 */}
          <View
            style={{
              position: 'absolute',
              top: `${gl.smallHighlight.top}` as any,
              left: `${gl.smallHighlight.left}` as any,
              width: `${gl.smallHighlight.width}` as any,
              height: `${gl.smallHighlight.height}` as any,
              backgroundColor: 'rgba(255,255,255,0.85)',
              borderRadius: circleSize * 0.2,
              opacity: gl.smallHighlight.opacity,
            }}
          />

          {/* 레이어6: 하단 림 라이트 - 가장자리 반사 */}
          <LinearGradient
            colors={['transparent', `rgba(255,255,255,${gl.rimOpacity})`]}
            start={{ x: 0.5, y: 0.6 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* 레이어7: 내부 그림자 - 입체감 강화 */}
          <LinearGradient
            colors={['transparent', gl.innerShadowColor]}
            start={{ x: 0.5, y: 0.4 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* 선택 체크 마크 */}
        {isSelected && (
          <View style={[styles.checkMark, { backgroundColor: colors.foreground }]}>
            <Text style={styles.checkMarkText}>✓</Text>
          </View>
        )}

        <Text
          style={[
            styles.colorName,
            {
              color: isSelected ? colors.foreground : colors.muted,
              fontWeight: isSelected ? '600' : '400',
            },
          ]}
          numberOfLines={1}
        >
          {item.korName}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          onPress={handleBack}
        >
          <Text style={[styles.backButtonText, { color: colors.muted }]}>← 이전</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>휴심컬러</Text>
        <View style={styles.stepIndicator}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    i < step
                      ? colors.primary
                      : i === step
                      ? cardInfo.accentColor
                      : colors.border,
                  width: i === step ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 카드 정보 */}
        <Animated.View
          style={[
            styles.cardInfoSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View
            style={[
              styles.cardBadge,
              { backgroundColor: cardInfo.accentColor + '20', borderColor: cardInfo.accentColor + '40' },
            ]}
          >
            <View style={[styles.cardBadgeDot, { backgroundColor: cardInfo.accentColor }]} />
            <Text style={[styles.cardBadgeText, { color: cardInfo.accentColor }]}>
              {cardInfo.number}번 카드
            </Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{cardInfo.title}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.muted }]}>{cardInfo.subtitle}</Text>
        </Animated.View>

        {/* 선택된 컬러 미리보기 */}
        {currentSelected && (
          <Animated.View style={[styles.selectedPreview, { opacity: fadeAnim }]}>
            <View
              style={[
                styles.selectedPreviewCard,
                { backgroundColor: colors.surface, borderColor: currentSelected.hex + '50' },
              ]}
            >
              {/* 선택된 컬러 서클 (광택 포함) */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  overflow: 'hidden',
                  shadowColor: currentSelected.hex,
                  shadowOpacity: 0.45,
                  shadowOffset: { width: 0, height: 3 },
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <View
                  style={[StyleSheet.absoluteFillObject, { backgroundColor: currentSelected.hex }]}
                />
                <LinearGradient
                  colors={getGlassLayers(currentSelected).mainColors}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
              </View>

              <View style={styles.selectedInfo}>
                <Text style={[styles.selectedName, { color: colors.foreground }]}>
                  {currentSelected.korName}
                </Text>
                <Text style={[styles.selectedKeywords, { color: colors.muted }]}>
                  {currentSelected.keywords.join(' · ')}
                </Text>
              </View>
              <Text style={[styles.selectedCheck, { color: cardInfo.accentColor }]}>선택됨 ✓</Text>
            </View>
          </Animated.View>
        )}

        {/* 컬러 그리드 */}
        <Animated.View style={[styles.colorGrid, { opacity: fadeAnim }]}>
          <FlatList
            data={COLOR_DATA}
            renderItem={renderColorItem}
            keyExtractor={(item) => item.id}
            numColumns={5}
            scrollEnabled={false}
            contentContainerStyle={styles.flatListContent}
            columnWrapperStyle={styles.colorRow}
          />
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        {currentSelected ? (
          <View style={styles.bottomBarContent}>
            <View style={styles.selectedSummary}>
              <View
                style={[styles.summaryDot, { backgroundColor: currentSelected.hex }]}
              />
              <Text style={[styles.summaryText, { color: colors.muted }]}>
                {currentSelected.korName} 선택됨
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.nextButton,
                { backgroundColor: cardInfo.accentColor },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {step < 2 ? `${step + 2}번 카드 선택 →` : '결과 보기 →'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.selectHint, { color: colors.muted }]}>
            위에서 컬러를 선택해 주세요
          </Text>
        )}
      </View>
    </ScreenContainer>
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
    minWidth: 60,
  },
  backButtonText: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 60,
    justifyContent: 'flex-end',
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cardInfoSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  cardBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  selectedPreview: {
    marginBottom: 16,
  },
  selectedPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  selectedInfo: {
    flex: 1,
    gap: 3,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '600',
  },
  selectedKeywords: {
    fontSize: 12,
    lineHeight: 16,
  },
  selectedCheck: {
    fontSize: 12,
    fontWeight: '600',
  },
  colorGrid: {
    marginBottom: 8,
  },
  flatListContent: {
    gap: 12,
  },
  colorRow: {
    justifyContent: 'space-between',
  },
  colorItem: {
    width: CIRCLE_SIZE,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  checkMark: {
    position: 'absolute',
    top: -2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMarkText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  colorName: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 24,
    borderTopWidth: 0.5,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  summaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  summaryText: {
    fontSize: 13,
  },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectHint: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 4,
  },
});
