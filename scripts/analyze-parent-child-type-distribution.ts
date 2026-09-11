import { CARD_DATA } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import {
  buildParentChildRelationshipAnalysis,
  PARENT_CHILD_RELATIONSHIP_TYPE_IDS,
  type ParentChildRelationshipTypeId,
} from "../lib/parent-child-relationship-analysis";

const cards = ["red_circle", "white_square", "blue_diamond"]
  .map((id) => CARD_DATA.find((card) => card.id === id)!)
  .filter(Boolean);

const counts = Object.fromEntries(PARENT_CHILD_RELATIONSHIP_TYPE_IDS.map((id) => [id, 0])) as Record<ParentChildRelationshipTypeId, number>;
const examples = {} as Record<ParentChildRelationshipTypeId, { parent: string[]; child: string[] }>;

for (const parentPrimary of COLOR_DATA) {
  for (const parentSecondary of COLOR_DATA) {
    if (parentPrimary.id === parentSecondary.id) continue;
    for (const childPrimary of COLOR_DATA) {
      for (const childSecondary of COLOR_DATA) {
        if (childPrimary.id === childSecondary.id) continue;
        const parent = [parentPrimary.id, parentSecondary.id, "lavender"];
        const child = [childPrimary.id, childSecondary.id, "coral"];
        const result = buildParentChildRelationshipAnalysis({
          relationType: "엄마-딸",
          parentGender: "여성",
          childGender: "여성",
          parent: { colors: parent, cards },
          child: { colors: child, cards },
        });
        const id = result.relationshipSummary.id;
        counts[id] += 1;
        examples[id] ??= { parent: parent.slice(0, 2), child: child.slice(0, 2) };
      }
    }
  }
}

const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
console.log(JSON.stringify({ total, counts, examples }, null, 2));
