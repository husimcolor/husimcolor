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
import { buildStage2CardInterpretations, buildStage2ColorBridge } from "../constants/premiumStage2CardInterpretation";
import { buildCoupleColorCardIntegratedAnalysis } from "../lib/couple-color-card-analysis";
import { buildParentChildCoaching } from "../lib/parent-child-coaching";
import { buildParentChildRelationshipAnalysis } from "../lib/parent-child-relationship-analysis";
import { buildPremiumPdfDownloadPayload } from "../lib/premium-pdf-download";
import { buildParentChildPdfDownloadPayload } from "../lib/parent-child-pdf-download";
import { createCouplePdfBuffer } from "../server/couple-pdf-report";
import { createParentChildPdfBuffer } from "../server/parent-child-pdf-report";
import { createPremiumPdfBuffer } from "../server/pdf-report";
import type { CouplePdfDownloadPayload, CouplePdfPerson } from "../shared/couple-pdf-download";

const SAMPLE_NOTICE = "공개 예시 리포트 · 가상 데이터로 생성됨 · 실제 고객 개인정보 미사용";
const OUTPUT_DIR = process.env.SAMPLE_REPORT_OUTPUT_DIR
  ? path.resolve(process.env.SAMPLE_REPORT_OUTPUT_DIR)
  : path.resolve(process.cwd(), "public", "sample-reports");

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
      role: index === 0 ? "주기질" : index === 1 ? "보조기질" : "회복 방향",
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
    position: index === 0 ? "1번 카드 · 무의식" : index === 1 ? "2번 카드 · 현재 흐름" : "3번 카드 · 회복 방향",
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
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
}

async function createPersonalSample() {
  const colors = getColors(["red", "blue", "white"]);
  const cards = getCards(["red_triangle", "blue_diamond", "white_square"]);
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
  const payload = buildPremiumPdfDownloadPayload({
    profile: null,
    selectedColors: colors,
    cards,
    stage2Bridge: buildStage2ColorBridge(colors),
    stage2Cards,
    complementColors: cards[2].complementColors,
    colorFlowDescription: `${colors[0].korName}의 ${colors[0].keywords[0]}·${colors[1].korName}의 ${colors[1].keywords[0]}·${colors[2].korName}의 ${colors[2].keywords[0]}이 가상 인물의 성향 흐름을 이룹니다.`,
    combinedCoaching: `${stage2Cards[0].narrative}\n\n${stage2Cards[1].narrative}\n\n${stage2Cards[2].narrative}`,
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
    coachingUrl: "https://husimcolor.vercel.app",
  });
  payload.profileLine = "개인 심화분석 · 가상 인물";
  payload.generatedAt = dateLabel();
  payload.sampleNotice = SAMPLE_NOTICE;
  return createPremiumPdfBuffer(payload);
}

async function createCoupleSample() {
  const session: CoupleSessionData = {
    relationType: "부부",
    personA: {
      info: { gender: "남성", faith: "무교", relationshipRole: "남편" },
      colors: ["magenta", "lavender", "teal"],
      cards: ["white_pentagon", "yellow_circle", "purple_triangle"],
    },
    personB: {
      info: { gender: "여성", faith: "무교", relationshipRole: "아내" },
      colors: ["green", "blue", "orange"],
      cards: ["purple_circle", "red_inverted_triangle", "white_hexagon"],
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
    "부부",
  );
  const { buildRomanticCardFlowContrast, buildRomanticCardRecoveryRoutine, buildRomanticRelationTraits } = await import("../lib/couple-romantic-relation-traits");
  const { buildRomanticRelationshipRoles } = await import("../lib/couple-romantic-relationship-roles");
  const personLabels = { personA: "남편", personB: "아내" };
  const traits = buildRomanticRelationTraits({
    personA,
    personB,
    colorsA,
    colorsB,
    cardsA,
    cardsB,
    expressionDescription: "",
    recoveryDescription: "",
    relationType: "부부",
    personLabels,
  });
  const roles = buildRomanticRelationshipRoles({ personA, personB, colorsA, colorsB, cardsA, cardsB });
  const cardFlowContrast = buildRomanticCardFlowContrast({ cardsA, cardsB, personLabels });
  const cardRecoveryRoutine = buildRomanticCardRecoveryRoutine(cardsA, cardsB);
  const unified = archetype.unifiedSections;
  if (!unified) throw new Error("부부 샘플의 관계 통합 분석을 만들지 못했습니다.");

  const payload: CouplePdfDownloadPayload = {
    relationType: "부부",
    generatedAt: dateLabel(),
    sampleNotice: SAMPLE_NOTICE,
    couple: {
      typeName: archetype.typeName,
      coreSummary: archetype.coreSummary,
      tensionDescription: archetype.tensionDescription,
    },
    personA: personPdfData("남편 · 가상 인물 A", session.personA),
    personB: personPdfData("아내 · 가상 인물 B", session.personB),
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
  return createCouplePdfBuffer(payload);
}

async function createParentChildSample() {
  const relationType = "엄마-딸" as const;
  const parentSession: PersonSession = {
    info: { gender: "여성", faith: "무교", relationshipRole: "엄마" },
    colors: ["green", "blue", "lavender"],
    cards: ["green_circle", "blue_square", "purple_hexagon"],
  };
  const childSession: PersonSession = {
    info: { gender: "여성", faith: "무교", relationshipRole: "딸" },
    colors: ["yellow", "pink", "coral"],
    cards: ["yellow_circle", "purple_diamond", "orange_pentagon"],
  };
  const parentCards = getCards(parentSession.cards);
  const childCards = getCards(childSession.cards);
  const parentAnalysis = generatePersonAnalysis(parentSession, "A");
  const childAnalysis = generatePersonAnalysis(childSession, "B");
  const parentChildAnalysis = buildParentChildRelationshipAnalysis({
    relationType,
    parentGender: "여성",
    childGender: "여성",
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
    parentGender: "여성",
    childGender: "여성",
    parent: { colors: parentSession.colors, cards: parentCards, analysis: parentAnalysis },
    child: { colors: childSession.colors, cards: childCards, analysis: childAnalysis },
    lightArchetype,
  });
  const summary = parentChildAnalysis.relationshipSummary;
  const payload = buildParentChildPdfDownloadPayload({
    relationType,
    sampleNotice: SAMPLE_NOTICE,
    personA: personPdfData("엄마 · 가상 인물 A", parentSession),
    personB: personPdfData("딸 · 가상 인물 B", childSession),
    relationship: {
      labels: coaching.labels,
      typeName: summary.typeName,
      coreSummary: summary.coreSummary,
      description: summary.description,
      cardFlowSummary: `${coaching.labels.parent}의 현재 흐름 · ${parentCards[1]?.energyTitle ?? "현재 마음의 흐름"}\n${parentCards[1]?.personalityFlow ?? ""}\n\n${coaching.labels.child}의 현재 흐름 · ${childCards[1]?.energyTitle ?? "현재 마음의 흐름"}\n${childCards[1]?.personalityFlow ?? ""}`,
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
  return createParentChildPdfBuffer(payload);
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
  console.log(JSON.stringify({ outputDir: OUTPUT_DIR, files: files.map((file, index) => ({ file, bytes: results[index].length })), noDatabase: true, noEmail: true }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
