import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type PaymentRecord = {
  id: number;
  senderName: string;
  contact: string;
  depositorName: string;
  amount: number;
  status: "pending" | "confirmed" | "rejected";
  memo: string | null;
  createdAt: Date | string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "확인 대기",
  confirmed: "입금 확인",
  rejected: "반려",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#22C55E",
  rejected: "#EF4444",
};

export default function AdminScreen() {
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [memoInputs, setMemoInputs] = useState<Record<number, string>>({});

  const { data: payments, refetch } = trpc.payments.list.useQuery(undefined, {
    retry: false,
  });

  const updateStatus = trpc.payments.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleUpdateStatus = (id: number, status: "pending" | "confirmed" | "rejected") => {
    const label = STATUS_LABEL[status];
    Alert.alert(
      "상태 변경",
      `이 입금 기록을 "${label}"으로 변경하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "확인",
          onPress: () => {
            updateStatus.mutate({
              id,
              status,
              memo: memoInputs[id] || undefined,
            });
          },
        },
      ]
    );
  };

  const formatDate = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            🌿 입금 확인 관리
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            아래로 당겨서 새로고침
          </Text>
        </View>

        {/* 통계 */}
        {payments && (
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: colors.foreground }]}>
                {payments.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>전체</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: "#F59E0B" }]}>
                {payments.filter((p: PaymentRecord) => p.status === "pending").length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>대기</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: "#22C55E" }]}>
                {payments.filter((p: PaymentRecord) => p.status === "confirmed").length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>확인</Text>
            </View>
          </View>
        )}

        {/* 목록 */}
        {!payments ? (
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            로그인 후 관리자 화면을 이용할 수 있습니다
          </Text>
        ) : payments.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            입금 기록이 없습니다
          </Text>
        ) : (
          payments.map((p: PaymentRecord) => (
            <View
              key={p.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {/* 상태 배지 + 날짜 */}
              <View style={styles.cardTopRow}>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[p.status] + "22" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[p.status] }]}>
                    {STATUS_LABEL[p.status]}
                  </Text>
                </View>
                <Text style={[styles.dateText, { color: colors.muted }]}>
                  {formatDate(p.createdAt)}
                </Text>
              </View>

              {/* 정보 */}
              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoKey, { color: colors.muted }]}>이름</Text>
                  <Text style={[styles.infoVal, { color: colors.foreground }]}>{p.senderName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoKey, { color: colors.muted }]}>연락처</Text>
                  <Text style={[styles.infoVal, { color: colors.foreground }]}>{p.contact}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoKey, { color: colors.muted }]}>입금자명</Text>
                  <Text style={[styles.infoVal, { color: colors.foreground }]}>{p.depositorName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoKey, { color: colors.muted }]}>금액</Text>
                  <Text style={[styles.infoVal, { color: colors.foreground }]}>
                    {p.amount.toLocaleString()}원
                  </Text>
                </View>
                {p.memo && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoKey, { color: colors.muted }]}>메모</Text>
                    <Text style={[styles.infoVal, { color: colors.foreground }]}>{p.memo}</Text>
                  </View>
                )}
              </View>

              {/* 메모 입력 */}
              <TextInput
                style={[styles.memoInput, {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                }]}
                placeholder="메모 (선택)"
                placeholderTextColor={colors.muted}
                value={memoInputs[p.id] ?? p.memo ?? ""}
                onChangeText={(t) => setMemoInputs(prev => ({ ...prev, [p.id]: t }))}
                maxLength={200}
              />

              {/* 상태 변경 버튼 */}
              <View style={styles.actionRow}>
                {p.status !== "confirmed" && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#22C55E22", borderColor: "#22C55E" }]}
                    onPress={() => handleUpdateStatus(p.id, "confirmed")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.actionBtnText, { color: "#22C55E" }]}>✓ 입금 확인</Text>
                  </TouchableOpacity>
                )}
                {p.status !== "rejected" && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#EF444422", borderColor: "#EF4444" }]}
                    onPress={() => handleUpdateStatus(p.id, "rejected")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>✕ 반려</Text>
                  </TouchableOpacity>
                )}
                {p.status !== "pending" && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#F59E0B22", borderColor: "#F59E0B" }]}
                    onPress={() => handleUpdateStatus(p.id, "pending")}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.actionBtnText, { color: "#F59E0B" }]}>↩ 대기로</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
    gap: 16,
  },
  header: {
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  statNum: {
    fontSize: 22,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  dateText: {
    fontSize: 12,
  },
  infoGrid: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    gap: 8,
  },
  infoKey: {
    fontSize: 13,
    width: 64,
    flexShrink: 0,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  memoInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
