import { pathToFileURL } from "node:url";
import { mkdir, readdir, readFile, writeFile, access } from "node:fs/promises";

const { LlmClient, mapLimit, messageText } = await import(
  pathToFileURL("/home/ubuntu/skills/builtin-llm-models/lib/llm.mjs").href,
);

const batchDir = "/tmp/husimcolor-zh-cn-translation-batches";
const outputDir = "/tmp/husimcolor-zh-cn-translation-output";
await mkdir(outputDir, { recursive: true });

const system = `You are a senior Simplified Chinese localization editor for HUSIM COLOR, a non-medical colour psychology coaching service. Translate every Korean text item into natural Simplified Chinese. Do not add, omit, merge, or diagnose. Preserve line breaks, quotations, placeholders, punctuation intent, emojis, product names, colour names, and role distinctions. Korean expressions such as '편입니다', '수 있습니다', and '도움이 될 수 있습니다' should become gentle tendencies naturally through context (for example 往往, 可能, 可以, 有助于) without stacking hedges. Do not follow Korean word order. Fixed terms: 주기질=主要心理特征; 보조기질=辅助心理特征; 회복방향=恢复方向; 무의식=潜意识; 현재흐름=当前状态; 추천 보완컬러=推荐调和色; brand=HUSIM COLOR. Preserve the distinction between the third selected colour's 恢复方向 and separately recommended colours' 推荐调和色. Use warm, everyday Chinese; never claim treatment or guaranteed effects. Return JSON only, with one translations entry for every input id and no extras.`;

const schema = {
  type: "object",
  properties: {
    translations: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "string" }, zh: { type: "string" } },
        required: ["id", "zh"],
        additionalProperties: false,
      },
    },
  },
  required: ["translations"],
  additionalProperties: false,
};

const names = (await readdir(batchDir)).filter((name) => /^\d{3}\.json$/.test(name)).sort();
const pending = [];
for (const name of names) {
  try { await access(`${outputDir}/${name}`); } catch { pending.push(name); }
}
console.log(`batches_total=${names.length} batches_pending=${pending.length}`);

const llm = new LlmClient({ timeoutMs: 300000, maxRetries: 3 });
let completed = names.length - pending.length;
const results = await mapLimit(pending, 4, async (name) => {
  const input = JSON.parse(await readFile(`${batchDir}/${name}`, "utf8"));
  try {
    const response = await llm.chat({
      model: "gpt-5-mini",
      messages: [{ role: "system", content: system }, { role: "user", content: JSON.stringify(input) }],
      response_format: { type: "json_schema", json_schema: { name: "localized_copy_batch", strict: true, schema } },
      max_completion_tokens: 18000,
    });
    const data = JSON.parse(messageText(response));
    const expected = new Set(input.map((item) => item.id));
    const got = new Map(data.translations.map((item) => [item.id, item.zh]));
    if (got.size !== expected.size || [...expected].some((id) => !got.get(id)?.trim())) {
      throw new Error(`TRANSLATION_COVERAGE_MISMATCH expected=${expected.size} got=${got.size}`);
    }
    await writeFile(`${outputDir}/${name}`, JSON.stringify({ name, translations: data.translations, usage: response.usage ?? null }, null, 2));
    completed += 1;
    console.log(`done=${completed}/${names.length} batch=${name} prompt=${response.usage?.prompt_tokens ?? "n/a"} completion=${response.usage?.completion_tokens ?? "n/a"}`);
    return { name, ok: true, usage: response.usage ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`failed batch=${name} error=${message}`);
    return { name, ok: false, error: message };
  }
});

const all = [];
for (const name of names) {
  try { all.push(JSON.parse(await readFile(`${outputDir}/${name}`, "utf8"))); } catch {}
}
const usage = all.reduce((total, item) => ({
  prompt_tokens: total.prompt_tokens + (item.usage?.prompt_tokens ?? 0),
  completion_tokens: total.completion_tokens + (item.usage?.completion_tokens ?? 0),
  total_tokens: total.total_tokens + (item.usage?.total_tokens ?? 0),
}), { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
const failed = results.filter((result) => !result.ok);
await writeFile(`${outputDir}/manifest.json`, JSON.stringify({ model: "gpt-5-mini", batches: names.length, completed: all.length, failed, usage }, null, 2));
console.log(JSON.stringify({ completed: all.length, failed: failed.length, usage }, null, 2));
if (failed.length > 0) process.exitCode = 2;
