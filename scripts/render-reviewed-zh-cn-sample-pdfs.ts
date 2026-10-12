import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createPremiumPdfBuffer } from "../server/pdf-report";
import { createCouplePdfBuffer } from "../server/couple-pdf-report";
import { createParentChildPdfBuffer } from "../server/parent-child-pdf-report";
import type { PremiumPdfDownloadPayload } from "../shared/premium-pdf-download";
import type { CouplePdfDownloadPayload } from "../shared/couple-pdf-download";
import type { ParentChildPdfDownloadPayload } from "../shared/parent-child-pdf-download";

const source = "/tmp/husimcolor-zh-cn-sample-translated-payloads";
const out = "/home/ubuntu/husimcolor-zh-cn-full-localization-review-20261012/reviewed-sample-pdfs";
mkdirSync(out, { recursive: true });

async function main() {
  const personal = JSON.parse(readFileSync(path.join(source, "personal.json"), "utf8")) as PremiumPdfDownloadPayload;
  const couple = JSON.parse(readFileSync(path.join(source, "couple.json"), "utf8")) as CouplePdfDownloadPayload;
  const parentChild = JSON.parse(readFileSync(path.join(source, "parent-child.json"), "utf8")) as ParentChildPdfDownloadPayload;

  const files = [
    ["husimcolor-personal-deep-zh-CN-review.pdf", await createPremiumPdfBuffer(personal)],
    ["husimcolor-couple-love-zh-CN-review.pdf", await createCouplePdfBuffer(couple)],
    ["husimcolor-parent-child-zh-CN-review.pdf", await createParentChildPdfBuffer(parentChild)],
  ] as const;
  for (const [name, buffer] of files) writeFileSync(path.join(out, name), buffer);
  console.log(JSON.stringify({ out, files: files.map(([name, buffer]) => ({ name, bytes: buffer.length })) }, null, 2));
}

void main();
