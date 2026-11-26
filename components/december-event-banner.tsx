import { Pressable, StyleSheet, Text, View } from "react-native";

export type DecemberProductCode =
  | "personal_deep"
  | "couple_love_deep"
  | "parent_child_deep";

export type DecemberCouponOffer = {
  productCode: DecemberProductCode;
  name: string;
  couponCode: string;
  listAmountKrw: number;
  finalAmountKrw: number;
  discountType: "fixed" | "percent";
  discountValue: number;
  state: "available" | "issued" | "reserved" | "used" | "expired";
};

export type DecemberEventStatus = {
  active: boolean;
  serverNow: Date;
  startsAt: Date;
  endsAt: Date;
  offers: DecemberCouponOffer[];
};

/** Event visibility and prices are server-authoritative, never device-date based. */
export function getActiveDecemberOffer(
  status: DecemberEventStatus | undefined,
  productCode: DecemberProductCode,
): DecemberCouponOffer | undefined {
  if (status?.active !== true) return undefined;
  return status.offers.find((offer) => offer.productCode === productCode);
}

export function formatDecemberKrw(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export const DECEMBER_COUPON_STATE_LABELS: Record<
  DecemberCouponOffer["state"],
  string
> = {
  available: "발급 가능",
  issued: "발급 완료",
  reserved: "결제 예약 중",
  used: "사용 완료",
  expired: "기간 만료",
};

/** Reused by product cards; only pass an offer from an active server response. */
export function DecemberOfferPrice({ offer }: { offer: DecemberCouponOffer }) {
  return (
    <View style={styles.priceGroup}>
      <Text style={styles.listPrice}>정가 {formatDecemberKrw(offer.listAmountKrw)}</Text>
      <Text style={styles.finalPrice}>{formatDecemberKrw(offer.finalAmountKrw)}</Text>
      <Text style={styles.priceNote}>로그인 쿠폰 적용 시</Text>
    </View>
  );
}

export function DecemberEventBanner({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  if (active !== true) return null;

  return (
    <View style={styles.banner} testID="december-event-banner">
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>12월 연말 감사 이벤트</Text>
        <Text style={styles.period}>12.01 ~ 12.31</Text>
      </View>
      <View style={styles.message}>
        <Text style={styles.messageLine}>한 해 동안 애써온 나에게,</Text>
        <Text style={styles.messageLine}>소중한 우리 가족에게,</Text>
        <Text style={styles.messageFinal}>마음을 이해하는 시간을 선물하세요.</Text>
      </View>
      <View style={styles.benefits}>
        <Text style={styles.personalBenefit}>개인 심화 리포트 9,900원 파격 특가</Text>
        <Text style={styles.relationshipBenefit}>부부·연인 / 부모·자녀 관계 리포트 60% 할인</Text>
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="할인 쿠폰 받기"
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        testID="december-event-cta"
      >
        <Text style={styles.ctaText}>할인 쿠폰 받기</Text>
        <Text style={styles.ctaArrow} accessible={false}>→</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D8C5A1",
    backgroundColor: "#FFF9EE",
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 14,
  },
  heading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 6 },
  eyebrow: { color: "#786044", fontSize: 15, lineHeight: 22, fontWeight: "800" },
  period: { color: "#796E5E", fontSize: 12, lineHeight: 18, fontWeight: "600" },
  message: { gap: 2 },
  messageLine: { color: "#61584B", fontSize: 14, lineHeight: 21 },
  messageFinal: { color: "#3F5948", fontSize: 15, lineHeight: 23, fontWeight: "700" },
  benefits: { paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E5D9C3", gap: 6 },
  personalBenefit: { color: "#705330", fontSize: 16, lineHeight: 24, fontWeight: "800" },
  relationshipBenefit: { color: "#526A55", fontSize: 13, lineHeight: 20, fontWeight: "700" },
  cta: { minHeight: 48, borderRadius: 12, backgroundColor: "#526E59", paddingHorizontal: 18, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  ctaText: { color: "#FFFDF6", fontSize: 15, lineHeight: 22, fontWeight: "800" },
  ctaArrow: { color: "#E5D6B7", fontSize: 20, lineHeight: 24 },
  pressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  priceGroup: { alignItems: "flex-end", gap: 2, flexShrink: 0 },
  listPrice: { color: "#827461", fontSize: 11, lineHeight: 17, fontWeight: "600", textDecorationLine: "line-through" },
  finalPrice: { color: "#705330", fontSize: 19, lineHeight: 25, fontWeight: "800" },
  priceNote: { color: "#536C58", fontSize: 10, lineHeight: 16, fontWeight: "600" },
});
