import { useState, useRef, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColorContext } from '@/lib/colorContext';
import { useColors } from '@/hooks/use-colors';
import { COLOR_DATA, ColorData } from '@/constants/colorData';

const { width } = Dimensions.get('window');
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

export default function SelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string }>();
  const step = parseInt(params.step ?? '0', 10);
  const { selectedColors, setSelectedColor } = useColorContext();
  const colors = useColors();

  const [hoveredId, setHoveredId] = useState<string | null>(null);
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
    return (
      <Pressable
        style={({ pressed }) => [
          styles.colorItem,
          pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
        ]}
        onPress={() => handleColorSelect(item)}
      >
        <View
          style={[
            styles.colorCircle,
            {
              backgroundColor: item.hex,
              borderWidth: isSelected ? 3 : 2,
              borderColor: isSelected ? colors.foreground : 'transparent',
              shadowColor: item.hex,
              shadowOpacity: isSelected ? 0.5 : 0.2,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: isSelected ? 8 : 4,
              elevation: isSelected ? 6 : 2,
              transform: [{ scale: isSelected ? 1.1 : 1 }],
            },
          ]}
        />
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
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.selectedColorCircle,
                  {
                    backgroundColor: currentSelected.hex,
                    shadowColor: currentSelected.hex,
                    shadowOpacity: 0.4,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 8,
                    elevation: 4,
                  },
                ]}
              />
              <View style={styles.selectedInfo}>
                <Text style={[styles.selectedName, { color: colors.foreground }]}>
                  {currentSelected.korName}
                </Text>
                <Text style={[styles.selectedKeywords, { color: colors.muted }]}>
                  {currentSelected.keywords.join(' · ')}
                </Text>
              </View>
              <Text style={[styles.selectedCheck, { color: colors.primary }]}>선택됨</Text>
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

        {/* 하단 여백 */}
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
  selectedColorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  colorCircle: {
    width: CIRCLE_SIZE - 4,
    height: CIRCLE_SIZE - 4,
    borderRadius: (CIRCLE_SIZE - 4) / 2,
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
