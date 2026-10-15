import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { localizePayload } from '../lib/zh-cn-copy';

type Row = { path: string; ko: string; zh: string };
function collect(value: unknown, localized: unknown, prefix = '$'): Row[] {
  if (typeof value === 'string') return [{ path: prefix, ko: value, zh: typeof localized === 'string' ? localized : String(localized ?? '') }];
  if (Array.isArray(value)) return value.flatMap((entry, i) => collect(entry, Array.isArray(localized) ? localized[i] : undefined, `${prefix}[${i}]`));
  if (!value || typeof value !== 'object') return [];
  const result: Row[] = [];
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) result.push(...collect(entry, (localized as Record<string, unknown> | undefined)?.[key], `${prefix}.${key}`));
  return result;
}
const source = '/tmp/husimcolor-zh-cn-sample-korean-payloads';
const out = '/tmp/zh-cn-current-payload-line-audit';
mkdirSync(out, { recursive: true });
for (const filename of ['personal.json','couple.json','parent-child.json']) {
  const ko=JSON.parse(readFileSync(path.join(source,filename),'utf8'));
  const zh=localizePayload(ko,'zh-CN');
  const rows=collect(ko,zh).filter(r => /[가-힣]/.test(r.ko));
  writeFileSync(path.join(out,filename),JSON.stringify(rows,null,2));
  console.log(filename, rows.length, rows.filter(r => /[가-힣]/.test(r.zh)).length);
}
