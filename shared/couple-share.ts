import type {
  ArchetypeResult,
  CoupleAnalysis,
  CoupleSessionData,
  LightArchetypeResult,
  PersonAnalysis,
} from "../constants/coupleData";
import type { RomanticRelationTrait } from "../lib/couple-romantic-relation-traits";
import type { RomanticRelationshipRoles } from "../lib/couple-romantic-relationship-roles";

/** 링크로 다시 열어도 공유 시점의 결과를 동일하게 보여주기 위한 불변 스냅샷입니다. */
export type CoupleShareSnapshot = {
  schemaVersion: 1;
  sessionData: CoupleSessionData;
  personAAnalysis: PersonAnalysis;
  personBAnalysis: PersonAnalysis;
  coupleAnalysis: CoupleAnalysis;
  archetypeResult: ArchetypeResult;
  lightArchetypeResult: LightArchetypeResult | null;
  romanticRelationTraits: RomanticRelationTrait[];
  romanticRelationshipRoles: RomanticRelationshipRoles | null;
  personAIntegratedAnalysis: string;
  personBIntegratedAnalysis: string;
  createdAt: string;
};

const RELATION_TYPES = new Set([
  "연인", "부부", "친구", "부모-자녀", "아빠-아들", "아빠-딸", "엄마-아들", "엄마-딸", "형제자매", "동료",
]);

/**
 * 공유 요청 중 새 관계 결과로 바뀌었는지 판별하기 위한 현재 입력의 안정적인 서명입니다.
 * shareId를 담지 않아 이전 공유 링크가 다음 요청의 키가 되는 일을 막습니다.
 */
export function getCoupleShareSessionSignature(sessionData: CoupleSessionData): string {
  return JSON.stringify({
    relationType: sessionData.relationType,
    personA: {
      info: sessionData.personA.info,
      colors: sessionData.personA.colors,
      cards: sessionData.personA.cards,
    },
    personB: {
      info: sessionData.personB.info,
      colors: sessionData.personB.colors,
      cards: sessionData.personB.cards,
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPersonSession(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.info)) return false;
  return Array.isArray(value.colors)
    && Array.isArray(value.cards)
    && value.colors.length === 3
    && value.cards.length === 3
    && value.colors.every((item) => typeof item === "string" && item.length <= 64)
    && value.cards.every((item) => typeof item === "string" && item.length <= 64);
}

/** 저장 전 최소 구조를 확인해 잘못된 외부 요청이 공유 화면으로 들어오는 것을 막습니다. */
export function isCoupleShareSnapshot(value: unknown): value is CoupleShareSnapshot {
  if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.sessionData)) return false;
  const session = value.sessionData;

  return typeof session.relationType === "string"
    && RELATION_TYPES.has(session.relationType)
    && isPersonSession(session.personA)
    && isPersonSession(session.personB)
    && isRecord(value.personAAnalysis)
    && isRecord(value.personBAnalysis)
    && isRecord(value.coupleAnalysis)
    && isRecord(value.archetypeResult)
    && (value.lightArchetypeResult === null || isRecord(value.lightArchetypeResult))
    && Array.isArray(value.romanticRelationTraits)
    && (value.romanticRelationshipRoles === null || isRecord(value.romanticRelationshipRoles))
    && typeof value.personAIntegratedAnalysis === "string"
    && typeof value.personBIntegratedAnalysis === "string"
    && typeof value.createdAt === "string";
}

export function parseCoupleShareSnapshot(serialized: string): CoupleShareSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(serialized);
    return isCoupleShareSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
