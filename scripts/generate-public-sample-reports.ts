import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { CARD_DATA, type CardData } from "../constants/cardData";
import { COLOR_DATA, COLOR_ROLE_CONTENT, type ColorData } from "../constants/colorData";
import {
  generatePersonAnalysis,
  getLightArchetype,
  type CoupleSessionData,
  type PersonSession,
} from "../constants/coupleData";
import { buildCustomRecoveryRoutine, buildLifeEnergyResult } from "../constants/lifeArchetype";
import { buildLifeRoleEnergyReport } from "../constants/lifeRoleEnergy";
import { buildPremiumStage1Interpretation } from "../constants/premiumStage1Data";
import { buildStage2CardInterpretations, buildStage2ColorBridge } from "../constants/premiumStage2CardInterpretation";
import { buildCoupleColorCardIntegratedAnalysis } from "../lib/couple-color-card-analysis";
import { buildParentChildCoaching } from "../lib/parent-child-coaching";
import { buildParentChildRelationshipAnalysis } from "../lib/parent-child-relationship-analysis";
import { buildPremiumCardFlowSummary } from "../lib/premium-card-flow-summary";
import { buildPremiumColorFlowDescription } from "../lib/premium-color-flow-summary";
import { buildPremiumPdfDownloadPayload } from "../lib/premium-pdf-download";
import { buildParentChildPdfDownloadPayload } from "../lib/parent-child-pdf-download";
import { localizePayload } from "../lib/zh-cn-copy";
import { createCouplePdfBuffer } from "../server/couple-pdf-report";
import { createParentChildPdfBuffer } from "../server/parent-child-pdf-report";
import { createPremiumPdfBuffer } from "../server/pdf-report";
import { COACHING_BOOKING_URL } from "../shared/coaching-booking";
import type { CouplePdfDownloadPayload, CouplePdfPerson } from "../shared/couple-pdf-download";

const SAMPLE_NOTICE = "공개 예시 리포트 · 가상 데이터로 생성됨 · 실제 고객 개인정보 미사용";
const REPORT_LOCALE = process.env.SAMPLE_REPORT_LOCALE === "zh-CN" ? "zh-CN" : "ko";
// 기본 공개 샘플은 유지한다. alternate는 실제 생성 경로의 다른 색·카드·역할 조합을
// 검수할 때만 사용하는 무발송 QA 모드다.
const SAMPLE_VARIANT = process.env.SAMPLE_REPORT_VARIANT === "alternate" ? "alternate" : "default";
const IS_ALTERNATE_SAMPLE = SAMPLE_VARIANT === "alternate";
const OUTPUT_DIR = process.env.SAMPLE_REPORT_OUTPUT_DIR
  ? path.resolve(process.env.SAMPLE_REPORT_OUTPUT_DIR)
  : path.resolve(process.cwd(), "public", "sample-reports");
const PAYLOAD_DIR = process.env.SAMPLE_REPORT_PAYLOAD_DIR ? path.resolve(process.env.SAMPLE_REPORT_PAYLOAD_DIR) : null;

function savePayload(name: string, payload: unknown) {
  if (!PAYLOAD_DIR) return;
  mkdirSync(PAYLOAD_DIR, { recursive: true });
  writeFileSync(path.join(PAYLOAD_DIR, name), JSON.stringify(payload, null, 2));
}

type EnergyFamily = "warm_active" | "warm_soft" | "warm_grounded" | "cool_clear" | "cool_deep" | "nature" | "neutral";

const ENERGY_FAMILY: Record<string, EnergyFamily> = {
  red: "warm_active", orange: "warm_active", coral: "warm_active", magenta: "warm_active",
  pink: "warm_soft", peach: "warm_soft", beige: "warm_soft", cream: "warm_soft",
  gold: "warm_grounded", brown: "warm_grounded", terracotta: "warm_grounded",
  blue: "cool_clear", skyblue: "cool_clear", teal: "cool_clear", mint: "cool_clear",
  indigo: "cool_deep", violet: "cool_deep", black: "cool_deep", silver: "cool_deep", navy: "cool_deep",
  green: "nature", olive: "nature", sage: "nature", lavender: "nature",
  white: "neutral", yellow: "neutral",
};

function getColors(ids: readonly string[]): ColorData[] {
  return ids.map((id) => {
    const value = COLOR_DATA.find((color) => color.id === id);
    if (!value) throw new Error(`샘플 컬러를 찾을 수 없습니다: ${id}`);
    return value;
  });
}

function getCards(ids: readonly string[]): CardData[] {
  return ids.map((id) => {
    const value = CARD_DATA.find((card) => card.id === id);
    if (!value) throw new Error(`샘플 심리카드를 찾을 수 없습니다: ${id}`);
    return value;
  });
}

function colorRows(colors: readonly ColorData[]) {
  return colors.slice(0, 3).map((color, index) => {
    const content = COLOR_ROLE_CONTENT[color.id];
    return {
      role: index === 0 ? "주기질" : index === 1 ? "보조기질" : "회복방향",
      name: color.korName,
      hex: color.hex,
      keywords: color.keywords.slice(0, 3).join(" · "),
      interpretation: index === 0
        ? (content?.primaryTrait ?? color.recovery)
        : index === 1
          ? (content?.secondaryTrait ?? color.recovery)
          : (content?.recoveryDirection ?? color.recovery),
    };
  });
}

function cardRows(cards: readonly CardData[]) {
  return cards.slice(0, 3).map((card, index) => ({
    position: index === 0 ? "1번 카드 · 무의식" : index === 1 ? "2번 카드 · 현재흐름" : "3번 카드 · 회복방향",
    colorName: card.colorKor,
    shapeName: card.shapeKor,
    colorHex: card.colorHex,
    shape: card.shape,
    title: card.energyTitle,
    narrative: index === 0 ? card.psychologyFlow : index === 1 ? card.personalityFlow : card.recoveryDirection,
  }));
}

function personPdfData(label: string, session: PersonSession): CouplePdfPerson {
  const colors = getColors(session.colors);
  const cards = getCards(session.cards);
  const analysis = generatePersonAnalysis(session, "A");
  return {
    label,
    colors: colorRows(colors),
    cards: cardRows(cards),
    integratedAnalysis: buildCoupleColorCardIntegratedAnalysis(colors, cards),
    relationshipStyle: analysis.relationshipStyle,
    emotionExpression: analysis.emotionExpression,
    complementColor: {
      name: analysis.complementColor.korName,
      hex: analysis.complementColor.hex,
      meaning: analysis.complementColor.meaning,
    },
    coachingMessage: analysis.coachingMessage,
  };
}

function dateLabel() {
  const now = new Date();
  if (REPORT_LOCALE === "zh-CN") return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
}

async function createPersonalSample() {
  const colors = getColors(IS_ALTERNATE_SAMPLE ? ["green", "orange", "black"] : ["red", "blue", "white"]);
  const cards = getCards(IS_ALTERNATE_SAMPLE ? ["green_circle", "orange_hexagon", "black_inverted_triangle"] : ["red_triangle", "blue_diamond", "white_square"]);
  const energy = buildLifeEnergyResult(
    colors.map((color) => color.id),
    cards.map((card) => ({ color: card.color, shape: card.shape })),
    cards[2].complementColors,
  );
  const routine = buildCustomRecoveryRoutine(
    energy.complementaryFiveElements.elements,
    cards[2].wellness,
    energy.routines,
    energy.currentRoutines,
  );
  const stage2Cards = buildStage2CardInterpretations(cards as [CardData, CardData, CardData]);
  const lifeRole = buildLifeRoleEnergyReport(colors.map((color) => color.id), cards, "가상 성인");
  const complementCandidates = [
    ...cards[2].complementColors,
    ...cards[0].complementColors,
    ...colors[2].complementColors.map((name) => ({
      name,
      meaning: COLOR_DATA.find((color) => color.korName === name || color.name === name)?.recovery ?? "회복에 필요한 흐름",
    })),
  ];
  const complementColors = energy.complementaryFiveElements.complementColors?.length
    ? energy.complementaryFiveElements.complementColors.map((name) => complementCandidates.find((color) => color.name === name) ?? { name, meaning: "회복에 필요한 흐름" })
    : cards[2].complementColors;
  const payload = buildPremiumPdfDownloadPayload({
    profile: null,
    selectedColors: colors,
    stage1Interpretation: buildPremiumStage1Interpretation(colors),
    cards,
    stage2Bridge: buildStage2ColorBridge(colors),
    stage2Cards,
    complementColors,
    colorFlowDescription: buildPremiumColorFlowDescription(colors, "가상 인물의 성향 흐름"),
    combinedCoaching: buildPremiumCardFlowSummary(cards as [CardData, CardData, CardData]),
    scripture: null,
    lifeRoleReport: lifeRole,
    lifeEnergyResult: energy,
    customRecoveryRoutine: {
      tea: cards[2].wellness.tea,
      food: routine.food,
      breath: routine.breath,
      movement: routine.movement,
      smallPractice: routine.smallPractice,
      message: routine.message,
    },
    coachingUrl: COACHING_BOOKING_URL,
  });
  payload.profileLine = "개인 심화분석 · 가상 인물";
  payload.generatedAt = dateLabel();
  payload.sampleNotice = SAMPLE_NOTICE;
  payload.locale = REPORT_LOCALE;
  payload.copyVersion = REPORT_LOCALE === "zh-CN" ? "zh-CN-review-v1" : "ko-canonical";
  savePayload("personal.json", payload);
  return createPremiumPdfBuffer(localizePayload(payload, REPORT_LOCALE));
}

async function createCoupleSample() {
  const relationType = IS_ALTERNATE_SAMPLE ? "연인" : "부부";
  const personALabel = IS_ALTERNATE_SAMPLE ? "남자친구" : "남편";
  const personBLabel = IS_ALTERNATE_SAMPLE ? "여자친구" : "아내";
  const session: CoupleSessionData = {
    relationType,
    personA: {
      info: { gender: "남성", faith: "무교", relationshipRole: personALabel },
      colors: IS_ALTERNATE_SAMPLE ? ["indigo", "yellow", "white"] : ["magenta", "lavender", "teal"],
      cards: IS_ALTERNATE_SAMPLE ? ["navy_diamond", "yellow_triangle", "white_circle"] : ["white_pentagon", "yellow_circle", "purple_triangle"],
    },
    personB: {
      info: { gender: "여성", faith: "무교", relationshipRole: personBLabel },
      colors: IS_ALTERNATE_SAMPLE ? ["red", "black", "green"] : ["green", "blue", "orange"],
      cards: IS_ALTERNATE_SAMPLE ? ["red_inverted_triangle", "black_square", "green_hexagon"] : ["purple_circle", "red_inverted_triangle", "white_hexagon"],
    },
  };
  const colorsA = getColors(session.personA.colors);
  const colorsB = getColors(session.personB.colors);
  const cardsA = getCards(session.personA.cards);
  const cardsB = getCards(session.personB.cards);
  const personA = generatePersonAnalysis(session.personA, "A");
  const personB = generatePersonAnalysis(session.personB, "B");
  const { generateCoupleAnalysis, getRelationArchetype } = await import("../constants/coupleData");
  const coupleAnalysis = generateCoupleAnalysis(session, personA, personB);
  const archetype = getRelationArchetype(
    session.personA.colors.map((id) => ENERGY_FAMILY[id] ?? "neutral") as any[],
    session.personB.colors.map((id) => ENERGY_FAMILY[id] ?? "neutral") as any[],
    cardsA[2]?.shape,
    cardsB[2]?.shape,
    session.personA.colors,
    session.personB.colors,
    session.personA.cards,
    session.personB.cards,
    relationType,
  );
  const { buildRomanticCardFlowContrast, buildRomanticCardRecoveryRoutine, buildRomanticRelationTraits } = await import("../lib/couple-romantic-relation-traits");
  const { buildRomanticRelationshipRoles } = await import("../lib/couple-romantic-relationship-roles");
  const personLabels = { personA: personALabel, personB: personBLabel };
  const traits = buildRomanticRelationTraits({
    personA,
    personB,
    colorsA,
    colorsB,
    cardsA,
    cardsB,
    expressionDescription: "",
    recoveryDescription: "",
    relationType,
    personLabels,
  });
  const roles = buildRomanticRelationshipRoles({ personA, personB, colorsA, colorsB, cardsA, cardsB });
  const cardFlowContrast = buildRomanticCardFlowContrast({ cardsA, cardsB, personLabels });
  const cardRecoveryRoutine = buildRomanticCardRecoveryRoutine(cardsA, cardsB);
  const unified = archetype.unifiedSections;
  if (!unified) throw new Error("부부 샘플의 관계 통합 분석을 만들지 못했습니다.");

  const payload: CouplePdfDownloadPayload = {
    relationType,
    generatedAt: dateLabel(),
    sampleNotice: SAMPLE_NOTICE,
    couple: {
      typeName: archetype.typeName,
      coreSummary: archetype.coreSummary,
      tensionDescription: archetype.tensionDescription,
    },
    personA: personPdfData(`${personALabel} · 가상 인물 A`, session.personA),
    personB: personPdfData(`${personBLabel} · 가상 인물 B`, session.personB),
    relationship: {
      personLabels,
      attractionAnalysis: cardFlowContrast ?? coupleAnalysis.profileContrast ?? archetype.tensionDescription,
      roles: {
        personATitle: roles.personA.title,
        personADescription: roles.personA.description,
        personBTitle: roles.personB.title,
        personBDescription: roles.personB.description,
        together: roles.together,
      },
      traits,
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
      recommendedColors: (archetype.recommendedColors ?? coupleAnalysis.coupleRoutine.recommendedColors)
        .map((color) => ({ name: color.korName, hex: color.hex, reason: color.reason })),
      togetherRoutine: {
        routines: (cardRecoveryRoutine ?? archetype.togetherRoutine).routines,
        energyNote: (cardRecoveryRoutine ?? archetype.togetherRoutine).energyNote,
      },
      basicPrinciples: "서로의 마음을 당연하게 여기지 않고, 감정과 필요를 차분히 확인하는 시간이 신뢰·이해·배려·존중을 함께 키워갈 수 있습니다.",
      closingMessage: archetype.closingMessage ?? coupleAnalysis.closingMessage,
    },
  };
  payload.locale = REPORT_LOCALE;
  payload.copyVersion = REPORT_LOCALE === "zh-CN" ? "zh-CN-review-v1" : "ko-canonical";
  savePayload("couple.json", payload);
  return createCouplePdfBuffer(localizePayload(payload, REPORT_LOCALE));
}

async function createParentChildSample() {
  const relationType = IS_ALTERNATE_SAMPLE ? "아빠-아들" as const : "엄마-딸" as const;
  const parentGender = IS_ALTERNATE_SAMPLE ? "남성" as const : "여성" as const;
  const childGender = IS_ALTERNATE_SAMPLE ? "남성" as const : "여성" as const;
  const parentLabel = IS_ALTERNATE_SAMPLE ? "아빠" : "엄마";
  const childLabel = IS_ALTERNATE_SAMPLE ? "아들" : "딸";
  const parentSession: PersonSession = {
    info: { gender: parentGender, faith: "무교", relationshipRole: parentLabel },
    colors: IS_ALTERNATE_SAMPLE ? ["indigo", "green", "orange"] : ["green", "blue", "lavender"],
    cards: IS_ALTERNATE_SAMPLE ? ["navy_square", "green_diamond", "orange_triangle"] : ["green_circle", "blue_square", "purple_hexagon"],
  };
  const childSession: PersonSession = {
    info: { gender: childGender, faith: "무교", relationshipRole: childLabel },
    colors: IS_ALTERNATE_SAMPLE ? ["red", "yellow", "blue"] : ["yellow", "pink", "coral"],
    cards: IS_ALTERNATE_SAMPLE ? ["red_circle", "yellow_pentagon", "blue_inverted_triangle"] : ["yellow_circle", "purple_diamond", "orange_pentagon"],
  };
  const parentCards = getCards(parentSession.cards);
  const childCards = getCards(childSession.cards);
  const parentAnalysis = generatePersonAnalysis(parentSession, "A");
  const childAnalysis = generatePersonAnalysis(childSession, "B");
  const parentChildAnalysis = buildParentChildRelationshipAnalysis({
    relationType,
    parentGender,
    childGender,
    parent: { colors: parentSession.colors, cards: parentCards },
    child: { colors: childSession.colors, cards: childCards },
  });
  const lightArchetype = getLightArchetype(
    relationType,
    parentSession.colors.map((id) => ENERGY_FAMILY[id] ?? "neutral") as any[],
    childSession.colors.map((id) => ENERGY_FAMILY[id] ?? "neutral") as any[],
  );
  if (!lightArchetype) throw new Error("부모·자녀 샘플의 관계 유형을 만들지 못했습니다.");
  const coaching = buildParentChildCoaching({
    relationType,
    parentGender,
    childGender,
    parent: { colors: parentSession.colors, cards: parentCards, analysis: parentAnalysis },
    child: { colors: childSession.colors, cards: childCards, analysis: childAnalysis },
    lightArchetype,
  });
  const summary = parentChildAnalysis.relationshipSummary;
  const payload = buildParentChildPdfDownloadPayload({
    relationType,
    sampleNotice: SAMPLE_NOTICE,
    personA: personPdfData(`${parentLabel} · 가상 인물 A`, parentSession),
    personB: personPdfData(`${childLabel} · 가상 인물 B`, childSession),
    relationship: {
      labels: coaching.labels,
      typeName: summary.typeName,
      coreSummary: summary.coreSummary,
      description: summary.description,
      cardFlowSummary: `${coaching.labels.parent}의 현재흐름 · ${parentCards[1]?.energyTitle ?? "현재 마음의 흐름"}\n${parentCards[1]?.personalityFlow ?? ""}\n\n${coaching.labels.child}의 현재흐름 · ${childCards[1]?.energyTitle ?? "현재 마음의 흐름"}\n${childCards[1]?.personalityFlow ?? ""}`,
      socialRoles: coaching.socialRoles,
      relationshipRoles: coaching.relationshipRoles,
      childCommunication: coaching.childCommunication,
      lifeScenes: {
        strengths: parentChildAnalysis.lifeScenes.strengths.map(({ title, description }) => ({ title, description })),
        tensions: parentChildAnalysis.lifeScenes.tensions.map(({ title, description }) => ({ title, description })),
      },
      dialogue: coaching.dialogue,
      conflictRecovery: coaching.conflictRecovery,
      recommendedColors: summary.recommendedColors.map((color) => ({ name: color.korName, hex: color.hex, reason: color.reason })),
      practices: coaching.practices,
      closingMessage: summary.closingMessage,
    },
  });
  payload.generatedAt = dateLabel();
  payload.locale = REPORT_LOCALE;
  payload.copyVersion = REPORT_LOCALE === "zh-CN" ? "zh-CN-review-v1" : "ko-canonical";
  savePayload("parent-child.json", payload);
  return createParentChildPdfBuffer(localizePayload(payload, REPORT_LOCALE));
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const results = await Promise.all([
    createPersonalSample(),
    createCoupleSample(),
    createParentChildSample(),
  ]);
  const files = [
    "husimcolor-personal-deep-sample.pdf",
    "husimcolor-couple-love-sample.pdf",
    "husimcolor-parent-child-sample.pdf",
  ];
  results.forEach((pdf, index) => writeFileSync(path.join(OUTPUT_DIR, files[index]), pdf));
  console.log(JSON.stringify({ outputDir: OUTPUT_DIR, sampleVariant: SAMPLE_VARIANT, files: files.map((file, index) => ({ file, bytes: results[index].length })), noDatabase: true, noEmail: true }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
