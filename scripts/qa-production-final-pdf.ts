import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CARD_DATA, type CardData } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import { buildCustomRecoveryRoutine, buildLifeEnergyResult } from "../constants/lifeArchetype";
import { buildLifeRoleEnergyReport } from "../constants/lifeRoleEnergy";
import { buildStage2CardInterpretations, buildStage2ColorBridge } from "../constants/premiumStage2CardInterpretation";
import { buildPremiumPdfDownloadPayload } from "../lib/premium-pdf-download";

function card(id: string): CardData {
  const value = CARD_DATA.find((item) => item.id === id);
  if (!value) throw new Error(`Missing card: ${id}`);
  return value;
}

async function main() {
  const selectedColors = COLOR_DATA.filter((color) => ["lavender", "peach", "cream"].includes(color.id));
  const cards = [card("white_inverted_triangle"), card("navy_inverted_triangle"), card("blue_circle")] as [CardData, CardData, CardData];
  const interpretations = buildStage2CardInterpretations(cards);
  const lifeEnergy = buildLifeEnergyResult(
    selectedColors.map((color) => color.id),
    cards.map((item) => ({ color: item.color, shape: item.shape })),
    cards[2].complementColors,
  );
  const routine = buildCustomRecoveryRoutine(lifeEnergy.complementaryFiveElements.elements, cards[2].wellness, lifeEnergy.routines, lifeEnergy.currentRoutines);
  const payload = buildPremiumPdfDownloadPayload({
    profile: { age: "49", job: "자영업", faith: "기독교" },
    selectedColors,
    cards,
    stage2Bridge: buildStage2ColorBridge(selectedColors),
    stage2Cards: interpretations,
    complementColors: cards[2].complementColors,
    colorFlowDescription: "라벤더의 섬세한 감수성·피치의 정서적 공감·크림의 고요함이 당신의 성향을 이루고 있습니다.",
    combinedCoaching: "정화와 내면 비움은 지금 당신 안에 조용히 자리하고 있습니다. 지금은 내면 성찰과 깊은 통찰 안에 있는 시간입니다.",
    scripture: { label: "오늘의 말씀", text: "하나님은 의지하심의 하나님이 아니시요 오직 화평의 하나님이시라", ref: "고린도전서 14:33" },
    lifeRoleReport: buildLifeRoleEnergyReport(selectedColors.map((color) => color.id), cards, "49세"),
    lifeEnergyResult: lifeEnergy,
    customRecoveryRoutine: {
      tea: cards[2].wellness.tea,
      food: routine.food,
      breath: routine.breath,
      movement: "낮 시간에 10분간 햇빛을 쬐며 앉아 있기",
      smallPractice: routine.smallPractice,
      message: routine.message,
    },
    coachingUrl: "https://naver.me/ID3fxw2W",
  });
  const body = new URLSearchParams({ payload: JSON.stringify(payload) });
  const response = await fetch("https://husimcolor.vercel.app/api/pdf-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
    },
    body,
  });
  if (!response.ok) throw new Error(`Production PDF failed: ${response.status} ${await response.text()}`);
  const outputDirectory = path.resolve(process.cwd(), "qa/production-final-pdf");
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, "headers.txt"), `${[...response.headers.entries()].map(([key, value]) => `${key}: ${value}`).join("\n")}\n`);
  await writeFile(path.join(outputDirectory, "lavender-peach-cream-production.pdf"), Buffer.from(await response.arrayBuffer()));
}

void main();
