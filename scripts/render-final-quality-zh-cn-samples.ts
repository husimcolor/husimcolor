import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { localizePayload } from "../lib/zh-cn-copy";
import { createPremiumPdfBuffer } from "../server/pdf-report";
import { createCouplePdfBuffer } from "../server/couple-pdf-report";
import { createParentChildPdfBuffer } from "../server/parent-child-pdf-report";
import type { PremiumPdfDownloadPayload } from "../shared/premium-pdf-download";
import type { CouplePdfDownloadPayload } from "../shared/couple-pdf-download";
import type { ParentChildPdfDownloadPayload } from "../shared/parent-child-pdf-download";

const source = "/tmp/husimcolor-zh-cn-sample-korean-payloads";
const out = "/home/ubuntu/husimcolor-zh-cn-final-quality-review-20261015-v11/sample-pdfs";
mkdirSync(out, { recursive: true });

function localized<T extends { locale?: string; copyVersion?: string }>(filename: string): T {
  const korean = JSON.parse(readFileSync(path.join(source, filename), "utf8")) as T;
  const result = localizePayload(korean, "zh-CN");
  result.locale = "zh-CN";
  result.copyVersion = "zh-CN-2026-10-15-v11";
  return result;
}

async function main() {
  const personal = localized<PremiumPdfDownloadPayload>("personal.json");
  const couple = localized<CouplePdfDownloadPayload>("couple.json");
  const parentChild = localized<ParentChildPdfDownloadPayload>("parent-child.json");
  const files = [
    ["husimcolor-personal-deep-zh-CN-final-quality-v11-20261015.pdf", await createPremiumPdfBuffer(personal)],
    ["husimcolor-couple-love-zh-CN-final-quality-v11-20261015.pdf", await createCouplePdfBuffer(couple)],
    ["husimcolor-parent-child-zh-CN-final-quality-v11-20261015.pdf", await createParentChildPdfBuffer(parentChild)],
  ] as const;
  for (const [filename, data] of files) writeFileSync(path.join(out, filename), data);
  console.log(JSON.stringify({ out, files: files.map(([filename, data]) => ({ filename, bytes: data.length })) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
