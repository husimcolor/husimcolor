import { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { useColorContext } from '@/lib/colorContext';
import { useColors } from '@/hooks/use-colors';
import { COLOR_DATA, ColorData } from '@/constants/colorData';

const { width } = Dimensions.get('window');

function getLightBorderColor(hex: string, isSelected: boolean, foregroundColor: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (isSelected) return foregroundColor;
  if (brightness >= 200) return '#C8BFB0';
  return 'rgba(255,255,255,0.45)';
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

function getGlassLayers(item: ColorData) {
  const { glowStyle, highlightColor, glowIntensity: hi } = item;
  switch (glowStyle) {
    case 'metallic':
      return {
        mainColors: ['rgba(255,255,255,0.60)', highlightColor, 'rgba(0,0,0,0.14)'] as const,
        glowOpacity: hi * 0.20,
        highlight: { top: '6%', left: '12%', width: '38%', height: '26%', opacity: hi * 0.80 },
        smallHighlight: { top: '10%', left: '18%', width: '18%', height: '12%', opacity: hi * 0.90 },
        rimOpacity: hi * 0.14,
        innerShadowColor: `rgba(0,0,0,${hi * 0.18})`,
      };
    case 'luminous':
      return {
        mainColors: ['rgba(255,255,255,0.52)', highlightColor, 'rgba(200,200,255,0.04)'] as const,
        glowOpacity: hi * 0.24,
        highlight: { top: '7%', left: '14%', width: '42%', height: '30%', opacity: hi * 0.68 },
        smallHighlight: { top: '11%', left: '20%', width: '16%', height: '10%', opacity: hi * 0.85 },
        rimOpacity: hi * 0.16,
        innerShadowColor: `rgba(100,80,180,${hi * 0.10})`,
      };
    case 'misty':
      return {
        mainColors: ['rgba(255,255,255,0.50)', highlightColor, 'rgba(180,210,180,0.0)'] as const,
        glowOpacity: hi * 0.22,
        highlight: { top: '7%', left: '13%', width: '40%', height: '28%', opacity: hi * 0.62 },
        smallHighlight: { top: '11%', left: '19%', width: '16%', height: '10%', opacity: hi * 0.78 },
        rimOpacity: hi * 0.10,
        innerShadowColor: `rgba(60,100,60,${hi * 0.08})`,
      };
    case 'creamy':
      return {
        mainColors: ['rgba(255,255,255,0.48)', highlightColor, 'rgba(255,240,210,0.07)'] as const,
        glowOpacity: hi * 0.22,
        highlight: { top: '7%', left: '13%', width: '44%', height: '32%', opacity: hi * 0.60 },
        smallHighlight: { top: '11%', left: '19%', width: '18%', height: '12%', opacity: hi * 0.76 },
        rimOpacity: hi * 0.13,
        innerShadowColor: `rgba(180,140,90,${hi * 0.07})`,
      };
    case 'radiant':
      return {
        mainColors: ['rgba(255,255,255,0.50)', highlightColor, 'rgba(255,170,100,0.06)'] as const,
        glowOpacity: hi * 0.20,
        highlight: { top: '6%', left: '12%', width: '40%', height: '28%', opacity: hi * 0.65 },
        smallHighlight: { top: '10%', left: '18%', width: '16%', height: '10%', opacity: hi * 0.82 },
        rimOpacity: hi * 0.11,
        innerShadowColor: `rgba(180,70,30,${hi * 0.09})`,
      };
    case 'natural':
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

// ─── 카드 컴포넌트 ──────────────────────────────────────────────────────────
interface CardItemProps {
  item: ColorData;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  visible: boolean; // 셔플 등장 여부
}

function CardItem({ item, index, isSelected, onPress, visible }: CardItemProps) {
  // 뒤집기 상태: 'back'(뒷면), 'flipping'(뒤집는 중), 'front'(앞면)
  const [flipState, setFlipState] = useState<'back' | 'flipping-out' | 'flipping-in' | 'front'>(
    isSelected ? 'front' : 'back'
  );

  const circleSize = CIRCLE_SIZE - 4;
  const borderRadius = circleSize / 2;
  const gl = getGlassLayers(item);

  useEffect(() => {
    if (isSelected && flipState === 'back') {
      // 뒤집기 시작: 먼저 scaleX 0으로 (뒷면 사라짐)
      setFlipState('flipping-out');
      setTimeout(() => {
        // 앞면으로 교체 후 scaleX 1로 (앞면 등장)
        setFlipState('flipping-in');
        setTimeout(() => {
          setFlipState('front');
        }, 200);
      }, 200);
    } else if (!isSelected && flipState === 'front') {
      // 선택 해제: 앞면 → 뒷면
      setFlipState('flipping-out');
      setTimeout(() => {
        setFlipState('flipping-in');
        setTimeout(() => {
          setFlipState('back');
        }, 200);
      }, 200);
    }
  }, [isSelected]);

  // 뒤집기 scaleX 값
  const isFlippingOut = flipState === 'flipping-out';
  const isFlippingIn = flipState === 'flipping-in';
  const showFront = flipState === 'front' || flipState === 'flipping-in';

  // 셔플 등장 애니메이션: visible 상태에 따라 opacity/translateY 전환
  const entryStyle: any = {
    opacity: visible ? 1 : 0,
    transform: [{ translateY: visible ? 0 : 16 }],
    // CSS transition (웹에서 동작)
    transition: visible
      ? `opacity 0.3s ease ${index * 0.025}s, transform 0.3s ease ${index * 0.025}s`
      : 'none',
  };

  // 뒤집기 transition
  const flipStyle: any = {
    transform: [
      { scaleX: isFlippingOut ? 0.05 : 1 },
      { scale: isSelected ? 1.08 : 1 },
    ],
    transition: isFlippingOut
      ? 'transform 0.18s ease-in'
      : isFlippingIn
      ? 'transform 0.18s ease-out'
      : 'transform 0.15s ease',
  };

  return (
    <View style={[styles.colorItem, entryStyle]}>
      <Pressable
        style={({ pressed }) => [
          { alignItems: 'center', gap: 4 },
          pressed && { opacity: 0.75 },
        ]}
        onPress={onPress}
      >
        <View
          style={[
            {
              width: circleSize,
              height: circleSize,
              borderRadius,
              overflow: 'hidden',
              borderWidth: isSelected ? 2.5 : 1.5,
              borderColor: getLightBorderColor(item.hex, isSelected, '#3D3530'),
              shadowColor: item.hex,
              shadowOpacity: isSelected ? 0.60 : 0.28,
              shadowOffset: { width: 0, height: isSelected ? 5 : 2 },
              shadowRadius: isSelected ? 12 : 6,
              elevation: isSelected ? 10 : 4,
            },
            flipStyle,
          ]}
        >
          {/* 뒷면: 베이지 크림 */}
          {!showFront && (
            <>
              <LinearGradient
                colors={['#F5EFE4', '#EDE4D6', '#E0D5C4']}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: circleSize * 0.38, opacity: 0.35 }}>🌿</Text>
              </View>
            </>
          )}

          {/* 앞면: 실제 컬러 */}
          {showFront && (
            <>
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: item.hex }]} />
              <LinearGradient
                colors={gl.mainColors}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={['transparent', `rgba(255,255,255,${gl.glowOpacity})`, 'transparent']}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View
                style={{
                  position: 'absolute',
                  top: gl.highlight.top as any,
                  left: gl.highlight.left as any,
                  width: gl.highlight.width as any,
                  height: gl.highlight.height as any,
                  backgroundColor: 'rgba(255,255,255,0.55)',
                  borderRadius: circleSize * 0.35,
                  opacity: gl.highlight.opacity,
                  transform: [{ rotate: '-15deg' }],
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  top: gl.smallHighlight.top as any,
                  left: gl.smallHighlight.left as any,
                  width: gl.smallHighlight.width as any,
                  height: gl.smallHighlight.height as any,
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  borderRadius: circleSize * 0.2,
                  opacity: gl.smallHighlight.opacity,
                }}
              />
              <LinearGradient
                colors={['transparent', `rgba(255,255,255,${gl.rimOpacity})`]}
                start={{ x: 0.5, y: 0.6 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={['transparent', gl.innerShadowColor]}
                start={{ x: 0.5, y: 0.4 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </>
          )}
        </View>

        {/* 선택 체크 마크 */}
        {isSelected && (
          <View style={[styles.checkMark, { backgroundColor: '#3D3530' }]}>
            <Text style={styles.checkMarkText}>✓</Text>
          </View>
        )}

        <Text
          style={[
            styles.colorName,
            {
              color: isSelected ? '#3D3530' : '#8A7A68',
              fontWeight: isSelected ? '600' : '400',
            },
          ]}
          numberOfLines={1}
        >
          {isSelected ? item.korName : '?'}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── 메인 화면 ──────────────────────────────────────────────────────────────
export default function SelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string }>();
  const step = parseInt(params.step ?? '0', 10);
  const { selectedColors, setSelectedColor } = useColorContext();
  const insets = useSafeAreaInsets();

  // 헤더 페이드인
  const [headerVisible, setHeaderVisible] = useState(false);
  // 카드 등장 여부 (셔플 애니메이션)
  const [cardsVisible, setCardsVisible] = useState(false);
  // 셔플 중 텍스트 표시
  const [shuffling, setShuffling] = useState(true);

  const cardInfo = CARD_INFO[step] ?? CARD_INFO[0];
  const currentSelected = selectedColors[step];

  useEffect(() => {
    // 단계 전환 시 초기화
    setHeaderVisible(false);
    setCardsVisible(false);
    setShuffling(true);

    // 헤더 먼저 등장
    const t1 = setTimeout(() => setHeaderVisible(true), 80);
    // 카드 셔플 등장
    const t2 = setTimeout(() => {
      setCardsVisible(true);
      setShuffling(false);
    }, 300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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

  const renderColorItem = ({ item, index }: { item: ColorData; index: number }) => {
    const isSelected = currentSelected?.id === item.id;
    return (
      <CardItem
        key={`${step}-${item.id}`}
        item={item}
        index={index}
        isSelected={isSelected}
        onPress={() => handleColorSelect(item)}
        visible={cardsVisible}
      />
    );
  };

  // 헤더 CSS transition 스타일
  const headerStyle: any = {
    opacity: headerVisible ? 1 : 0,
    transform: [{ translateY: headerVisible ? 0 : 12 }],
    transition: 'opacity 0.35s ease, transform 0.35s ease',
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: '#DDD8CE' }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          onPress={handleBack}
        >
          <Text style={[styles.backButtonText, { color: '#8A7A68' }]}>← 이전</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#3D3530' }]}>휴심컬러</Text>
        <View style={styles.stepIndicator}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    i < step
                      ? '#8FA68E'
                      : i === step
                      ? cardInfo.accentColor
                      : '#DDD8CE',
                  width: i === step ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 카드 정보 */}
        <View style={[styles.cardInfoSection, headerStyle]}>
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
          <Text style={[styles.cardTitle, { color: '#3D3530' }]}>{cardInfo.title}</Text>
          <Text style={[styles.cardSubtitle, { color: '#5F4B3B' }]}>{cardInfo.subtitle}</Text>
          <Text style={[styles.shuffleHint, { color: '#A09080' }]}>
            {shuffling ? '🌿 카드를 섞는 중...' : '🌿 카드를 눌러 색을 확인하세요'}
          </Text>
        </View>

        {/* 선택된 컬러 미리보기 */}
        {currentSelected && (
          <View style={[styles.selectedPreview, { opacity: 1 }]}>
            <View
              style={[
                styles.selectedPreviewCard,
                { backgroundColor: '#F2EFE7', borderColor: currentSelected.hex + '50' },
              ]}
            >
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
                <Text style={[styles.selectedName, { color: '#3D3530' }]}>
                  {currentSelected.korName}
                </Text>
                <Text style={[styles.selectedKeywords, { color: '#8A7A68' }]}>
                  {currentSelected.keywords.join(' · ')}
                </Text>
              </View>
              <Text style={[styles.selectedCheck, { color: cardInfo.accentColor }]}>선택됨 ✓</Text>
            </View>
          </View>
        )}

        {/* 컬러 그리드 */}
        <View style={styles.colorGrid}>
          <FlatList
            data={COLOR_DATA}
            renderItem={renderColorItem}
            keyExtractor={(item) => item.id}
            numColumns={5}
            scrollEnabled={false}
            contentContainerStyle={styles.flatListContent}
            columnWrapperStyle={styles.colorRow}
          />
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View
        style={[
          styles.bottomBar,
          { backgroundColor: '#FAF8F3', borderTopColor: '#DDD8CE' },
        ]}
      >
        {currentSelected ? (
          <View style={styles.bottomBarContent}>
            <View style={styles.selectedSummary}>
              <View style={[styles.summaryDot, { backgroundColor: currentSelected.hex }]} />
              <Text style={[styles.summaryText, { color: '#8A7A68' }]}>
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
          <Text style={[styles.selectHint, { color: '#8A7A68' }]}>
            카드를 눌러 색을 확인하고 선택해 주세요
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
  backButtonText: { fontSize: 14 },
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
  stepDot: { height: 8, borderRadius: 4 },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cardInfoSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  shuffleHint: { fontSize: 12, marginTop: 4 },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  cardBadgeDot: { width: 8, height: 8, borderRadius: 4 },
  cardBadgeText: { fontSize: 13, fontWeight: '600' },
  cardTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  cardSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  selectedPreview: { marginBottom: 16 },
  selectedPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  selectedInfo: { flex: 1, gap: 3 },
  selectedName: { fontSize: 15, fontWeight: '600' },
  selectedKeywords: { fontSize: 12, lineHeight: 16 },
  selectedCheck: { fontSize: 12, fontWeight: '600' },
  colorGrid: { marginBottom: 8 },
  flatListContent: { gap: 12 },
  colorRow: { justifyContent: 'space-between' },
  colorItem: {
    width: CIRCLE_SIZE,
    alignItems: 'center',
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
    zIndex: 10,
  },
  checkMarkText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  colorName: { fontSize: 10, textAlign: 'center', lineHeight: 14 },
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
  summaryDot: { width: 12, height: 12, borderRadius: 6 },
  summaryText: { fontSize: 13 },
  nextButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  nextButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  selectHint: { textAlign: 'center', fontSize: 14, paddingVertical: 4 },
});
