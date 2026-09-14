import { describe, expect, it } from 'vitest';

import { BUSINESS_INFO, BUSINESS_INFO_SUMMARY } from '../lib/business-info';

describe('공개 사업자정보', () => {
  it('Toss 심사에 필요한 사업자등록 정보 전체를 공통 값으로 유지한다', () => {
    expect(BUSINESS_INFO).toEqual({
      legalName: '주식회사 이음트레이드',
      representative: 'LI HUA',
      registrationNumber: '464-88-01671',
      address: '서울특별시 성북구 동소문로 47, 701호(동소문로 4가, 부라다리빙텔)',
      customerPhone: '02-741-9383',
    });
    expect(BUSINESS_INFO_SUMMARY).toContain(BUSINESS_INFO.legalName);
    expect(BUSINESS_INFO_SUMMARY).toContain(BUSINESS_INFO.address);
  });
});
