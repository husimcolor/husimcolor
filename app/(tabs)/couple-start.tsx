/**
 * 커플 세션 시작 화면
 * 관계 상품 및 관계 조합 선택. 두 사람의 정보 입력은 couple-info 화면에서 이어진다.
 */
import React, { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Animated, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RelationType } from '@/constants/coupleData';
import {
  VISIBLE_RELATION_PRODUCTS,
  type VisibleRelationProduct,
} from '@/constants/relationProducts';
import { BusinessInfoFooter } from '@/components/business-info-footer';

const ROMANTIC_RELATION_TYPES: { value: Extract<RelationType, '연인' | '부부'>; label: string; emoji: string }[] = [
  { value: '연인', label: '연인', emoji: '💑' },
  { value: '부부', label: '부부', emoji: '👫' },
];

// 부모-자녀 선택 시 세부 조합
const PARENT_CHILD_COMBOS: { value: RelationType; label: string }[] = [
  { value: '아빠-아들', label: '아빠 ↔ 아들' },
  { value: '아빠-딸', label: '아빠 ↔ 딸' },
  { value: '엄마-아들', label: '엄마 ↔ 아들' },
  { value: '엄마-딸', label: '엄마 ↔ 딸' },
];

export default function CoupleStartScreen() {
  const router = useRouter();
  const colors = useColors();

  const [relationType, setRelationType] = useState<RelationType | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<VisibleRelationProduct['id'] | null>(null);
  // 부모-자녀 선택 시 세부 조합 상태
  const [parentChildCombo, setParentChildCombo] = useState<RelationType | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? Math.max(insets.top, 20) : 0;
  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  // 커플 테스트 시작 추적
  const logVisitor = trpc.visitors.log.useMutation();
  const commerceTestMode = trpc.commerce.checkout.testMode.useQuery();
  const paidAnalysisPublicEnabled = commerceTestMode.data?.paidAnalysisPublicEnabled ?? false;
  useEffect(() => {
    const track = async () => {
      try {
        const deviceId = await AsyncStorage.getItem('husim_device_id') ?? 'unknown';
        logVisitor.mutate({ deviceId, visitType: 'couple_start', testType: 'couple' });
      } catch (_) {}
    };
    track();
  }, []);

  // 부모-자녀 선택 시 세부 조합이 필요함
  const isParentChild = relationType === '부모-자녀';
  const isRomanticProduct = selectedProductId === 'romantic';
  // 실제 저장될 관계 유형: 부모-자녀 선택 시 세부 조합으로 대체
  const effectiveRelationType: RelationType | null = isParentChild
    ? parentChildCombo
    : relationType;

  const paidProductCode = selectedProductId === 'romantic'
    ? 'couple_love_deep'
    : selectedProductId === 'parent-child'
      ? 'parent_child_deep'
      : null;
  const paidProductPreparing = Boolean(paidProductCode && !paidAnalysisPublicEnabled);
  const canProceed = Boolean(effectiveRelationType) && !paidProductPreparing;

  const handleStart = () => {
    if (!effectiveRelationType) return;
    if (paidProductCode && !paidAnalysisPublicEnabled) return;
    if (paidProductCode && commerceTestMode.data?.tossTestEnabled) {
      router.push(`/(tabs)/commerce-checkout?product=${paidProductCode}&relationType=${encodeURIComponent(effectiveRelationType)}` as any);
      return;
    }
    router.push({ pathname: '/(tabs)/couple-info', params: { relationType: effectiveRelationType } } as any);
  };

  const handleRelationTypeSelect = (value: RelationType) => {
    setRelationType(value);
    // 부모-자녀가 아닌 다른 유형 선택 시 세부 조합 초기화
    if (value !== '부모-자녀') {
      setParentChildCombo(null);
    }
  };

  const handleProductSelect = (product: VisibleRelationProduct) => {
    setSelectedProductId(product.id);

    if (product.id === 'parent-child') {
      setRelationType('부모-자녀');
      setParentChildCombo(null);
      return;
    }

    if (product.id === 'friend') {
      setRelationType('친구');
      setParentChildCombo(null);
      return;
    }

    setRelationType(null);
    setParentChildCombo(null);
  };

  const renderChip = (
    label: string,
    isSelected: boolean,
    onPress: () => void,
    emoji?: string
  ) => (
    <Pressable
      key={label}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: isSelected ? colors.primary : '#F0EAE0',
          borderColor: isSelected ? colors.primary : '#C4A882',
        },
        pressed && { opacity: 0.8 },
      ]}
      onPress={onPress}
    >
      {emoji && <Text style={styles.chipEmoji}>{emoji}</Text>}
      <Text style={[styles.chipText, { color: isSelected ? '#fff' : '#4A3020' }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          topPad > 0 && { paddingTop: topPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backBtnText, { color: colors.muted }]}>←</Text>
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: '#2D2420' }]}>관계 분석</Text>
              <Text style={[styles.subtitle, { color: '#5F4B3B' }]}>
                서로를 이해하는 감성 심리코칭
              </Text>
            </View>
          </View>

          {/* 안내 문구 */}
          <View style={[styles.infoCard, { backgroundColor: '#2A2420', borderColor: '#4A3A30' }]}>
            <Text style={[styles.infoText, { color: '#F0E8DC' }]}>
              두 사람이 각자 컬러를 선택하고,{'\n'}
              서로의 마음 흐름과 관계 패턴을 함께 살펴봅니다.{'\n'}
              누가 맞고 틀린 것이 아닌,{'\n'}
              서로를 이해하는 시간입니다.
            </Text>
          </View>

          {/* 관계 분석 상품 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#2D2420' }]}>관계 분석 상품 선택</Text>
            <View style={styles.productList}>
              {VISIBLE_RELATION_PRODUCTS.map((product) => (
                <Pressable
                  key={product.id}
                  style={({ pressed }) => [
                    styles.productCard,
                    {
                      backgroundColor: selectedProductId === product.id ? '#2A2420' : '#F8F3EA',
                      borderColor: selectedProductId === product.id ? '#2A2420' : '#D8C8B4',
                    },
                    pressed && { opacity: 0.86, transform: [{ scale: 0.985 }] },
                  ]}
                  onPress={() => handleProductSelect(product)}
                >
                  <Text style={[styles.productTitle, { color: selectedProductId === product.id ? '#FFF9F0' : '#2D2420' }]}>
                    {product.title}
                  </Text>
                  <Text style={[styles.productPrice, { color: selectedProductId === product.id ? '#F4D9A8' : '#8B5D2E' }]}>
                    {product.price}
                  </Text>
                  {product.id !== 'friend' && !paidAnalysisPublicEnabled ? (
                    <Text style={[styles.productPreparing, { color: selectedProductId === product.id ? '#F4D9A8' : '#8B5D2E' }]}>정식 오픈 준비중</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>

          {/* 부부·연인 상품의 기존 세부 관계 선택 */}
          {isRomanticProduct && (
            <View style={[styles.subSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.subSectionTitle, { color: colors.muted }]}>관계 조합을 선택해주세요</Text>
              <View style={styles.chipRow}>
                {ROMANTIC_RELATION_TYPES.map((relation) =>
                  renderChip(
                    relation.label,
                    relationType === relation.value,
                    () => handleRelationTypeSelect(relation.value),
                    relation.emoji,
                  )
                )}
              </View>
            </View>
          )}

          {/* 부모-자녀 세부 조합 선택 */}
          {isParentChild && (
            <View style={[styles.subSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.subSectionTitle, { color: colors.muted }]}>
                관계 조합을 선택해주세요
              </Text>
              <View style={styles.chipRow}>
                {PARENT_CHILD_COMBOS.map(c =>
                  renderChip(c.label, parentChildCombo === c.value, () => setParentChildCombo(c.value))
                )}
              </View>
            </View>
          )}

          {/* 상품 선택 후 정보 입력 단계로 이동 */}
          <Pressable
            style={({ pressed }) => [
              styles.startBtn,
              { backgroundColor: canProceed ? colors.primary : colors.border },
              pressed && canProceed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleStart}
            disabled={!canProceed}
          >
            <Text style={[styles.startBtnText, { color: canProceed ? '#fff' : colors.muted }]}>
              {paidProductPreparing ? '정식 오픈 준비중' : '다음 · 두 사람 정보 입력하기 →'}
            </Text>
          </Pressable>

          <BusinessInfoFooter />
          <View style={{ height: 28 }} />
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, fontWeight: '600' },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  infoCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24,
  },
  infoText: { fontSize: 15, lineHeight: 26, textAlign: 'center' },
  section: { marginBottom: 24 },
  productList: { gap: 10 },
  productCard: {
    minHeight: 70,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  productTitle: { flex: 1, fontSize: 16, lineHeight: 23, fontWeight: '700' },
  productPrice: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  productPreparing: { fontSize: 11, fontWeight: '700', position: 'absolute', right: 16, bottom: 10 },
  subSection: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 20, marginTop: -12,
  },
  subSectionTitle: { fontSize: 13, fontWeight: '500', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10, letterSpacing: 0.2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 14, fontWeight: '500' },
  startBtn: {
    paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8,
  },
  startBtnText: { fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
});
