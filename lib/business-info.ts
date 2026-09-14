export const BUSINESS_INFO = {
  legalName: '주식회사 이음트레이드',
  representative: 'LI HUA',
  registrationNumber: '464-88-01671',
  address: '서울특별시 성북구 동소문로 47, 701호(동소문로 4가, 부라다리빙텔)',
  customerPhone: '02-741-9383',
} as const;

export const BUSINESS_INFO_SUMMARY = `${BUSINESS_INFO.legalName} · ${BUSINESS_INFO.address}`;
