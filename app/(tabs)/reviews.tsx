import { useState } from 'react';
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

const CHECK_ITEMS = [
  '결과가 잘 맞았어요',
  '나를 이해하는 데 도움이 되었어요',
  '관계를 이해하는 데 도움이 되었어요',
  '친구나 가족에게 추천하고 싶어요',
  '다시 이용하고 싶어요',
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
  const [modalVisible, setModalVisible] = useState(false);
  const [nickname, setNickname] = useState('');
  const [rating, setRating] = useState(5);
  const [selectedChecks, setSelectedChecks] = useState<string[]>([]);
  const [content, setContent] = useState('');

  const { data: reviews, isLoading, isError, refetch } = trpc.reviews.list.useQuery(undefined, {
    retry: 2,
    retryDelay: 1500,
  });
  const createMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      refetch();
      setModalVisible(false);
      setNickname('');
      setRating(5);
      setSelectedChecks([]);
      setContent('');
      Alert.alert('감사합니다', '후기가 등록되었습니다 🌸');
    },
    onError: () => {
      Alert.alert('오류', '후기 등록에 실패했습니다. 다시 시도해 주세요.');
    },
  });

  const toggleCheck = (item: string) => {
    setSelectedChecks(prev =>
      prev.includes(item) ? prev.filter(c => c !== item) : [...prev, item]
    );
  };

  const handleSubmit = () => {
    if (!nickname.trim()) {
      Alert.alert('알림', '닉네임을 입력해 주세요.');
      return;
    }
    // 체크 항목 또는 자유 입력 중 하나 이상 필요
    if (selectedChecks.length === 0 && !content.trim()) {
      Alert.alert('알림', '체크 항목을 선택하거나 후기를 입력해 주세요.');
      return;
    }
    createMutation.mutate({
      nickname: nickname.trim(),
      rating,
      checkItems: selectedChecks.length > 0 ? selectedChecks.join(',') : undefined,
      content: content.trim() || undefined,
    });
  };

  const formatDate = (d: Date | string) => {
    const date = new Date(d);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

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

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>후기를 불러오는 중...</Text>
        </View>
      ) : isError ? (
        <View style={styles.loadingBox}>
          <Text style={{ fontSize: 36 }}>🌸</Text>
          <Text style={[styles.loadingText, { color: colors.muted, textAlign: 'center', lineHeight: 22 }]}>
            {'후기를 불러오지 못했습니다.\n잠시 후 다시 시도해 주세요.'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.writeButton, { backgroundColor: colors.primary, marginTop: 8 }]}
            onPress={() => refetch()}
          >
            <Text style={styles.writeButtonText}>다시 불러오기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reviews ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🌸</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                아직 후기가 없습니다.{'\n'}첫 번째 후기를 남겨보세요!
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const checks = item.checkItems ? item.checkItems.split(',').filter(Boolean) : [];
            return (
              <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewNickname, { color: colors.foreground }]}>{item.nickname}</Text>
                  <Text style={[styles.reviewDate, { color: colors.muted }]}>{formatDate(item.createdAt)}</Text>
                </View>
                <StarRating rating={item.rating} />
                {item.colorCombo ? (
                  <Text style={[styles.reviewCombo, { color: colors.primary }]}>🎨 {item.colorCombo}</Text>
                ) : null}
                {checks.length > 0 && (
                  <View style={styles.checkTagRow}>
                    {checks.map((c, idx) => (
                      <View key={idx} style={[styles.checkTag, { backgroundColor: colors.background, borderColor: colors.primary }]}>
                        <Text style={[styles.checkTagText, { color: colors.primary }]}>✓ {c}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {item.content ? (
                  <Text style={[styles.reviewContent, { color: colors.foreground }]}>{item.content}</Text>
                ) : null}
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
          <View style={[styles.modalBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>후기 남기기</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalClose, { color: colors.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* 닉네임 */}
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

              {/* 별점 */}
              <Text style={[styles.inputLabel, { color: colors.muted, marginTop: 12 }]}>별점</Text>
              <StarRating rating={rating} onRate={setRating} />

              {/* 체크형 후기 */}
              <Text style={[styles.inputLabel, { color: colors.muted, marginTop: 12 }]}>
                어떤 점이 좋으셨나요? <Text style={{ color: colors.primary }}>(복수 선택 가능)</Text>
              </Text>
              <View style={styles.checkList}>
                {CHECK_ITEMS.map((item) => {
                  const checked = selectedChecks.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      activeOpacity={0.7}
                      style={[
                        styles.checkRow,
                        {
                          backgroundColor: checked ? colors.primary + '18' : colors.surface,
                          borderColor: checked ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => toggleCheck(item)}
                    >
                      <View style={[styles.checkbox, { borderColor: checked ? colors.primary : colors.muted, backgroundColor: checked ? colors.primary : 'transparent' }]}>
                        {checked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={[styles.checkLabel, { color: checked ? colors.primary : colors.foreground }]}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 자유 입력 (선택사항) */}
              <Text style={[styles.inputLabel, { color: colors.muted, marginTop: 12 }]}>
                추가로 남기고 싶은 말 <Text style={{ color: colors.muted, fontWeight: '400' }}>(선택)</Text>
              </Text>
              <TextInput
                style={[styles.textArea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
                placeholder="자유롭게 남겨주세요"
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
          </View>
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
    alignItems: 'center',
  },
  reviewNickname: {
    fontSize: 15,
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 12,
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
  reviewContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  checkTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  checkTag: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  checkTagText: {
    fontSize: 12,
    fontWeight: '500',
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
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  checkList: {
    gap: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  checkLabel: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    height: 90,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
