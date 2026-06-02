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
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';

const STAR_COUNT = 5;

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
  const [content, setContent] = useState('');

  const { data: reviews, isLoading, refetch } = trpc.reviews.list.useQuery();
  const createMutation = trpc.reviews.create.useMutation({
    onSuccess: () => {
      refetch();
      setModalVisible(false);
      setNickname('');
      setRating(5);
      setContent('');
      Alert.alert('감사합니다', '후기가 등록되었습니다 🌸');
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
    createMutation.mutate({ nickname: nickname.trim(), rating, content: content.trim() });
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
          renderItem={({ item }) => (
            <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewNickname, { color: colors.foreground }]}>{item.nickname}</Text>
                <Text style={[styles.reviewDate, { color: colors.muted }]}>{formatDate(item.createdAt)}</Text>
              </View>
              <StarRating rating={item.rating} />
              {item.colorCombo ? (
                <Text style={[styles.reviewCombo, { color: colors.primary }]}>🎨 {item.colorCombo}</Text>
              ) : null}
              <Text style={[styles.reviewContent, { color: colors.foreground }]}>{item.content}</Text>
            </View>
          )}
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

            <Text style={[styles.inputLabel, { color: colors.muted }]}>별점</Text>
            <StarRating rating={rating} onRate={setRating} />

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
    gap: 10,
    paddingBottom: 40,
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
