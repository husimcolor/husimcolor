import { describe, expect, it } from "vitest";

import { CARD_DATA, type CardData } from "../constants/cardData";
import { buildLifeRoleEnergyReport } from "../constants/lifeRoleEnergy";

const card = (id: string): CardData => {
  const found = CARD_DATA.find((item) => item.id === id);
  if (!found) throw new Error(`Missing fixture card: ${id}`);
  return found;
};

const report = (colorIds: string[], cardIds: [string, string, string], age = "40대") => {
  const selectedCards = cardIds.map(card) as [CardData, CardData, CardData];
  return buildLifeRoleEnergyReport(colorIds, selectedCards, age);
};

describe("삶의 역할 에너지", () => {
  it("provides a practical role, three to five direction groups, environments, shadows, and one small direction", () => {
    const result = report(["navy", "white", "yellow"], ["navy_diamond", "white_square", "yellow_triangle"]);

    expect(result.coreRole.title).toMatch(/형$/);
    expect(result.coreRole.description).toContain("강점");
    expect(result.directions.length).toBeGreaterThanOrEqual(3);
    expect(result.directions.length).toBeLessThanOrEqual(5);
    expect(result.humanStrengths).toHaveLength(3);
    expect(result.environments).toHaveLength(3);
    expect(result.shadows).toHaveLength(2);
    expect(result.smallDirection).toMatch(/보세요\.|적어 보세요\.|표시해 보세요\./);
  });

  it("uses age as an application context without exposing a generation category in the result", () => {
    const cards: [string, string, string] = ["red_triangle", "blue_diamond", "white_square"];
    const inExploration = report(["red", "blue", "white"], cards, "20대");
    const inExperienceTransfer = report(["red", "blue", "white"], cards, "50대");
    const visibleText = [
      inExploration.coreRole.title,
      inExploration.coreRole.description,
      inExploration.smallDirection,
      inExperienceTransfer.coreRole.description,
      inExperienceTransfer.smallDirection,
    ].join(" ");

    expect(inExploration.coreRole.description).not.toBe(inExperienceTransfer.coreRole.description);
    expect(visibleText).not.toMatch(/20대|50대|세대/);
  });

  it("uses the third card shape as a future work-environment and small-direction input", () => {
    const square = report(["black", "white", "yellow"], ["black_square", "white_circle", "yellow_square"]);
    const diamond = report(["black", "white", "yellow"], ["black_square", "white_circle", "yellow_diamond"]);

    expect(square.environments.at(-1)).toBe("한 단계씩 결과를 점검할 수 있는 환경");
    expect(diamond.environments.at(-1)).toBe("새로운 방법을 시험할 수 있는 환경");
    expect(square.environments.at(-1)).not.toBe(diamond.environments.at(-1));
  });

  it("spreads representative color and card flows across multiple social roles instead of one job family", () => {
    const samples: Array<[string[], [string, string, string]]> = [
      [["red", "orange", "gold"], ["red_triangle", "orange_hexagon", "yellow_pentagon"]],
      [["navy", "white", "black"], ["navy_diamond", "white_square", "black_square"]],
      [["lavender", "pink", "peach"], ["purple_circle", "orange_hexagon", "green_circle"]],
      [["green", "sage", "cream"], ["green_hexagon", "green_square", "white_circle"]],
      [["violet", "magenta", "coral"], ["purple_pentagon", "red_triangle", "orange_diamond"]],
    ];

    const roles = samples.map(([colors, cards]) => report(colors, cards).sourceSummary.primaryRole);
    expect(new Set(roles).size).toBeGreaterThanOrEqual(4);
  });

  it("does not frame the report as a fixed occupation or guaranteed outcome", () => {
    const forbidden = /반드시 맞는 직업|확실히 성공|직업을 그만두|전직해야|AI가 대체할 수 없/;

    for (const colors of [
      ["red", "orange", "gold"],
      ["navy", "white", "yellow"],
      ["pink", "peach", "green"],
      ["violet", "magenta", "coral"],
    ]) {
      const output = report(colors, ["red_circle", "blue_square", "green_hexagon"]);
      expect(JSON.stringify(output)).not.toMatch(forbidden);
    }
  });
});
