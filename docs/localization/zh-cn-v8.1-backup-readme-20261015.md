# HUSIM COLOR zh-CN v8.1 번역·검토 백업

- **언어/버전/날짜:** `zh-CN v8.1 · 2026-10-15`
- **소스 기준 커밋:** `fbdcd7cbaeb550140ca9efd07361d699cafc8767` — `fix: refine zh-CN teal recovery copy`
- **검토 브랜치:** `feat/zh-cn-full-localization-v6`
- **운영 상태:** 이 백업은 검토 브랜치 보관용입니다. `main` 병합, Production 배포, Production DB migration, 실제 이메일 발송은 하지 않았습니다.

## 1. 백업 범위

### zh-CN 원본과 공통 변환 경로

| 분류 | Git 경로 | 내용 |
|---|---|---|
| 공통 변환기 | `lib/zh-cn-copy.ts` | Korean canonical key 기반의 정적/해석/template/검수 override 우선순위, 조사·literal escape·`蒂尔` 정규화 |
| 정적 UI 카탈로그 | `shared/locales/zh-cn-static-catalog.ts` | 화면·버튼·안내의 대규모 정적 문안 |
| 정적 누락/재검수 문안 | `shared/locales/zh-cn-static-gap-catalog.ts`, `shared/locales/zh-cn-static-revision-catalog.ts` | 누락 보완 및 사람이 검수한 정적 문장 override |
| 해석 카탈로그 | `shared/locales/zh-cn-interpretation-catalog.ts` | 컬러·심리카드·결과 해석의 canonical source 대응 문안 |
| 문장 템플릿 | `shared/locales/zh-cn-template-catalog.ts` | 변수 삽입형 결과 문장의 완결 중국어 템플릿 |
| 실제 출력 override | `shared/locales/zh-cn-reviewed-output-overrides.ts` | 실제 상품 payload를 한중 대조해 수정한 역할·호칭·주체·완결 문장 |
| 무료 25색 문안 | `shared/locales/zh-cn-free-colour-copy.ts` | 무료 3색 결과의 25색 문안, 역할 라벨, 일상 실천 |
| locale 정의 | `shared/localization.ts` | `ko` 기본 / `zh-CN` locale 및 copy version 경계 |

### 용어집·대조표·검수 이력

| Git 경로 | 내용 |
|---|---|
| `docs/localization/zh-cn-style-and-terms-guide.md` | 고정 용어·문체 가이드 |
| `docs/localization/zh-cn-free-colour-source-comparison.md` | 무료 25색 한국어·중국어 대조 |
| `docs/localization/zh-cn-free-colour-combination-review.md` | 대표 무료 조합 대조·검토 |
| `docs/localization/zh-cn-v8.1-followup-copy-review-20261015.md` | v8.1 지정 문장 후속 보정, 범위·검증·미검수 항목 |

### 영어 v4.2 파일럿 — 보관만, 추가 구현·배포 보류

`docs/localization/english-v4.2-pilot/`에는 다음 파일을 별도 보관합니다.

- `en-pilot-korean-english-comparison-v4-2.md`: 한국어·영어 대조, 용어와 문체 변경 이력
- `en-personal-pilot.ts`: 영어 개인 심화 파일럿 locale source
- `en-pilot-pdf-report.ts`: 영어 파일럿 PDF source

이 폴더는 영어 확장 재개 시의 참조본이며, 이번 zh-CN 수정이나 Production에는 포함되지 않습니다.

## 2. 고정 용어

| 한국어 역할 | zh-CN |
|---|---|
| 주기질 | **主要心理特征** |
| 보조기질 | **辅助心理特征** |
| 선택 컬러 3번의 회복방향 | **恢复方向** |
| 심리카드 1번 무의식 | **潜意识** |
| 심리카드 2번 현재흐름 | **当前状态** |
| 심리카드 3번 회복방향 | **恢复方向** |
| 별도 추천 보완컬러 | **推荐调和色** |
| 틸 | **蓝绿色** |
| 브랜드 | **HUSIM COLOR** |

> 선택 컬러 3번의 `恢复方向`, 심리카드 3번의 `恢复方向`, 계산으로 별도 추천되는 `推荐调和色`는 서로 다른 역할이며 혼용하지 않습니다.

## 3. 최신 검토 샘플 PDF

백업 ZIP의 `samples/`에는 가상 데이터로 만든 다음 PDF만 포함됩니다. 실제 고객 정보·결과·private PDF는 포함하지 않습니다.

| 파일 | 입력/상태 |
|---|---|
| `husimcolor-personal-deep-zh-CN-final-quality-v8-20261015.pdf` | 기본 개인(레드·블루·화이트), v8 검수본 |
| `husimcolor-couple-love-zh-CN-followup-v8.1-20261015.pdf` | 기본 부부(남편·아내), v8.1 공통 문장 후속 수정 반영 |
| `husimcolor-parent-child-zh-CN-final-quality-v8-20261015.pdf` | 기본 부모·자녀(엄마·딸), v8 검수본 |
| `husimcolor-personal-deep-zh-CN-representative-alternate-v8-20261015.pdf` | 추가 개인(그린·오렌지·블랙) |
| `husimcolor-couple-love-zh-CN-representative-alternate-v8-20261015.pdf` | 추가 연인(남자친구·여자친구) |
| `husimcolor-parent-child-zh-CN-representative-alternate-v8-20261015.pdf` | 추가 부모·자녀(아빠·아들) |

`review-images/`에는 v8.1에서 다시 렌더링·독해한 부부 PDF의 블루그린 회복 문장 및 관계 성찰 문장 페이지 PNG가 있습니다.

## 4. 검수 완료와 미검수 범위

### 확인한 범위

- 공통 중국어 변환 path에서 `蒂尔 → 蓝绿色`, `的的`, literal `\\n`, 한국어 조사 잔여를 정규화
- 기본 개인/부부·연인/부모·자녀 및 추가 개인/연인/아빠·아들 **6개 가상 조합** PDF의 구조·역할/호칭 대표 검수
- v8.1에서 블루그린 회복 문장과 관계 성찰 문장이 공통 canonical source에서 변환되는지 TypeScript 및 집중 회귀 검사로 확인
- 기본 부부 v8.1 PDF 11쪽(블루그린 회복 문장), 14쪽(관계 성찰 문장)을 직접 PNG 렌더링해 확인

### 아직 미검수 또는 보류

- 모든 `25색 × 63심리카드 × 생활/역할 템플릿 × 모든 관계 호칭`의 전수 자연어 독해
- 중국 본토 심리·자기돌봄 카피 경험 원어민의 최종 문화·상업 카피 QA
- 홈페이지 `https://husimcolor.com`: **소스 접근 권한이 없어 미완료**
- 영어 전체 locale 확대와 배포: **보류**

따라서 이 백업은 발견된 공통 조립 오류를 수정하고 대표 출력으로 확인한 버전입니다. 모든 가능한 고객 조합이 원어민 수준의 자연스러움을 보장받았다고 선언하는 자료는 아닙니다.

## 5. 샘플 생성 방법

> 아래 명령은 검토용 **가상 데이터**만 생성합니다. 운영 DB, 결제, 기존 고객 결과, 기존 PDF, 이메일을 읽거나 바꾸지 않습니다.

```bash
cd /tmp/husimcolor-zh-cn-full-localization
pnpm exec tsx scripts/render-final-quality-zh-cn-samples.ts
```

- 기본 개인·부부·부모자녀 샘플을 `/home/ubuntu/husimcolor-zh-cn-final-quality-review-20261015-v8.1/sample-pdfs/`에 생성합니다.
- 추가 대표 조합 검수는 다음처럼 `generate-public-sample-reports.ts`를 사용합니다.

```bash
SAMPLE_REPORT_LOCALE=zh-CN \
SAMPLE_REPORT_VARIANT=alternate \
SAMPLE_REPORT_OUTPUT_DIR=/tmp/husimcolor-zh-cn-alternate-output \
pnpm exec tsx scripts/generate-public-sample-reports.ts
```

## 6. 민감 정보 제외 확인

이 백업은 `.env`, API 키, 토큰, 비밀번호, 고객 개인정보, 주문/결제 데이터, 실제 고객 결과·PDF, outbox 이메일을 포함하지 않습니다. 포함된 PDF는 모두 `虚拟数据`/가상 데이터 검토 산출물입니다.
