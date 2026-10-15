# HUSIM COLOR zh-CN v9 대상 문장·출력 검토 기록

- **작성일:** 2026-10-15
- **대상 브랜치:** `feat/zh-cn-full-localization-v6` (검토 전용)
- **기준 커밋:** 이 문서와 v9 소스/PDF를 함께 커밋한 후의 HEAD를 README 및 백업 manifest에 기록한다.
- **운영 영향:** 없음. Production 배포, Production DB migration, 실제 이메일 발송, 기존 고객 결과/PDF/email 재생성은 수행하지 않았다.

## 1. 이번 v9에서 보정한 공통 생성 경로

이번 변경은 특정 PDF 파일을 편집한 것이 아니라, 한국어 canonical string을 zh-CN으로 바꾸는 공통 경로와 완결 문장 템플릿에 반영했다.

| 한국어 원문/생성 맥락 | 이전 문제 | v9 중국어 | 적용 경로 |
|---|---|---|---|
| 작은 공동 작업에서 역할표와 진행 기록을 만들어 보는 경험이 도움이 됩니다. | `…经历会有助于`로 끝나는 미완성 문장 | `可以尝试在小型协作中制作分工表和进度记录，积累这方面的实践经验。` | 정적 재검수 카탈로그 |
| 아빠가 자기 리듬과 여백을 지키려는 마음과 아들이 작은 움직임을 시작하고 실천하려는 마음이 만나… | 한국어 조각과 중국어 조각이 섞인 문장 | `爸爸希望保持自己的节奏与留白，儿子则更想开始并落实小小的行动。两种心意相遇后，双方可能会在关系中协调彼此的长处。` | 부모·자녀 관계 요약 재조립 |
| 아빠와 아들이 어떤 선택을 앞두고 각자 중요하게 보는 기준을… | `爸爸 儿子各自…`처럼 접속어가 사라짐 | `面对一个选择时，爸爸和儿子如果能分别说出自己最看重的一项标准…` | 부모·자녀 관계 장면 재조립 |
| 남자친구·여자친구의 연락/만남 리듬 | `即便即便…`/변수 종결부호 중복 위험 | `即便在联系与见面之间情绪不一致时，如果能用一句话说明自己需要怎样的回应，对方就不必反复猜测。` | 관계 템플릿 + 최종 정규화 |
| 옐로우·블랙 표현 리듬 | `…方式；…力量。。`처럼 조각·문장부호가 중복될 위험 | `黄色在表达时，可能更容易呈现…；黑色则可能更容易表现出…的力量。` | 관계 템플릿 + 최종 정규화 |
| 엄마·딸 회복 순서 | 딸을 `他`로 가리키거나 주체가 뒤바뀔 위험 | `妈妈可以先不急着给出解决办法，而是认真听听女儿最希望被理解的是什么。` | 역할별 완결 override |
| 아빠·아들 회복 순서 | 해결 주체가 아들로 뒤바뀔 위험 | `爸爸可以先不急着给出解决办法，而是认真听听儿子最希望被理解的是什么。` | 역할별 완결 override |

추가로, `蒂尔/蒂尔色`는 최종 정규화에서 **蓝绿色**로 통일하고, `的的`, literal `\\n`, 연속 종결부호를 정리한다.

## 2. 생성·독해한 대표 조합

모든 샘플은 가상 입력으로만 생성했으며 DB 기록, 주문, 이메일 outbox를 만들지 않았다.

| 구분 | 조합 | PDF | 페이지 |
|---|---|---|---:|
| 기본 | 개인 심화 canonical fixture | `husimcolor-personal-deep-zh-CN-final-quality-v9-20261015.pdf` | 12 |
| 기본 | 부부·연인 canonical fixture | `husimcolor-couple-love-zh-CN-final-quality-v9-20261015.pdf` | 18 |
| 기본 | 엄마·딸 canonical fixture | `husimcolor-parent-child-zh-CN-final-quality-v9-20261015.pdf` | 17 |
| 추가 | 개인: 그린·오렌지·블랙 | `husimcolor-personal-green-orange-black-zh-CN-representative-v9-20261015.pdf` | 12 |
| 추가 | 남자친구·여자친구 | `husimcolor-couple-boyfriend-girlfriend-zh-CN-representative-v9-20261015.pdf` | 19 |
| 추가 | 아빠·아들 | `husimcolor-parent-child-father-son-zh-CN-representative-v9-20261015.pdf` | 17 |

## 3. 검증 결과를 구분하여 기록

### 자동·구조 검증

- `pnpm check` 통과.
- 집중 Vitest: `zhCnLocalizationCatalog`, `premiumPdfReport`, `couplePdfReport`, `parentChildPdfReport` 통과.
- 여섯 PDF의 추출 텍스트에서 다음 잔여 패턴을 검사해 모두 미검출: 한글, literal `\\n`, `的的`/`的 的`, `蒂尔`, `内心的纹理`, 기존 문장 파편, `爸爸对…来说`, 딸을 가리키는 `他`, 주체가 뒤바뀐 `替爸爸解决问题`.
- 기본 공개 샘플 PDF는 v9 기본 3종과 SHA-256이 각각 동일함을 확인했다. 즉 Preview 앱의 공개 샘플 파일은 첨부한 v9 기본 PDF와 같은 바이너리다.

### 실제 문장 독해·시각 검수

- 추가 개인의 25색 조합에서 `日常中的和谐与稳定` / `更有活力` / `让气氛轻松起来`, 세 색 통합, 준비 방향 완결 문장을 확인했다.
- 추가 연인의 감정 교류·표현 리듬에서 역할 주체, 조건절, 카드/색상 삽입 후 완결 문장을 확인했다.
- 기본 엄마·딸 및 추가 아빠·아들의 회복 순서에서 엄마/아빠가 먼저 듣고, 딸/아들이 정리할 여지를 갖는 주체·대상을 확인했다.
- PDF 페이지 PNG와 contact sheet로 CJK 글꼴 렌더링, 제목/첫 본문 배치, 잘림 여부를 확인했다.

## 4. 검수 범위의 한계 및 미검수 항목

**이 문서는 전 조합의 원어민 최종 승인 문서가 아니다.** v7에서 정적 UI/카탈로그와 기본 fixture를 넓게 읽었고, v8~v9에서 이번에 문제가 드러난 공통 조립 경로를 기본 3개 + 추가 3개 대표 조합으로 재검증했다.

아래는 아직 미검수 또는 별도 최종 검수가 필요한 범위다.

1. 25색 × 모든 심리카드/선택 순위의 완전 조합 및 모든 관계 역할 조합.
2. 실제 결제 후 신규 세션의 locale/copyVersion 영속성, 실제 Resend 수신. (코드·무발송 생성 경로만 검증했으며 실제 결제/메일은 의도적으로 실행하지 않았다.)
3. Android Chrome/Samsung Internet에서 실제 다운로드 후 파일앱 열기. (PDF 파일 자체는 생성·렌더링했지만 실기기 다운로드 E2E는 미수행.)
4. `https://husimcolor.com` 홈페이지. 현재 소스 작업본이 없어 앱 zh-CN과 동기화하지 못했다.
5. 간체 중국어 심리 코칭 카피 경험을 가진 원어민의 최종 언어/문화 적합성 검수.

## 5. 소스와 재생성 방법

- 공통 변환기: `lib/zh-cn-copy.ts`
- 완결 문장 override: `shared/locales/zh-cn-reviewed-output-overrides.ts`
- 템플릿: `shared/locales/zh-cn-template-catalog.ts`
- 정적 재검수 카탈로그: `shared/locales/zh-cn-static-revision-catalog.ts`
- 기본 PDF 생성: `pnpm exec tsx scripts/render-final-quality-zh-cn-samples.ts`
- 추가 대표 조합 생성: `SAMPLE_REPORT_LOCALE=zh-CN SAMPLE_REPORT_VARIANT=alternate pnpm exec tsx scripts/generate-public-sample-reports.ts`

영어는 `docs/localization/english-v4.2-pilot/`에 **보관만** 하며, 이번 v9 변경·배포 범위에는 포함하지 않는다.
