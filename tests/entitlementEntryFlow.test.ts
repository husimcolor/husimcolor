import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..');
const read = (relativePath: string) => readFileSync(path.join(projectRoot, relativePath), 'utf8');

describe('entitlement-based analysis entry', () => {
  it('routes paid personal and paid relationship selections through the test checkout while preserving free friend entry', () => {
    const home = read('app/(tabs)/index.tsx');
    const coupleStart = read('app/(tabs)/couple-start.tsx');
    expect(home).toContain('commerce-checkout?product=personal_deep');
    expect(coupleStart).toContain('commerce-checkout?product=${paidProductCode}');
    expect(coupleStart).toContain("selectedProductId === 'parent-child'");
    expect(coupleStart).toContain("const paidProductCode");
    expect(coupleStart).toContain("pathname: '/(tabs)/couple-info'");
  });

  it('consumes a server entitlement at information completion before retaining the existing examination session', () => {
    const premiumInfo = read('app/(tabs)/premium-info.tsx');
    const coupleInfo = read('app/(tabs)/couple-info.tsx');
    expect(premiumInfo).toContain("consumeForAnalysisStart");
    expect(premiumInfo).toContain("removeCommerceStartGrant('personal_deep')");
    expect(premiumInfo).toContain("tossTestEnabled && !grant");
    expect(premiumInfo).toContain("markCommerceAnalysisStarted('personal_deep')");
    expect(premiumInfo).toContain("commerce-checkout?product=personal_deep");
    expect(coupleInfo).toContain("getPaidProductCode");
    expect(coupleInfo).toContain("consumeForAnalysisStart");
    expect(coupleInfo).toContain("tossTestEnabled && !grant");
    expect(coupleInfo).toContain("markCommerceAnalysisStarted(paidProductCode)");
    expect(coupleInfo).toContain("return null;");
    expect(read('app/(tabs)/couple-select.tsx')).toContain('hasCommerceAnalysisStarted(productCode)');
  });
});
