import type { CoupleSessionData } from "../constants/coupleData";

/**
 * 부부·연인 생활 장면 문맥을 비교하기 위한 개발 전용 고정 입력입니다.
 * URL의 QA 파라미터와 development runtime이 함께 충족될 때만 결과 화면에서 읽습니다.
 * AsyncStorage, 결과 공유, 결제, 주문, 초대 링크 및 운영 DB에는 쓰지 않습니다.
 */
export const COUPLE_LOVER_CONTEXT_REVIEW_QUERY = "couple-lover-context-review-20261007";

export type CoupleLoverContextReviewSample = "marriage" | "lover";

const SHARED_COLORS_A = ["red", "blue", "green"] as const;
const SHARED_COLORS_B = ["pink", "indigo", "yellow"] as const;
const SHARED_CARDS_A = ["red_circle", "red_triangle", "red_inverted_triangle"] as const;
const SHARED_CARDS_B = ["orange_square", "orange_diamond", "orange_pentagon"] as const;

const buildReviewSession = (
  relationType: "부부" | "연인",
  roleA: "남편" | "남자친구",
  roleB: "아내" | "여자친구",
): CoupleSessionData => ({
  relationType,
  personA: {
    info: { gender: "남성", faith: "무교", relationshipRole: roleA },
    colors: [...SHARED_COLORS_A],
    cards: [...SHARED_CARDS_A],
  },
  personB: {
    info: { gender: "여성", faith: "기독교", relationshipRole: roleB },
    colors: [...SHARED_COLORS_B],
    cards: [...SHARED_CARDS_B],
  },
});

export const COUPLE_LOVER_CONTEXT_REVIEW_SESSIONS: Record<CoupleLoverContextReviewSample, CoupleSessionData> = {
  marriage: buildReviewSession("부부", "남편", "아내"),
  lover: buildReviewSession("연인", "남자친구", "여자친구"),
};

export function getCoupleLoverContextReviewSession(
  sample: string | undefined,
): CoupleSessionData | null {
  if (sample !== "marriage" && sample !== "lover") return null;
  return COUPLE_LOVER_CONTEXT_REVIEW_SESSIONS[sample];
}
