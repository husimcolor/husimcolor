'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '@/components/screen-container';
import { useColorContext } from '@/lib/colorContext';
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

// CSS @keyframes 스타일을 DOM에 주입 (웹 전용)
let cssInjected = false;
function injectCardCSS() {
  if (Platform.OS !== 'web') return;
  if (cssInjected) return;
  cssInjected = true;

  const style = document.createElement('style');
  style.id = 'hyusim-card-anim';
  style.textContent = `
    @keyframes cardEnter {
      0%   { opacity: 0; transform: translateY(18px); }
      100% { opacity: 1; transform: translateY(0px); }
    }
    @keyframes cardFlipOut {
      0%   { transform: scaleX(1); }
      100% { transform: scaleX(0); }
    }
    @keyframes cardFlipIn {
      0%   { transform: scaleX(0); }
      100% { transform: scaleX(1); }
    }
    @keyframes cardSelect {
      0%   { transform: scaleX(1) scale(1); }
      50%  { transform: scaleX(1) scale(1.10); }
      100% { transform: scaleX(1) scale(1.08); }
    }
    .card-enter {
      animation: cardEnter 0.38s ease both;
    }
    .card-flip-out {
      animation: cardFlipOut 0.16s ease forwards;
    }
    .card-flip-in {
      animation: cardFlipIn 0.16s ease forwards;
    }
    .card-selected {
      animation: cardSelect 0.22s ease forwards;
    }
  `;
  document.head.appendChild(style);
}

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
  entryDelay: number;
  shuffleKey: number;
}

function CardItem({ item, index, isSelected, onPress, entryDelay, shuffleKey }: CardItemProps) {
  const circleSize = CIRCLE_SIZE - 4;
  const borderRadius = circleSize / 2;
  const gl = getGlassLayers(item);

  // ── 웹 전용: CSS 클래스 기반 애니메이션 ──
  if (Platform.OS === 'web') {
    return (
      <WebCardItem
        item={item}
        index={index}
        isSelected={isSelected}
        onPress={onPress}
        entryDelay={entryDelay}
        shuffleKey={shuffleKey}
        circleSize={circleSize}
        borderRadius={borderRadius}
        gl={gl}
      />
    );
  }

  // ── 네이티브: Animated API ──
  return (
    <NativeCardItem
      item={item}
      index={index}
      isSelected={isSelected}
      onPress={onPress}
      entryDelay={entryDelay}
      shuffleKey={shuffleKey}
      circleSize={circleSize}
      borderRadius={borderRadius}
      gl={gl}
    />
  );
}

// ─── 웹 카드 컴포넌트 ────────────────────────────────────────────────────────
interface InnerCardProps {
  item: ColorData;
  index: number;
  isSelected: boolean;
  onPress: () => void;
  entryDelay: number;
  shuffleKey: number;
  circleSize: number;
  borderRadius: number;
  gl: ReturnType<typeof getGlassLayers>;
}

function WebCardItem({ item, index, isSelected, onPress, entryDelay, shuffleKey, circleSize, borderRadius, gl }: InnerCardProps) {
  const [showFront, setShowFront] = useState(false);
  const [flipPhase, setFlipPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const prevSelected = useRef(isSelected);
  // 셔플 애니메이션용 key (shuffleKey 변경 시 재마운트 효과)
  const [animKey, setAnimKey] = useState(shuffleKey);

  useEffect(() => {
    setAnimKey(shuffleKey);
    // 새 셔플 시 앞면 리셋
    setShowFront(false);
    setFlipPhase('idle');
    prevSelected.current = false;
  }, [shuffleKey]);

  useEffect(() => {
    if (prevSelected.current === isSelected) return;
    prevSelected.current = isSelected;

    // 뒤집기: out → 면 교체 → in
    setFlipPhase('out');
    const t = setTimeout(() => {
      setShowFront(isSelected);
      setFlipPhase('in');
      const t2 = setTimeout(() => setFlipPhase('idle'), 180);
      return () => clearTimeout(t2);
    }, 170);
    return () => clearTimeout(t);
  }, [isSelected]);

  // 셔플 등장 애니메이션: animKey 변경 시 재적용
  const entryStyle: React.CSSProperties = {
    animationName: 'cardEnter',
    animationDuration: '0.38s',
    animationTimingFunction: 'ease',
    animationFillMode: 'both',
    animationDelay: `${entryDelay}ms`,
  };

  // 뒤집기 애니메이션
  let flipStyle: React.CSSProperties = {};
  if (flipPhase === 'out') {
    flipStyle = {
      animationName: 'cardFlipOut',
      animationDuration: '0.16s',
      animationTimingFunction: 'ease',
      animationFillMode: 'forwards',
    };
  } else if (flipPhase === 'in') {
    flipStyle = {
      animationName: 'cardFlipIn',
      animationDuration: '0.16s',
      animationTimingFunction: 'ease',
      animationFillMode: 'forwards',
    };
  } else if (isSelected) {
    flipStyle = { transform: 'scale(1.08)' };
  }

  return (
    <View
      key={`entry-${animKey}`}
      style={[styles.colorItem, entryStyle as any]}
    >
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
            flipStyle as any,
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
              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius,
                  borderWidth: 1,
                  borderColor: gl.innerShadowColor,
                }}
              />
            </>
          )}
        </View>

        {/* 선택 체크마크 */}
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
          {showFront ? item.korName : '?'}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── 네이티브 카드 컴포넌트 ──────────────────────────────────────────────────
function NativeCardItem({ item, index, isSelected, onPress, entryDelay, shuffleKey, circleSize, borderRadius, gl }: InnerCardProps) {
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entryTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    entryOpacity.setValue(0);
    entryTranslateY.setValue(20);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(entryOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(entryTranslateY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();
    }, entryDelay);
    return () => clearTimeout(timer);
  }, [shuffleKey]);

  const [showFront, setShowFront] = useState(false);
  const flipScale = useRef(new Animated.Value(1)).current;
  const prevSelected = useRef(isSelected);

  useEffect(() => {
    if (prevSelected.current === isSelected) return;
    prevSelected.current = isSelected;
    Animated.timing(flipScale, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setShowFront(isSelected);
      Animated.timing(flipScale, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    });
  }, [isSelected]);

  const selectScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.spring(selectScale, {
      toValue: isSelected ? 1.08 : 1,
      friction: 6,
      tension: 200,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  return (
    <Animated.View
      style={[
        styles.colorItem,
        {
          opacity: entryOpacity,
          transform: [{ translateY: entryTranslateY }],
        },
      ]}
    >
      <Pressable
        style={({ pressed }) => [
          { alignItems: 'center', gap: 4 },
          pressed && { opacity: 0.75 },
        ]}
        onPress={onPress}
      >
        <Animated.View
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
            {
              transform: [
                { scaleX: flipScale },
                { scale: selectScale },
              ],
            },
          ]}
        >
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
              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius,
                  borderWidth: 1,
                  borderColor: gl.innerShadowColor,
                }}
              />
            </>
          )}
        </Animated.View>

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
          {showFront ? item.korName : '?'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── 메인 화면 ──────────────────────────────────────────────────────────────
export default function SelectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ step?: string }>();
  const step = parseInt(params.step ?? '0', 10);
  const { selectedColors, setSelectedColor } = useColorContext();
  const insets = useSafeAreaInsets();

  // CSS 주입 (웹 전용, 최초 1회)
  useEffect(() => {
    injectCardCSS();
  }, []);

  // shuffleKey: step 변경 시마다 카드 재마운트 → 셔플 애니메이션 재실행
  const [shuffleKey, setShuffleKey] = useState(0);
  const [shuffling, setShuffling] = useState(true);

  const cardInfo = CARD_INFO[step] ?? CARD_INFO[0];
  const currentSelected = selectedColors[step];

  useEffect(() => {
    setShuffling(true);
    setShuffleKey((k) => k + 1);
    const t = setTimeout(() => setShuffling(false), 400);
    return () => clearTimeout(t);
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

  const renderColorItem = useCallback(
    ({ item, index }: { item: ColorData; index: number }) => {
      const isSelected = currentSelected?.id === item.id;
      return (
        <CardItem
          key={`${shuffleKey}-${item.id}`}
          item={item}
          index={index}
          isSelected={isSelected}
          onPress={() => handleColorSelect(item)}
          entryDelay={index * 35}
          shuffleKey={shuffleKey}
        />
      );
    },
    [currentSelected, shuffleKey]
  );

  // 헤더 페이드인 (네이티브 전용)
  const headerOpacity = useRef(new Animated.Value(Platform.OS === 'web' ? 1 : 0)).current;
  useEffect(() => {
    if (Platform.OS === 'web') return;
    headerOpacity.setValue(0);
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [step]);

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
        <Animated.View style={[styles.cardInfoSection, { opacity: headerOpacity }]}>
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
        </Animated.View>

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
            extraData={`${shuffleKey}-${currentSelected?.id}`}
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
