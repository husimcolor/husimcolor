import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, inArray, or } from "drizzle-orm";

import {
  analysisRuns,
  emailOutbox,
  entitlements,
  orderItems,
  orders,
  privateDocuments,
  products,
  relationshipParticipants,
  relationshipSessions,
} from "../../drizzle/schema";
import { CARD_DATA } from "../../constants/cardData";
import { COLOR_DATA, COLOR_ROLE_CONTENT } from "../../constants/colorData";
import {
  generateCoupleAnalysis,
  generatePersonAnalysis,
  getLightArchetype,
  isRelationshipRoleForGender,
  isRelationshipRolePairValid,
  resolveRoleBasedRelationType,
  getRelationArchetype,
  type CoupleSessionData,
  type PersonSession,
  type RelationshipRole,
  type RelationType,
} from "../../constants/coupleData";
import { buildCoupleColorCardIntegratedAnalysis, buildRomanticCoupleColorCardIntegratedAnalysis } from "../../lib/couple-color-card-analysis";
import { buildCouplePdfDownloadPayload } from "../../lib/couple-pdf-download";
import { buildParentChildRelationshipAnalysis } from "../../lib/parent-child-relationship-analysis";
import { getParentChildLabels } from "../../lib/parent-child-coaching";
import { buildParentChildPdfDownloadPayload } from "../../lib/parent-child-pdf-download";
import { buildRomanticRelationTraits } from "../../lib/couple-romantic-relation-traits";
import { buildRomanticRelationshipRoles } from "../../lib/couple-romantic-relationship-roles";
import { parseCoupleShareSnapshot, type CoupleShareSnapshot } from "../../shared/couple-share";
import type { CommerceProductCode } from "../../shared/commerce";
import { getDb } from "../db";
import { decryptCommerceValue, encryptCommerceValue, hashCommerceValue } from "./crypto";
import { deliverPrivatePdfOutboxItem } from "./email-outbox-service";
import { queuePrivateAnalysisPdfDelivery } from "./pdf-delivery-service";
import { isExplicitTestPaymentRuntime } from "./test-runtime";

export type RelationshipParticipantSlot = "A" | "B";
export type RelationshipInviteMode = "invite_link";
type SessionStatus = "collecting" | "awaiting_partner" | "report_generating" | "email_pending" | "completed" | "failed";

export type RelationshipParticipantPayload = {
  info: PersonSession["info"] & { relationshipRole: RelationshipRole };
  colors: string[];
  cards: string[];
};

export type RelationshipInviteStart = {
  relationshipSessionId: number;
  ownerAccessToken: string;
  inviteToken: string;
  resultToken: string;
};

export type RelationshipInviteContext = {
  relationshipSessionId: number;
  relationType: RelationType;
  participant: RelationshipParticipantSlot;
  status: SessionStatus;
  participantStatus: "not_started" | "in_progress" | "submitted";
  partnerStatus: "not_started" | "in_progress" | "submitted";
  partnerRole: RelationshipRole | null;
  consentAccepted: boolean;
  canEdit: boolean;
  draftRevision: number;
  draft: Partial<RelationshipParticipantPayload> | null;
  completedMessage: string | null;
};

const RELATION_TYPES = new Set<RelationType>([
  "연인", "부부", "친구", "부모-자녀", "아빠-아들", "아빠-딸", "엄마-아들", "엄마-딸", "형제자매", "동료",
]);
const PAID_RELATION_PRODUCTS = new Set<CommerceProductCode>(["couple_love_deep", "parent_child_deep"]);
const EDITABLE_STATUSES = new Set<SessionStatus>(["collecting", "awaiting_partner"]);

function isAuthorizedPreviewRecoveryKey(value: string): boolean {
  const expected = process.env.PREVIEW_RELATIONSHIP_RECOVERY_KEY;
  if (!expected || !value || Buffer.byteLength(expected, "utf8") !== Buffer.byteLength(value, "utf8")) return false;
  return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(value, "utf8"));
}

function secureToken(): string {
  return randomBytes(32).toString("base64url");
}

function requiredToken(value: string): string {
  if (!value || value.length < 32 || value.length > 256) throw new Error("INVALID_RELATIONSHIP_ACCESS_TOKEN");
  return value;
}

function parseStoredPayload(value: string | null): Partial<RelationshipParticipantPayload> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decryptCommerceValue(value)) as unknown;
    return parsed && typeof parsed === "object" ? parsed as Partial<RelationshipParticipantPayload> : null;
  } catch {
    throw new Error("RELATIONSHIP_PARTICIPANT_DATA_UNREADABLE");
  }
}

function parseSubmittedPayload(value: string | null): RelationshipParticipantPayload {
  const parsed = parseStoredPayload(value);
  if (!isCompleteParticipantPayload(parsed)) throw new Error("RELATIONSHIP_PARTICIPANT_SUBMISSION_INVALID");
  return parsed;
}

function isCompleteParticipantPayload(value: Partial<RelationshipParticipantPayload> | null | undefined): value is RelationshipParticipantPayload {
  if (!value || !value.info || !Array.isArray(value.colors) || !Array.isArray(value.cards)) return false;
  const gender = value.info.gender;
  const faith = value.info.faith;
  const relationshipRole = value.info.relationshipRole;
  return (gender === "남성" || gender === "여성")
    && (faith === "기독교" || faith === "무교" || faith === "기타")
    && (relationshipRole === "남편" || relationshipRole === "아내" || relationshipRole === "남자친구" || relationshipRole === "여자친구" || relationshipRole === "아빠" || relationshipRole === "엄마" || relationshipRole === "아들" || relationshipRole === "딸")
    && isRelationshipRoleForGender(relationshipRole, gender)
    && value.colors.length === 3
    && value.cards.length === 3
    && value.colors.every((item) => typeof item === "string" && COLOR_DATA.some((color) => color.id === item))
    && value.cards.every((item) => typeof item === "string" && CARD_DATA.some((card) => card.id === item));
}

function asSessionData(relationType: RelationType, personA: RelationshipParticipantPayload, personB: RelationshipParticipantPayload): CoupleSessionData {
  return {
    relationType,
    personA: { info: personA.info, colors: personA.colors, cards: personA.cards },
    personB: { info: personB.info, colors: personB.colors, cards: personB.cards },
  };
}

function calculateArchetype(sessionData: CoupleSessionData) {
  const familyMap: Record<string, string> = {
    red: "warm_active", orange: "warm_active", coral: "warm_active", magenta: "warm_active",
    pink: "warm_soft", peach: "warm_soft", beige: "warm_soft", cream: "warm_soft",
    gold: "warm_grounded", brown: "warm_grounded", terracotta: "warm_grounded",
    blue: "cool_clear", skyblue: "cool_clear", teal: "cool_clear", mint: "cool_clear",
    indigo: "cool_deep", violet: "cool_deep", black: "cool_deep", silver: "cool_deep", navy: "cool_deep",
    green: "nature", olive: "nature", sage: "nature", lavender: "nature",
    white: "neutral", yellow: "neutral",
  };
  const familiesA = sessionData.personA.colors.map((id) => familyMap[id] ?? "neutral") as any[];
  const familiesB = sessionData.personB.colors.map((id) => familyMap[id] ?? "neutral") as any[];
  const shapeA3 = sessionData.personA.cards[2] ? CARD_DATA.find((card) => card.id === sessionData.personA.cards[2])?.shape : undefined;
  const shapeB3 = sessionData.personB.cards[2] ? CARD_DATA.find((card) => card.id === sessionData.personB.cards[2])?.shape : undefined;
  return {
    archetypeResult: getRelationArchetype(
      familiesA,
      familiesB,
      shapeA3,
      shapeB3,
      sessionData.personA.colors,
      sessionData.personB.colors,
      sessionData.personA.cards,
      sessionData.personB.cards,
    ),
    lightArchetypeResult: getLightArchetype(sessionData.relationType, familiesA, familiesB),
  };
}

/** 기존 결과 화면과 동일한 분석 모듈을 재사용해 고정 결과를 만든다. */
function buildResultSnapshot(sessionData: CoupleSessionData): CoupleShareSnapshot {
  const personAAnalysis = generatePersonAnalysis(sessionData.personA, "A");
  const personBAnalysis = generatePersonAnalysis(sessionData.personB, "B");
  const coupleAnalysis = generateCoupleAnalysis(sessionData, personAAnalysis, personBAnalysis);
  const { archetypeResult, lightArchetypeResult } = calculateArchetype(sessionData);
  const colorsA = sessionData.personA.colors.map((id) => COLOR_DATA.find((color) => color.id === id)).filter(Boolean);
  const colorsB = sessionData.personB.colors.map((id) => COLOR_DATA.find((color) => color.id === id)).filter(Boolean);
  const cardsA = sessionData.personA.cards.map((id) => CARD_DATA.find((card) => card.id === id)).filter(Boolean);
  const cardsB = sessionData.personB.cards.map((id) => CARD_DATA.find((card) => card.id === id)).filter(Boolean);
  const definedColorsA = colorsA.filter((color): color is NonNullable<typeof color> => Boolean(color));
  const definedColorsB = colorsB.filter((color): color is NonNullable<typeof color> => Boolean(color));
  const definedCardsA = cardsA.filter((card): card is NonNullable<typeof card> => Boolean(card));
  const definedCardsB = cardsB.filter((card): card is NonNullable<typeof card> => Boolean(card));
  const isRomantic = sessionData.relationType === "연인" || sessionData.relationType === "부부";
  const romanticRelationTraits = isRomantic
    ? buildRomanticRelationTraits({
        personA: personAAnalysis,
        personB: personBAnalysis,
        cardsA: definedCardsA,
        cardsB: definedCardsB,
        expressionDescription: archetypeResult.expressionSpeed.description,
        recoveryDescription: archetypeResult.recoveryStyle.description,
      })
    : [];
  const romanticRelationshipRoles = isRomantic
    ? buildRomanticRelationshipRoles({ personA: personAAnalysis, personB: personBAnalysis, cardsA: definedCardsA, cardsB: definedCardsB })
    : null;

  return {
    schemaVersion: 1,
    sessionData,
    personAAnalysis,
    personBAnalysis,
    coupleAnalysis,
    archetypeResult,
    lightArchetypeResult,
    romanticRelationTraits,
    romanticRelationshipRoles,
    personAIntegratedAnalysis: isRomantic
      ? buildRomanticCoupleColorCardIntegratedAnalysis(definedColorsA, definedCardsA)
      : buildCoupleColorCardIntegratedAnalysis(definedColorsA, definedCardsA),
    personBIntegratedAnalysis: isRomantic
      ? buildRomanticCoupleColorCardIntegratedAnalysis(definedColorsB, definedCardsB)
      : buildCoupleColorCardIntegratedAnalysis(definedColorsB, definedCardsB),
    createdAt: new Date().toISOString(),
  };
}

function getPdfColorRows(selectedColors: string[]) {
  return selectedColors
    .map((id) => COLOR_DATA.find((color) => color.id === id))
    .filter((color): color is NonNullable<typeof color> => Boolean(color))
    .slice(0, 3)
    .map((color, index) => {
      const content = COLOR_ROLE_CONTENT[color.id];
      const role = index === 0 ? "주기질" : index === 1 ? "보조기질" : "회복 방향";
      return {
        role,
        name: color.korName,
        hex: color.hex,
        keywords: color.keywords.slice(0, 3).join(" · "),
        interpretation: index === 0 ? content?.primaryTrait : index === 1 ? content?.secondaryTrait : content?.recoveryDirection ?? color.recovery,
      };
    });
}

function getPdfCardRows(selectedCards: string[]) {
  return selectedCards
    .map((id) => CARD_DATA.find((card) => card.id === id))
    .filter((card): card is NonNullable<typeof card> => Boolean(card))
    .slice(0, 3)
    .map((card, index) => ({
      position: index === 0 ? "1번 카드 · 무의식" : index === 1 ? "2번 카드 · 현재 흐름" : "3번 카드 · 다음 방향",
      colorName: card.colorKor,
      shapeName: card.shapeKor,
      colorHex: card.colorHex,
      shape: card.shape,
      title: card.energyTitle,
      narrative: index === 0 ? card.psychologyFlow : index === 1 ? card.personalityFlow : card.recoveryDirection,
    }));
}

async function buildDeliveryPayload(snapshot: CoupleShareSnapshot, productCode: "couple_love_deep" | "parent_child_deep") {
  const { sessionData, personAAnalysis, personBAnalysis, coupleAnalysis, archetypeResult } = snapshot;
  const { personA, personB, relationType } = sessionData;
  const personLabels = {
    personA: personA.info.relationshipRole ?? "첫 번째 사람",
    personB: personB.info.relationshipRole ?? "두 번째 사람",
  };
  if (productCode === "couple_love_deep") {
    if (relationType !== "연인" && relationType !== "부부") {
      throw new Error("RELATIONSHIP_REPORT_TYPE_PRODUCT_MISMATCH");
    }
    const roles = snapshot.romanticRelationshipRoles;
    const unified = archetypeResult.unifiedSections;
    if (!roles || !unified) throw new Error("RELATIONSHIP_ROMANTIC_REPORT_DATA_INVALID");
    const hasFaith = personA.info.faith === "기독교" || personB.info.faith === "기독교";
    const recommendedColors = archetypeResult.recommendedColors ?? coupleAnalysis.coupleRoutine.recommendedColors;
    return buildCouplePdfDownloadPayload({
      relationType,
      couple: {
        typeName: archetypeResult.typeName,
        coreSummary: archetypeResult.coreSummary,
        tensionDescription: archetypeResult.tensionDescription,
      },
      personA: {
        label: personLabels.personA,
        colors: getPdfColorRows(personA.colors),
        cards: getPdfCardRows(personA.cards),
        integratedAnalysis: snapshot.personAIntegratedAnalysis,
        relationshipStyle: personAAnalysis.relationshipStyle,
        emotionExpression: personAAnalysis.emotionExpression,
        complementColor: { name: personAAnalysis.complementColor.korName, hex: personAAnalysis.complementColor.hex, meaning: personAAnalysis.complementColor.meaning },
        coachingMessage: personAAnalysis.coachingMessage,
      },
      personB: {
        label: personLabels.personB,
        colors: getPdfColorRows(personB.colors),
        cards: getPdfCardRows(personB.cards),
        integratedAnalysis: snapshot.personBIntegratedAnalysis,
        relationshipStyle: personBAnalysis.relationshipStyle,
        emotionExpression: personBAnalysis.emotionExpression,
        complementColor: { name: personBAnalysis.complementColor.korName, hex: personBAnalysis.complementColor.hex, meaning: personBAnalysis.complementColor.meaning },
        coachingMessage: personBAnalysis.coachingMessage,
      },
      relationship: {
        personLabels,
        attractionAnalysis: coupleAnalysis.profileContrast || archetypeResult.profileContrastOverride?.attractionContrast || archetypeResult.tensionDescription,
        roles: {
          personATitle: roles.personA.title,
          personADescription: roles.personA.description,
          personBTitle: roles.personB.title,
          personBDescription: roles.personB.description,
          together: roles.together,
        },
        core: unified.coreEnergy,
        lifePattern: unified.lifePattern,
        conflict: unified.conflictFlow,
        connection: {
          headline: unified.connectionFlow.headline,
          description: unified.connectionFlow.description,
          actions: unified.connectionFlow.actions,
          intimacyNote: unified.connectionFlow.skinshipNote,
        },
        growth: {
          strength: unified.growthPoint.strength,
          blindSpot: unified.growthPoint.blindSpot,
          direction: unified.growthPoint.growthDirection,
          tip: unified.growthPoint.tip,
        },
        recommendedColors: recommendedColors.map((color) => ({ name: color.korName, hex: color.hex, reason: color.reason })),
        togetherRoutine: {
          routines: archetypeResult.togetherRoutine.routines,
          energyNote: archetypeResult.togetherRoutine.energyNote,
          faithRoutine: hasFaith ? archetypeResult.togetherRoutine.faithRoutine : undefined,
        },
        basicPrinciples: "서로의 마음을 당연하게 여기지 않고, 감정과 필요를 차분히 확인하는 시간이 신뢰·이해·배려·존중을 함께 키워갈 수 있습니다.",
        closingMessage: archetypeResult.closingMessage ?? coupleAnalysis.closingMessage,
      },
    });
  }

  const isParentChildRelation = relationType === "부모-자녀"
    || relationType === "아빠-아들"
    || relationType === "아빠-딸"
    || relationType === "엄마-아들"
    || relationType === "엄마-딸";
  if (!isParentChildRelation) {
    throw new Error("RELATIONSHIP_REPORT_TYPE_PRODUCT_MISMATCH");
  }
  const isPersonAParent = personA.info.relationshipRole === "아빠" || personA.info.relationshipRole === "엄마";
  const parent = isPersonAParent ? personA : personB;
  const child = isPersonAParent ? personB : personA;
  const labels = getParentChildLabels(relationType, parent.info.gender, child.info.gender);
  const parentCards = parent.cards.map((id) => CARD_DATA.find((card) => card.id === id)).filter(Boolean);
  const childCards = child.cards.map((id) => CARD_DATA.find((card) => card.id === id)).filter(Boolean);
  const parentChild = buildParentChildRelationshipAnalysis({
    relationType,
    parentGender: parent.info.gender,
    childGender: child.info.gender,
    parent: { colors: parent.colors, cards: parentCards.filter((card): card is NonNullable<typeof card> => Boolean(card)) },
    child: { colors: child.colors, cards: childCards.filter((card): card is NonNullable<typeof card> => Boolean(card)) },
  });
  return buildParentChildPdfDownloadPayload({
    relationType,
      personA: {
        label: personA.info.relationshipRole ?? labels.parent,
      colors: getPdfColorRows(personA.colors),
      cards: getPdfCardRows(personA.cards),
      integratedAnalysis: snapshot.personAIntegratedAnalysis,
      relationshipStyle: personAAnalysis.relationshipStyle,
      emotionExpression: personAAnalysis.emotionExpression,
      complementColor: { name: personAAnalysis.complementColor.korName, hex: personAAnalysis.complementColor.hex, meaning: personAAnalysis.complementColor.meaning },
      coachingMessage: personAAnalysis.coachingMessage,
    },
      personB: {
        label: personB.info.relationshipRole ?? labels.child,
      colors: getPdfColorRows(personB.colors),
      cards: getPdfCardRows(personB.cards),
      integratedAnalysis: snapshot.personBIntegratedAnalysis,
      relationshipStyle: personBAnalysis.relationshipStyle,
      emotionExpression: personBAnalysis.emotionExpression,
      complementColor: { name: personBAnalysis.complementColor.korName, hex: personBAnalysis.complementColor.hex, meaning: personBAnalysis.complementColor.meaning },
      coachingMessage: personBAnalysis.coachingMessage,
    },
    relationship: {
      labels: parentChild.coaching.labels,
      typeName: parentChild.relationshipSummary.typeName,
      coreSummary: parentChild.relationshipSummary.coreSummary,
      description: parentChild.relationshipSummary.description,
      cardFlowSummary: `${labels.parent}의 현재 흐름 · ${parentCards[1]?.energyTitle ?? "현재 마음의 흐름"}\n${parentCards[1]?.personalityFlow ?? ""}\n\n${labels.child}의 현재 흐름 · ${childCards[1]?.energyTitle ?? "현재 마음의 흐름"}\n${childCards[1]?.personalityFlow ?? ""}`,
      socialRoles: parentChild.coaching.socialRoles,
      relationshipRoles: parentChild.coaching.relationshipRoles,
      childCommunication: parentChild.coaching.childCommunication,
      lifeScenes: {
        strengths: parentChild.lifeScenes.strengths.map(({ title, description }) => ({ title, description })),
        tensions: parentChild.lifeScenes.tensions.map(({ title, description }) => ({ title, description })),
      },
      dialogue: parentChild.coaching.dialogue,
      conflictRecovery: parentChild.coaching.conflictRecovery,
      recommendedColors: parentChild.relationshipSummary.recommendedColors.map((color) => ({ name: color.korName, hex: color.hex, reason: color.reason })),
      practices: parentChild.coaching.practices,
      closingMessage: parentChild.relationshipSummary.closingMessage,
    },
  });
}

export async function createRelationshipInviteSession(tx: any, input: {
  analysisRunId: number;
  entitlementId: number;
  orderId: number | null;
  productId: number;
  productCode: CommerceProductCode;
  relationType: RelationType;
}): Promise<RelationshipInviteStart> {
  const productAndRelationTypeMatch = input.productCode === "couple_love_deep"
    ? input.relationType === "연인" || input.relationType === "부부"
    : input.relationType === "부모-자녀" || input.relationType === "아빠-아들" || input.relationType === "아빠-딸" || input.relationType === "엄마-아들" || input.relationType === "엄마-딸";
  if (!PAID_RELATION_PRODUCTS.has(input.productCode) || !RELATION_TYPES.has(input.relationType) || !productAndRelationTypeMatch) {
    throw new Error("RELATIONSHIP_INVITE_PRODUCT_OR_TYPE_INVALID");
  }
  const ownerAccessToken = secureToken();
  const inviteToken = secureToken();
  const resultToken = secureToken();
  const insert = await tx.insert(relationshipSessions).values({
    sessionCode: `RS-${randomUUID().replace(/-/g, "").slice(0, 24).toUpperCase()}`,
    analysisRunId: input.analysisRunId,
    entitlementId: input.entitlementId,
    orderId: input.orderId,
    productId: input.productId,
    relationType: input.relationType,
    mode: "invite_link",
    ownerTokenHash: hashCommerceValue(ownerAccessToken),
    inviteTokenHash: hashCommerceValue(inviteToken),
    resultTokenHash: hashCommerceValue(resultToken),
  });
  const relationshipSessionId = Number(insert[0].insertId);
  await tx.insert(relationshipParticipants).values([
    { relationshipSessionId, participant: "A", status: "not_started" },
    { relationshipSessionId, participant: "B", status: "not_started" },
  ]);
  return { relationshipSessionId, ownerAccessToken, inviteToken, resultToken };
}

/**
 * Preview에서만, 제출 완료 뒤 PDF 생성에 실패한 테스트 세션의 접근 토큰을 새로 발급한다.
 * DB에는 토큰 원문을 저장하지 않으므로 기존 링크는 복원하지 않고 모두 교체한다.
 */
export async function createPreviewFailedRelationshipRecovery(input: {
  relationshipSessionId: number;
  recoveryKey: string;
}): Promise<RelationshipInviteStart> {
  if (process.env.VERCEL_ENV !== "preview" || process.env.COMMERCE_TEST_MODE !== "true" || !isAuthorizedPreviewRecoveryKey(input.recoveryKey)) {
    throw new Error("PREVIEW_RELATIONSHIP_RECOVERY_NOT_ALLOWED");
  }
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const rows = await db
    .select({ session: relationshipSessions })
    .from(relationshipSessions)
    .innerJoin(orders, eq(relationshipSessions.orderId, orders.id))
    .where(and(
      eq(relationshipSessions.id, input.relationshipSessionId),
      eq(relationshipSessions.status, "failed"),
      eq(orders.isTest, true),
      eq(orders.status, "paid"),
    ))
    .limit(1);
  const session = rows[0]?.session;
  if (!session) throw new Error("PREVIEW_RELATIONSHIP_RECOVERY_SESSION_NOT_FOUND");

  const participants = await db
    .select({ status: relationshipParticipants.status })
    .from(relationshipParticipants)
    .where(eq(relationshipParticipants.relationshipSessionId, session.id));
  if (participants.length !== 2 || participants.some((participant) => participant.status !== "submitted")) {
    throw new Error("PREVIEW_RELATIONSHIP_RECOVERY_SUBMISSIONS_INCOMPLETE");
  }

  const ownerAccessToken = secureToken();
  const inviteToken = secureToken();
  const resultToken = secureToken();
  const updated = await db
    .update(relationshipSessions)
    .set({
      ownerTokenHash: hashCommerceValue(ownerAccessToken),
      inviteTokenHash: hashCommerceValue(inviteToken),
      resultTokenHash: hashCommerceValue(resultToken),
    })
    .where(and(eq(relationshipSessions.id, session.id), eq(relationshipSessions.status, "failed")));
  if (Number(updated[0]?.affectedRows ?? 0) !== 1) throw new Error("PREVIEW_RELATIONSHIP_RECOVERY_CONFLICT");

  return { relationshipSessionId: session.id, ownerAccessToken, inviteToken, resultToken };
}

async function loadSessionByAccessToken(accessToken: string) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const tokenHash = hashCommerceValue(requiredToken(accessToken));
  const rows = await db
    .select()
    .from(relationshipSessions)
    .where(or(eq(relationshipSessions.ownerTokenHash, tokenHash), eq(relationshipSessions.inviteTokenHash, tokenHash)))
    .limit(1);
  const session = rows[0];
  if (!session) throw new Error("RELATIONSHIP_INVITE_NOT_FOUND");
  const participant: RelationshipParticipantSlot = session.ownerTokenHash === tokenHash ? "A" : "B";
  return { db, session, participant };
}

async function buildContext(sessionId: number, participant: RelationshipParticipantSlot, draftVisible: boolean): Promise<RelationshipInviteContext> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const sessionRows = await db.select().from(relationshipSessions).where(eq(relationshipSessions.id, sessionId)).limit(1);
  const session = sessionRows[0];
  if (!session) throw new Error("RELATIONSHIP_INVITE_NOT_FOUND");
  const participantRows = await db.select().from(relationshipParticipants).where(eq(relationshipParticipants.relationshipSessionId, sessionId));
  const current = participantRows.find((row) => row.participant === participant);
  const partner = participantRows.find((row) => row.participant !== participant);
  if (!current || !partner) throw new Error("RELATIONSHIP_PARTICIPANTS_NOT_FOUND");
  const status = session.status as SessionStatus;
  const partnerPayload = parseStoredPayload(partner.submittedEncrypted ?? partner.draftEncrypted);
  const partnerRole = partnerPayload?.info?.relationshipRole ?? null;
  return {
    relationshipSessionId: session.id,
    relationType: session.relationType as RelationType,
    participant,
    status,
    participantStatus: current.status,
    partnerStatus: partner.status,
    partnerRole,
    consentAccepted: current.consentAccepted,
    canEdit: EDITABLE_STATUSES.has(status) && current.status !== "submitted",
    draftRevision: current.draftRevision,
    draft: draftVisible && status !== "completed" ? parseStoredPayload(current.draftEncrypted) : null,
    completedMessage: status === "completed" ? "이미 완료된 검사입니다. 검사 결과가 정상적으로 생성되었습니다." : null,
  };
}

export async function getRelationshipInviteContext(accessToken: string): Promise<RelationshipInviteContext> {
  const { session, participant } = await loadSessionByAccessToken(accessToken);
  return buildContext(session.id, participant, true);
}

export async function saveRelationshipParticipantDraft(input: {
  accessToken: string;
  expectedRevision: number;
  draft: Partial<RelationshipParticipantPayload>;
  consentAccepted?: boolean;
}): Promise<RelationshipInviteContext> {
  const { db, session, participant } = await loadSessionByAccessToken(input.accessToken);
  const status = session.status as SessionStatus;
  if (!EDITABLE_STATUSES.has(status)) {
    throw new Error(status === "completed" ? "RELATIONSHIP_INVITE_COMPLETED" : "RELATIONSHIP_INVITE_LOCKED");
  }
  const rows = await db
    .select()
    .from(relationshipParticipants)
    .where(and(eq(relationshipParticipants.relationshipSessionId, session.id), eq(relationshipParticipants.participant, participant)))
    .limit(1);
  const current = rows[0];
  if (!current) throw new Error("RELATIONSHIP_PARTICIPANT_NOT_FOUND");
  if (current.status === "submitted") throw new Error("RELATIONSHIP_PARTICIPANT_ALREADY_SUBMITTED");
  if (current.draftRevision !== input.expectedRevision) throw new Error("RELATIONSHIP_DRAFT_REVISION_CONFLICT");

  const now = new Date();
  const claimed = await db
    .update(relationshipParticipants)
    .set({
      status: "in_progress",
      consentAccepted: input.consentAccepted ?? current.consentAccepted,
      consentAcceptedAt: input.consentAccepted && !current.consentAccepted ? now : current.consentAcceptedAt,
      draftEncrypted: encryptCommerceValue(JSON.stringify(input.draft)),
      draftRevision: current.draftRevision + 1,
      startedAt: current.startedAt ?? now,
    })
    .where(and(eq(relationshipParticipants.id, current.id), eq(relationshipParticipants.draftRevision, input.expectedRevision)));
  if (Number(claimed[0]?.affectedRows ?? 0) !== 1) throw new Error("RELATIONSHIP_DRAFT_REVISION_CONFLICT");
  return buildContext(session.id, participant, true);
}

export async function submitRelationshipParticipant(input: {
  accessToken: string;
  expectedRevision: number;
  submission: RelationshipParticipantPayload;
}): Promise<{ context: RelationshipInviteContext; shouldGenerateReport: boolean }> {
  if (!isCompleteParticipantPayload(input.submission)) throw new Error("RELATIONSHIP_PARTICIPANT_SUBMISSION_INVALID");
  const { db, session, participant } = await loadSessionByAccessToken(input.accessToken);
  const now = new Date();
  let shouldGenerateReport = false;

  await (db as any).transaction(async (tx: any) => {
    const sessionRows = await tx.select().from(relationshipSessions).where(eq(relationshipSessions.id, session.id)).limit(1);
    const currentSession = sessionRows[0];
    if (!currentSession) throw new Error("RELATIONSHIP_INVITE_NOT_FOUND");
    const currentStatus = currentSession.status as SessionStatus;
    if (!EDITABLE_STATUSES.has(currentStatus)) {
      throw new Error(currentStatus === "completed" ? "RELATIONSHIP_INVITE_COMPLETED" : "RELATIONSHIP_INVITE_LOCKED");
    }

    const participantRows = await tx
      .select()
      .from(relationshipParticipants)
      .where(and(eq(relationshipParticipants.relationshipSessionId, currentSession.id), eq(relationshipParticipants.participant, participant)))
      .limit(1);
    const currentParticipant = participantRows[0];
    if (!currentParticipant) throw new Error("RELATIONSHIP_PARTICIPANT_NOT_FOUND");
    if (currentParticipant.status === "submitted") throw new Error("RELATIONSHIP_PARTICIPANT_ALREADY_SUBMITTED");
    if (currentParticipant.draftRevision !== input.expectedRevision) throw new Error("RELATIONSHIP_DRAFT_REVISION_CONFLICT");
    const updated = await tx
      .update(relationshipParticipants)
      .set({
        status: "submitted",
        consentAccepted: true,
        consentAcceptedAt: currentParticipant.consentAcceptedAt ?? now,
        draftEncrypted: encryptCommerceValue(JSON.stringify(input.submission)),
        submittedEncrypted: encryptCommerceValue(JSON.stringify(input.submission)),
        draftRevision: currentParticipant.draftRevision + 1,
        startedAt: currentParticipant.startedAt ?? now,
        submittedAt: now,
      })
      .where(and(eq(relationshipParticipants.id, currentParticipant.id), eq(relationshipParticipants.draftRevision, input.expectedRevision)));
    if (Number(updated[0]?.affectedRows ?? 0) !== 1) throw new Error("RELATIONSHIP_DRAFT_REVISION_CONFLICT");

    const allParticipants = await tx
      .select({ participant: relationshipParticipants.participant, status: relationshipParticipants.status, submittedEncrypted: relationshipParticipants.submittedEncrypted })
      .from(relationshipParticipants)
      .where(eq(relationshipParticipants.relationshipSessionId, currentSession.id));
    const bothSubmitted = allParticipants.length === 2 && allParticipants.every((row: { status: string }) => row.status === "submitted");
    if (!bothSubmitted) {
      await tx
        .update(relationshipSessions)
        .set({ status: "awaiting_partner" })
        .where(and(eq(relationshipSessions.id, currentSession.id), inArray(relationshipSessions.status, ["collecting", "awaiting_partner"])));
      return;
    }
    const submittedA = parseSubmittedPayload(allParticipants.find((row: { participant: string }) => row.participant === "A")?.submittedEncrypted ?? null);
    const submittedB = parseSubmittedPayload(allParticipants.find((row: { participant: string }) => row.participant === "B")?.submittedEncrypted ?? null);
    if (!isRelationshipRolePairValid(currentSession.relationType as RelationType, submittedA.info.relationshipRole, submittedB.info.relationshipRole)) {
      throw new Error("RELATIONSHIP_ROLE_PAIR_INVALID");
    }
    const resolvedRelationType = resolveRoleBasedRelationType(
      currentSession.relationType as RelationType,
      submittedA.info.relationshipRole,
      submittedB.info.relationshipRole,
    );
    const claimed = await tx
      .update(relationshipSessions)
      .set({ status: "report_generating", relationType: resolvedRelationType, reportErrorCode: null })
      .where(and(eq(relationshipSessions.id, currentSession.id), inArray(relationshipSessions.status, ["collecting", "awaiting_partner"])));
    shouldGenerateReport = Number(claimed[0]?.affectedRows ?? 0) === 1;
  });

  // 두 브라우저가 거의 동시에 제출해 각 트랜잭션이 상대의 커밋 전 상태를 읽은 경우에도,
  // 커밋 뒤 한 번 더 compare-and-set으로 양측 제출 여부를 확인한다.
  if (!shouldGenerateReport) {
    shouldGenerateReport = await claimRelationshipReportGeneration(session.id);
  }
  return { context: await buildContext(session.id, participant, true), shouldGenerateReport };
}

/**
 * A failed document-delivery attempt must never make either participant redo a
 * submitted examination. This compare-and-set claims exactly one safe retry
 * after both encrypted submissions have already been persisted.
 */
export async function retryFailedRelationshipReport(accessToken: string): Promise<{
  relationshipSessionId: number;
  shouldGenerateReport: boolean;
}> {
  const { db, session } = await loadSessionByAccessToken(accessToken);
  const shouldGenerateReport = await (db as any).transaction(async (tx: any) => {
    const sessionRows = await tx
      .select({ status: relationshipSessions.status })
      .from(relationshipSessions)
      .where(eq(relationshipSessions.id, session.id))
      .limit(1);
    if (sessionRows[0]?.status !== "failed") return false;
    const participants = await tx
      .select({ status: relationshipParticipants.status })
      .from(relationshipParticipants)
      .where(eq(relationshipParticipants.relationshipSessionId, session.id));
    if (participants.length !== 2 || !participants.every((row: { status: string }) => row.status === "submitted")) return false;
    const claimed = await tx
      .update(relationshipSessions)
      .set({ status: "report_generating", reportErrorCode: null })
      .where(and(eq(relationshipSessions.id, session.id), eq(relationshipSessions.status, "failed")));
    return Number(claimed[0]?.affectedRows ?? 0) === 1;
  });
  return { relationshipSessionId: session.id, shouldGenerateReport };
}

/**
 * Preview 결제 QA에서만 결제자가 자신의 이미 생성된 관계 PDF outbox를 한 번 전달해
 * 이메일 완료 전이와 중복 발송 방지를 확인한다. Production과 비테스트 주문은 항상 차단한다.
 */
export async function deliverPreviewRelationshipReport(accessToken: string): Promise<{
  status: "sent" | "retry_scheduled" | "not_claimed";
  attemptCount?: number;
}> {
  if (!isExplicitTestPaymentRuntime() || process.env.VERCEL_ENV !== "preview") {
    throw new Error("PREVIEW_RELATIONSHIP_DELIVERY_DISABLED");
  }
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const ownerTokenHash = hashCommerceValue(requiredToken(accessToken));
  const sessions = await db
    .select({ id: relationshipSessions.id, analysisRunId: relationshipSessions.analysisRunId, status: relationshipSessions.status })
    .from(relationshipSessions)
    .innerJoin(orders, eq(relationshipSessions.orderId, orders.id))
    .where(and(eq(relationshipSessions.ownerTokenHash, ownerTokenHash), eq(orders.isTest, true)))
    .limit(1);
  const session = sessions[0];
  if (!session || session.status !== "email_pending") throw new Error("PREVIEW_RELATIONSHIP_DELIVERY_NOT_READY");
  const outboxes = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .innerJoin(privateDocuments, eq(emailOutbox.privateDocumentId, privateDocuments.id))
    .where(and(
      eq(privateDocuments.analysisRunId, session.analysisRunId),
      eq(emailOutbox.purpose, "analysis_result_pdf"),
      eq(emailOutbox.status, "queued"),
    ))
    .limit(1);
  if (!outboxes[0]) throw new Error("PREVIEW_RELATIONSHIP_DELIVERY_NOT_READY");
  return deliverPrivatePdfOutboxItem(outboxes[0].id);
}

async function claimRelationshipReportGeneration(relationshipSessionId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  return (db as any).transaction(async (tx: any) => {
    const sessionRows = await tx
      .select({ status: relationshipSessions.status })
      .from(relationshipSessions)
      .where(eq(relationshipSessions.id, relationshipSessionId))
      .limit(1);
    const status = sessionRows[0]?.status as SessionStatus | undefined;
    if (!status || !EDITABLE_STATUSES.has(status)) return false;
    const participants = await tx
      .select({ status: relationshipParticipants.status })
      .from(relationshipParticipants)
      .where(eq(relationshipParticipants.relationshipSessionId, relationshipSessionId));
    if (participants.length !== 2 || !participants.every((row: { status: string }) => row.status === "submitted")) {
      return false;
    }
    const claimed = await tx
      .update(relationshipSessions)
      .set({ status: "report_generating", reportErrorCode: null })
      .where(and(
        eq(relationshipSessions.id, relationshipSessionId),
        inArray(relationshipSessions.status, ["collecting", "awaiting_partner"]),
      ));
    return Number(claimed[0]?.affectedRows ?? 0) === 1;
  });
}

export async function generateAndQueueRelationshipReport(relationshipSessionId: number): Promise<{ outboxId: number | null }> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db
    .select({
      id: relationshipSessions.id,
      status: relationshipSessions.status,
      relationType: relationshipSessions.relationType,
      analysisRunId: relationshipSessions.analysisRunId,
      productCode: products.code,
    })
    .from(relationshipSessions)
    .innerJoin(analysisRuns, eq(relationshipSessions.analysisRunId, analysisRuns.id))
    .innerJoin(products, eq(analysisRuns.productId, products.id))
    .where(eq(relationshipSessions.id, relationshipSessionId))
    .limit(1);
  const session = rows[0];
  if (!session || session.status !== "report_generating") return { outboxId: null };
  if (session.productCode !== "couple_love_deep" && session.productCode !== "parent_child_deep") {
    throw new Error("RELATIONSHIP_REPORT_PRODUCT_INVALID");
  }

  let stage = "load_participants";
  try {
    const participants = await db
      .select()
      .from(relationshipParticipants)
      .where(eq(relationshipParticipants.relationshipSessionId, session.id));
    stage = "build_snapshot";
    const personA = parseSubmittedPayload(participants.find((row) => row.participant === "A")?.submittedEncrypted ?? null);
    const personB = parseSubmittedPayload(participants.find((row) => row.participant === "B")?.submittedEncrypted ?? null);
    const snapshot = buildResultSnapshot(asSessionData(session.relationType as RelationType, personA, personB));
    stage = "build_delivery_payload";
    const payload = await buildDeliveryPayload(snapshot, session.productCode);
    stage = "save_result_snapshot";
    await db
      .update(relationshipSessions)
      .set({ resultSnapshotEncrypted: encryptCommerceValue(JSON.stringify(snapshot)), reportGeneratedAt: new Date(), reportErrorCode: null })
      .where(and(eq(relationshipSessions.id, session.id), eq(relationshipSessions.status, "report_generating")));
    stage = "queue_private_pdf";
    const queued = await queuePrivateAnalysisPdfDelivery({
      analysisRunId: session.analysisRunId,
      kind: session.productCode,
      payload,
    });
    stage = "mark_email_pending";
    await db
      .update(relationshipSessions)
      .set({ status: "email_pending", reportErrorCode: null })
      .where(and(eq(relationshipSessions.id, session.id), eq(relationshipSessions.status, "report_generating")));
    return { outboxId: queued.outboxId };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 120) : "RELATIONSHIP_REPORT_FAILED";
    const reportErrorCode = `RELATIONSHIP_REPORT_${stage.toUpperCase()}:${message}`.slice(0, 160);
    console.error("[relationship-report] generation failed", { relationshipSessionId, stage, message });
    await db
      .update(relationshipSessions)
      .set({ status: "failed", reportErrorCode })
      .where(and(eq(relationshipSessions.id, session.id), eq(relationshipSessions.status, "report_generating")));
    throw error;
  }
}

export async function getRelationshipResult(input: {
  resultToken?: string;
  accessToken?: string;
}): Promise<{ status: SessionStatus; snapshot: CoupleShareSnapshot | null }> {
  let session: typeof relationshipSessions.$inferSelect | undefined;
  if (input.accessToken) {
    // A의 기존 세션 링크와 B의 기존 초대 링크는 각각 다른 접근 토큰이다.
    // 완료 후에는 두 토큰 모두 동일한 통합 결과만 읽을 수 있도록 허용한다.
    session = (await loadSessionByAccessToken(input.accessToken)).session;
  } else if (input.resultToken) {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
    const hash = hashCommerceValue(requiredToken(input.resultToken));
    const rows = await db.select().from(relationshipSessions).where(eq(relationshipSessions.resultTokenHash, hash)).limit(1);
    session = rows[0];
  } else {
    throw new Error("RELATIONSHIP_RESULT_ACCESS_REQUIRED");
  }
  if (!session) throw new Error("RELATIONSHIP_RESULT_NOT_FOUND");
  const status = session.status as SessionStatus;
  if (status !== "completed" || !session.resultSnapshotEncrypted) return { status, snapshot: null };
  const snapshot = parseCoupleShareSnapshot(decryptCommerceValue(session.resultSnapshotEncrypted));
  if (!snapshot) throw new Error("RELATIONSHIP_RESULT_UNREADABLE");
  return { status, snapshot };
}

/** 관리자/worker가 상태 연결을 확인할 때 사용하는 최소 조회. 원문 답변은 반환하지 않는다. */
export async function getRelationshipSessionDeliverySnapshot(relationshipSessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db
    .select({
      status: relationshipSessions.status,
      reportErrorCode: relationshipSessions.reportErrorCode,
      outboxStatus: emailOutbox.status,
    })
    .from(relationshipSessions)
    .leftJoin(analysisRuns, eq(relationshipSessions.analysisRunId, analysisRuns.id))
    .leftJoin(privateDocuments, eq(privateDocuments.analysisRunId, analysisRuns.id))
    .leftJoin(emailOutbox, eq(emailOutbox.privateDocumentId, privateDocuments.id))
    .where(eq(relationshipSessions.id, relationshipSessionId))
    .limit(1);
  return rows[0] ?? null;
}
