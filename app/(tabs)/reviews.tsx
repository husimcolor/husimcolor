import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';

const STAR_COUNT = 5;

// 세션 유형 레이블 매핑
const SESSION_LABELS: Record<string, { label: string; color: string }> = {
  individual: { label: '개인 코칭', color: '#6B8FA6' },
  couple: { label: '커플 코칭', color: '#A67B8A' },
  family: { label: '가족·친구', color: '#7A9A6B' },
};

// 공감 포인트 옵션 4개
const EMPATHY_OPTIONS = [
  '성향 분석이 정확했어요',
  '관계 이해에 도움이 되었어요',
  '공감받는 느낌이 들었어요',
  '회복 메시지가 위로가 되었어요',
];

function StarRating({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: STAR_COUNT }).map((_, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          onPress={() => onRate?.(i + 1)}
          disabled={!onRate}
        >
          <Text style={[styles.star, { color: i < rating ? '#F59E0B' : '#D1D5DB' }]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ReviewsScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ autoOpen?: string; sessionType?: string }>();
  const router = useRouter();

  // 필터 탭 상태
  const [filterTab, setFilterTab] = useState<string>('all');

  // 모달 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [nickname, setNickname] = useState('');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [sessionType, setSessionType] = useState<string>('');
  const [selectedEmpathy, setSelectedEmpathy] = useState<string[]>([]);

  // 외부 진입 시 자동 모달 오픈 + 세션 유형 자동 선택
  useEffect(() => {
    if (params.autoOpen === '1') {
      setModalVisible(true);
    }
    if (params.sessionType) {
      setSessionType(params.sessionType);
    }
  }, [params.autoOpen, params.sessionType]);

  const { data: allReviews, isLoading, refetch } = trpc.reviews.list.useQuery();

  // 필터링된 후기 목록
  const filteredReviews = (allReviews ?? []).filter((item) => {
    if (filterTab === 'all') return true;
    return item.sessionType === filterTab;
  });

  const createMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      refetch();
      setModalVisible(false);
      setNickname('');
      setRating(5);
      setContent('');
      setSelectedEmpathy([]);
      // 이전 화면으로 복귀 (커플/개인 결과 화면)
      const returnPath = params.sessionType === 'couple'
        ? '/(tabs)/couple-result'
        : params.sessionType === 'individual'
        ? '/(tabs)/result'
        : null;
      if (returnPath) {
        Alert.alert('감사합니다', '후기가 등록되었습니다 🌸', [
          { text: '결과 화면으로', onPress: () => router.push(returnPath as any) },
          { text: '후기 목록 보기', style: 'cancel' },
        ]);
      } else {
        Alert.alert('감사합니다', '후기가 등록되었습니다 🌸');
      }
    },
    onError: () => {
      Alert.alert('오류', '후기 등록에 실패했습니다. 다시 시도해 주세요.');
    },
  });

  const handleSubmit = () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해 주세요.');
      return;
    }
    if (!content.trim() || content.trim().length < 5) {
      Alert.alert('알림', '후기를 5자 이상 입력해 주세요.');
      return;
    }
    createMutation.mutate({
      nickname: nickname.trim(),
      rating,
      content: content.trim(),
      sessionType: sessionType || undefined,
      empathyPoints: selectedEmpathy.length > 0 ? selectedEmpathy.join(',') : undefined,
    });
  };

  const toggleEmpathy = (point: string) => {
    setSelectedEmpathy((prev) =>
      prev.includes(point) ? prev.filter((p) => p !== point) : [...prev, point]
    );
  };

  const formatDate = (d: Date | string) => {
    const date = new Date(d);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const FILTER_TABS = [
    { key: 'all', label: '전체' },
    { key: 'individual', label: '개인' },
    { key: 'couple', label: '커플' },
    { key: 'family', label: '가족·친구' },
  ];

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>사용 후기</Text>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.writeButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.writeButtonText}>후기 쓰기</Text>
        </TouchableOpacity>
      </View>

      {/* 세션 유형 필터 탭 */}
      <View style={[styles.filterTabRow, { borderBottomColor: colors.border }]}>
        {FILTER_TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            activeOpacity={0.75}
            style={[
              styles.filterTab,
              filterTab === key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setFilterTab(key)}
          >
            <Text style={[
              styles.filterTabText,
              { color: filterTab === key ? colors.primary : colors.muted },
              filterTab === key && { fontWeight: '700' },
            ]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>후기를 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🌸</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {filterTab === 'all' ? '아직 후기가 없습니다.\n첫 번째 후기를 남겨보세요!' : '해당 유형의 후기가 없습니다.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const sessionInfo = item.sessionType ? SESSION_LABELS[item.sessionType] : null;
            const empathyList = item.empathyPoints ? item.empathyPoints.split(',').filter(Boolean) : [];
            return (
              <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewHeaderLeft}>
                    <Text style={[styles.reviewNickname, { color: colors.foreground }]}>{item.nickname}</Text>
                    {sessionInfo && (
                      <View style={[styles.sessionBadge, { backgroundColor: sessionInfo.color + '22', borderColor: sessionInfo.color + '55' }]}>
                        <Text style={[styles.sessionBadgeText, { color: sessionInfo.color }]}>{sessionInfo.label}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.reviewDate, { color: colors.muted }]}>{formatDate(item.createdAt)}</Text>
                </View>
                <StarRating rating={item.rating} />
                {item.colorCombo ? (
                  <Text style={[styles.reviewCombo, { color: colors.primary }]}>🎨 {item.colorCombo}</Text>
                ) : null}
                {empathyList.length > 0 && (
                  <View style={styles.empathyChipRow}>
                    {empathyList.map((p, idx) => (
                      <View key={idx} style={[styles.empathyChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
                        <Text style={[styles.empathyChipText, { color: colors.primary }]}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={[styles.reviewContent, { color: colors.foreground }]}>{item.content}</Text>
              </View>
            );
          }}
        />
      )}

      {/* 후기 작성 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <ScrollView
            style={[styles.modalBox, { backgroundColor: colors.background, borderColor: colors.border }]}
            contentContainerStyle={{ gap: 10, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>후기 남기기</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalClose, { color: colors.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.muted }]}>닉네임</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor={colors.muted}
              value={nickname}
              onChangeText={setNickname}
              maxLength={20}
              returnKeyType="next"
            />

            {/* 세션 유형 태그 선택 */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>세션 유형</Text>
            <View style={styles.tagRow}>
              {[
                { key: 'individual', label: '개인 코칭' },
                { key: 'couple', label: '커플 코칭' },
                { key: 'family', label: '가족·친구' },
              ].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.75}
                  style={[
                    styles.tagChip,
                    sessionType === key
                      ? { backgroundColor: colors.primary, borderColor: colors.primary }
                      : { backgroundColor: 'transparent', borderColor: colors.border },
                  ]}
                  onPress={() => setSessionType((prev) => (prev === key ? '' : key))}
                >
                  <Text style={[
                    styles.tagChipText,
                    { color: sessionType === key ? '#fff' : colors.muted },
                  ]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.muted }]}>별점</Text>
            <StarRating rating={rating} onRate={setRating} />

            {/* 공감 포인트 선택 */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>공감 포인트 (선택)</Text>
            <View style={styles.empathyOptionRow}>
              {EMPATHY_OPTIONS.map((point) => {
                const selected = selectedEmpathy.includes(point);
                return (
                  <TouchableOpacity
                    key={point}
                    activeOpacity={0.75}
                    style={[
                      styles.empathyOption,
                      selected
                        ? { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                        : { backgroundColor: 'transparent', borderColor: colors.border },
                    ]}
                    onPress={() => toggleEmpathy(point)}
                  >
                    <Text style={[
                      styles.empathyOptionText,
                      { color: selected ? colors.primary : colors.muted },
                      selected && { fontWeight: '600' },
                    ]}>
                      {selected ? '✓ ' : ''}{point}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: colors.muted }]}>후기</Text>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
              placeholder="휴심컬러 경험을 자유롭게 남겨주세요 (5자 이상)"
              placeholderTextColor={colors.muted}
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
              returnKeyType="done"
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.muted }]}>{content.length}/500</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.submitButton, { backgroundColor: colors.primary, opacity: createMutation.isPending ? 0.6 : 1 }]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              <Text style={styles.submitButtonText}>
                {createMutation.isPending ? '등록 중...' : '후기 등록하기'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  writeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  writeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTabRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    paddingHorizontal: 8,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  reviewNickname: {
    fontSize: 15,
    fontWeight: '700',
  },
  sessionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  sessionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 12,
    marginLeft: 8,
    flexShrink: 0,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 20,
  },
  reviewCombo: {
    fontSize: 12,
    fontWeight: '500',
  },
  empathyChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  empathyChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  empathyChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  reviewContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: 18,
    padding: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  empathyOptionRow: {
    gap: 8,
    marginTop: 2,
  },
  empathyOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  empathyOptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    height: 110,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: -4,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
