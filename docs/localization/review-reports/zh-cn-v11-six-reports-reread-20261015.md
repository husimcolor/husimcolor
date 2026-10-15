# HUSIM COLOR zh-CN v11 대표 PDF 여섯 종 재독해 기록

- **작성일:** 2026-10-15
- **목적:** v10 대표 PDF 여섯 종의 문단별 재독해에서 발견된 조각 번역·주체 혼동·관계 유형 제목 오류를 공통 변환 경로에서 보정하고, 기본 3종과 추가 3종에 같은 경로가 적용되는지 다시 확인한다.
- **운영 영향:** 없음. Production 배포, Production DB migration, 실제 이메일 발송, 실제 결제, 기존 고객 결과/PDF/email 재생성은 수행하지 않았다.

## 1. 이번에 보정한 공통 경로

| 문제 원인 | 한국어 생성 맥락 | 이전 출력 문제 | v11 처리 | 적용 위치 |
|---|---|---|---|---|
| 조각 카탈로그 연결 뒤 공백·마침표 잔여 | `爸爸 的`, `虚拟人物 心理倾向` 등 | 중국어 단어 사이에 한국어 조립 흔적이 남음 | 중국어 문자 사이의 불필요한 공백과 ASCII 마침표를 최종 정규화 | `lib/zh-cn-copy.ts` `finalizeLocalizedCopy` |
| 부모·자녀 요약의 동사 충돌 | `아빠가 자기 리듬과 여백을 지키려는 마음…` | `希望保持重视…`처럼 의도·특성 동사가 겹칠 위험 | `爸爸重视自己的节奏与留白；儿子更想开始并落实小小的行动。`으로 역할별 완결 재조립 | `lib/zh-cn-copy.ts`, static revision catalog |
| 개인 사회 역할의 문장 파편 | 고객 경험·커뮤니티 준비 방향 | `…工作中 可以增添力量。`, `…体验现场流程` | 업무·준비 문장을 각각 완결 중국어로 고정 | static revision catalog |
| 연인 제목 혼동 | 남자친구·여자친구 세션 | `夫妻关系报告` | `relationType`이 연인인 zh-CN PDF에는 `恋人关系报告`를 출력 | `server/couple-pdf-report.ts` 기존 분기 재검증 |
| 색상을 행동 주체처럼 출력 | 연인 감정 교류·표현 리듬 | `靛蓝…表达心意`, `黄色在表达时…` | 실제 역할(남자친구/여자친구)을 주체로 두고 색상은 `所呈现的…` 근거로만 연결 | `lib/zh-cn-copy.ts`, `lib/couple-romantic-relation-traits.ts` |

## 2. 실제 생성·재독해한 대표 조합

모두 가상 입력이며 데이터베이스·주문·이메일 outbox를 생성하지 않았다.

| 구분 | 조합 | PDF 파일 |
|---|---|---|
| 기본 | 개인 심화 canonical fixture | `husimcolor-personal-deep-zh-CN-final-quality-v11-20261015.pdf` |
| 기본 | 부부 canonical fixture | `husimcolor-couple-love-zh-CN-final-quality-v11-20261015.pdf` |
| 기본 | 엄마·딸 canonical fixture | `husimcolor-parent-child-zh-CN-final-quality-v11-20261015.pdf` |
| 추가 | 개인: 그린·오렌지·블랙 | `husimcolor-personal-green-orange-black-zh-CN-representative-v11-20261015.pdf` |
| 추가 | 남자친구·여자친구 | `husimcolor-couple-boyfriend-girlfriend-zh-CN-representative-v11-20261015.pdf` |
| 추가 | 아빠·아들 | `husimcolor-parent-child-father-son-zh-CN-representative-v11-20261015.pdf` |

## 3. v11 확인 결과

### 자동·구조 검사

- `pnpm check` 통과.
- 집중 회귀: `zhCnLocalizationCatalog`, `premiumPdfReport`, `couplePdfReport`, `parentChildPdfReport` — **4 files / 31 tests 통과**.
- 여섯 PDF를 다시 `pdftotext`로 추출해 다음을 검사했다: 한국어 잔여, literal `\\n`, `的的`, `蒂尔/蒂尔色`, `爸爸 的`, `希望保持重视`, `内心的纹理`, 이전에 확인된 색상-주체 조립 패턴.
- 기본 공개 샘플 세 PDF는 v11 기본 PDF와 SHA-256이 각각 일치한다. 따라서 이 브랜치의 화면·공개 샘플 링크가 가리키는 파일과 첨부 PDF는 동일한 본문이다.

### 실제 문장 독해

- 추가 개인: `周围比较混乱时，你往往容易感到精力被消耗。`, 세 색 통합 `…共同构成了这位虚拟人物的心理倾向。`, 사회 역할 세 방향의 문장 종결을 확인했다.
- 추가 연인: 표지·머리말이 `恋人关系报告`로 표시되고, 남자친구/여자친구를 주체로 한 색상 근거 문장을 확인했다.
- 기본 엄마·딸: `妈妈重视稳定与持续性` 및 딸을 가리키는 `女儿` 호칭을 확인했다.
- 추가 아빠·아들: `爸爸重视自己的节奏与留白；儿子更想开始并落实小小的行动。` 및 제1·2순위 색상 요약이 사람 중심 문장으로 출력되는 것을 확인했다.

## 4. 정확한 검수 한계

이번 기록은 **대표 조합 여섯 종을 처음부터 끝까지 문단별로 읽고, 발견된 공통 경로를 보정한 검수**다. 다음 범위는 아직 완전 검수 또는 별도 E2E가 필요하다.

1. 25색 × 모든 심리카드·선택 순위의 전체 조합, 모든 부부/연인 및 부모/자녀 역할 조합의 원어민 수준 문장 검수.
2. 실제 결제 후 새 세션의 locale/copyVersion 영속성, 실제 Resend 수신, Android Chrome/Samsung Internet에서 다운로드 후 파일 앱 열기.
3. `https://husimcolor.com` 홈페이지: 소스 작업본이 없어 미완료.
4. 심리 코칭 카피 경험이 있는 간체 중국어 원어민의 최종 문화·문체 QA.

## 5. 재생성 및 소스

- 공통 변환: `lib/zh-cn-copy.ts`
- 정적 문안 보정: `shared/locales/zh-cn-static-revision-catalog.ts`
- 완결 문장 override: `shared/locales/zh-cn-reviewed-output-overrides.ts`
- 기본 PDF: `pnpm exec tsx scripts/render-final-quality-zh-cn-samples.ts`
- 추가 대표 조합: `SAMPLE_REPORT_LOCALE=zh-CN SAMPLE_REPORT_VARIANT=alternate pnpm exec tsx scripts/generate-public-sample-reports.ts`
- 커밋용 PDF: `docs/localization/zh-cn-v11-review-pdfs/`

영어는 보관 상태이며 이번 변경 범위에 포함하지 않았다.
