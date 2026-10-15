# HUSIM COLOR zh-CN v11.5 공개 샘플 열람·배포 준비 검증

- 작성일: 2026-10-15
- 기준 브랜치: `feat/zh-cn-full-localization-v11.3`
- 기준 소스 커밋: `1612109805cc095e9e2dfd98e8a5100fbb4cf216`
- 범위: 사용자 확인을 마친 zh-CN 3종 공개 샘플의 문안/메타데이터 보정, 앱 내 바로 열람, 익명 단계 측정, locale metadata migration의 비밀값 비노출 실행 경로

> 이 문서는 **운영 배포 완료 보고서가 아니다**. 코드·공개 샘플·회귀 검증은 완료했으나, Production `DATABASE_URL`을 Actions secret으로 주입할 수 없어 schema migration과 운영 배포는 아직 실행하지 않았다.

## 1. 이번 반영 사항

| 구분 | 적용 내용 | 공통 적용 경로 |
|---|---|---|
| 개인 PDF 5쪽 | `成长潜力` → **`需要留意的倾向`** | zh-CN 정적/템플릿 catalog 및 개인 PDF 렌더 경로 |
| 개인 PDF 11쪽 | `今日专属恢复例程` → **`今日自我照顾建议`** | 개인 결과·개인 PDF 공통 copy |
| 부모·자녀 PDF 9쪽 두 번째 실천 | **`在气氛变得尴尬时，女儿可以先说一句“我现在想休息一下”；妈妈收到这个信号后，可以先给她20分钟的空间。`** | 역할별 zh-CN reviewed override/template |
| 부부 공개 샘플 4쪽 | `情感交流`·`表达节奏`을 조각식 “显示出……的流动” 표현으로 만들지 않고, 사람·경향·상황을 주어로 한 검수 문단으로 복원 | `zh-cn-reviewed-output-overrides.ts`와 `zh-cn-copy.ts`의 관계 카드 문단 재조립 |
| 관계 PDF 문서 제목 | zh-CN 공개/실제 결과 PDF metadata를 `HUSIM COLOR 夫妻／恋人关系报告`, `HUSIM COLOR 亲子色彩心理辅导报告`로 변경 | `server/couple-pdf-report.ts`, `server/parent-child-pdf-report.ts` |
| 공개 샘플 열람 | 버튼이 `/sample-report` 앱 화면으로 이동하고, 웹은 same-origin `iframe`의 `inline` PDF를 사용. 다운로드와 새 창 열기는 별도 제어 | `app/(tabs)/sample-report.tsx`, `shared/sample-reports.ts`, 공개 API/service |
| 선택 언어 고정 | `product`와 `locale`을 명시한 API URL로 6개 파일을 분리. zh-CN 파일을 못 불러오면 중국어 오류·재시도·새 창/다운로드 대안을 표시하며 한국어로 조용히 대체하지 않음 | 공개 sample metadata/API/viewer |
| 캐시 | PDF viewer가 이전 언어/문서 metadata를 유지하지 않도록 `Cache-Control: no-cache, max-age=0, must-revalidate` | Vercel API와 Express 개발 호환 route |
| 익명 측정 | `sample_view`, `sample_load_failed`, `sample_product_explore`와 `commerce_checkout_opened`, `commerce_payment_requested`, `commerce_payment_completed`, `commerce_analysis_started`를 상품·locale·단계만으로 구분하고 화면 세션에서 중복을 차단 | 기존 `visitor_logs` API (`visitType: premium`, `testType`) |

### 부부 PDF 4쪽 최종 독해 확인

두 문단은 공통 생성 결과에서 아래와 같이 확인했다.

> `从两人潜意识里呈现的倾向来看，丈夫可能希望把多个新的开始归拢到一个方向；妻子则可能更信赖深层的共情和直觉，也会从中寻找意义。……当共同生活中的情绪出现错位时，如果能用一句话说清自己需要怎样的回应，彼此猜测的空间可能会减少。`

> `从两人此刻的状态来看，丈夫可能更倾向于先梳理状况，再寻找平衡；妻子则可能更倾向于在感到安全时说出积压的情绪，并整理内心。……可以先说清楚：是想立刻回应，还是想整理好想法后再说，以便尊重彼此不同的节奏。`

검수 기준은 사람을 주체로 유지하고, 색상은 해석의 참고로만 연결하며, `可能/更倾向于`로 경향성을 보존하는 것이다. 기존에 승인된 다른 zh-CN 문안은 되돌리지 않았다.

## 2. 공개 샘플 바로 열람 동작

### 설계

1. **웹**: 첫 진입은 `GET/HEAD`로 PDF 응답을 확인한 뒤 same-origin `<iframe>`에서 PDF viewer를 연다. PDF viewer가 range 요청을 사용하므로 앱이 고해상도 페이지 이미지를 한꺼번에 로드하지 않는다.
2. **모바일 네이티브**: 기기 PDF 엔진이 WebView보다 안정적인 경우가 있어 시스템 브라우저/뷰어로 `inline` URL을 우선 연다. 그 화면에서 확대·스크롤·뒤로가기와 기기 기본 다운로드 기능을 사용한다.
3. **선택 다운로드**: `download=1`일 때만 `Content-Disposition: attachment`이며, 기본 열람은 `inline`이다.
4. **예외**: viewer 불러오기 실패 시 현재 언어의 오류 안내, 재시도, 새 창에서 열기, 다운로드를 제공한다. 로그인·이메일 입력은 요구하지 않는다.
5. **상품 연결**: 뷰어 하단의 한국어 `이 분석 알아보기 →` / 중국어 `了解这项分析 →`가 해당 상품 진입 화면으로 돌아간다.

### 자동·브라우저 확인 결과

| 검증 | 결과 |
|---|---|
| 한국어/zh-CN × 개인·부부/연인·부모자녀 6개 `inline` endpoint | 모두 `200`, `application/pdf`, `inline`, 각 locale 고유 파일명 반환 |
| 같은 6개 선택 다운로드 endpoint | 모두 `attachment`, 각 locale 고유 파일명 반환 |
| 일반 및 byte-range 응답 | `Accept-Ranges: bytes`, range `206` 구현 확인 |
| 언어 캐시 방지 | 6개 응답 모두 `no-cache, max-age=0, must-revalidate` 반환 |
| 브라우저 zh-CN 부부/연인 열람 | inline viewer에서 18쪽 thumbnail, 확대·스크롤 제어, 중국어 화면 copy 및 zh-CN PDF metadata 확인 |
| 브라우저 zh-CN 부모자녀 열람 | inline viewer에서 17쪽 thumbnail, zh-CN UI/PDF metadata 확인 |
| 브라우저 한국어 부모자녀 열람 | 같은 product에서 한국어 UI/PDF metadata가 반환되는 것 확인 |
| 브라우저 확대 제어 | 80% → 88% 동작 확인 |
| 브라우저 새 창 대안 | 현재 locale의 `inline` PDF endpoint가 새 창에서 열리는 것 확인 |
| 브라우저 뒤로가기 | 부부/연인 sample에서 상품 선택 화면으로 정상 복귀 확인 |

`sampleReports.test.ts`는 6개 locale/product URL과 inline/download 분기, range, same-origin viewer, fallback 금지, 이벤트 중복 차단을 회귀 단언한다.

## 3. PDF·문안 산출물 확인

새로 생성해 `public/sample-reports/`에 반영한 zh-CN 공개 샘플은 다음과 같다.

| 상품 | 파일 | 확인 내용 |
|---|---|---|
| 개인 심화 | `husimcolor-personal-deep-zh-CN-sample.pdf` | 12쪽, `需要留意的倾向`, `今日自我照顾建议`, metadata `HUSIM COLOR 个人色彩心理报告` |
| 부부·연인 | `husimcolor-couple-love-zh-CN-sample.pdf` | 18쪽, 4쪽 두 관계 문단 복원, metadata `HUSIM COLOR 夫妻／恋人关系报告` |
| 부모·자녀 | `husimcolor-parent-child-zh-CN-sample.pdf` | 17쪽, 9쪽 두 번째 실천 반영, metadata `HUSIM COLOR 亲子色彩心理辅导报告` |

PDF 텍스트 추출과 대상 페이지 PNG 렌더링으로 제목·문안·줄바꿈을 확인했다. 사용자는 앞서 기존 Android에서 3종 샘플 PDF의 다운로드·열기를 확인했다. **이번 신규 앱 내 열람 UI의 Android 실기기 확대·스크롤·뒤로가기·실패 fallback은 agent가 실기기에서 직접 확인하지 못했으므로 운영 후 실제 기기 확인 항목으로 남긴다.**

## 4. 관계 상품 비운영 E2E 상태

v11.4에서 Production과 분리한 local MariaDB, synthetic entitlement, `HUSIM_DISABLE_EMAIL_DELIVERY=1` 환경으로 부부/연인 및 부모/자녀 초대→양쪽 검사 완료→저장→재조회→private PDF 접근까지 검증했다.

- 새 relationship snapshot의 `locale=zh-CN`, `copyVersion=zh-CN-2026-10-15-v11.1` 저장/재조회 확인
- stored locale에 따라 PDF·attachment filename이 zh-CN으로 유지되는 것 확인
- email outbox는 `queued`, `attemptCount=0`; 실제 Resend 요청/메일 발송 없음
- 이 문서 시점에는 synthetic DB·storage·token·서버를 삭제하여 재사용하거나 백업하지 않았다.

이는 공개 샘플 열람 확인과 별개의 **비운영 관계 흐름 E2E** 증빙이다. 기존 Production 고객 결과·PDF·주문·outbox를 읽거나 바꾸지 않았다.

## 5. 운영 locale/copyVersion migration: 준비 완료, 실행 보류

### 필요한 additive schema

`0020_locale_snapshot_metadata.sql` 및 runner는 아래 nullable metadata만 추가한다.

| 테이블 | 열 | 타입 |
|---|---|---|
| `analysis_runs` | `locale`, `copyVersion` | `varchar(12) NULL`, `varchar(80) NULL` |
| `relationship_sessions` | `locale`, `copyVersion` | `varchar(12) NULL`, `varchar(80) NULL` |
| `email_outbox` | `locale`, `copyVersion` | `varchar(12) NULL`, `varchar(80) NULL` |

- 기존 행 update 없음, 결과/PDF/outbox 재생성·재발송 없음, `DELETE`/table deletion statement 없음
- workflow는 실행 전 `SHOW CREATE TABLE`과 각 affected table row count를 artifact에 기록한다.
- migration 후 column type/nullability, table row count 전후 비교를 검증한다.
- rollback 원칙: 새 결과 생성 후에는 column을 삭제하지 않는다. 애플리케이션만 직전 revision으로 되돌려 기존 한국어 결과와 nullable metadata column을 보존한다.

### 현재 blocker와 보안 해결

기존 workflow의 `vercel env pull`은 Vercel 정책상 Production `DATABASE_URL`을 `[SENSITIVE]`로 치환해 DB URL parsing 전에 중단됐다. 이 값은 log나 repository에 노출되지 않았다.

v11.5 workflow는 Vercel env pull을 제거하고 Actions runtime의 `secrets.HUSIM_PRODUCTION_DATABASE_URL`만 `DATABASE_URL` 환경변수로 주입한다. 값은 파일로 쓰지 않고, echo/업로드/deployment client bundle에 포함하지 않는다. absent/redacted/invalid URL은 DB 연결 전에 중단한다.

**이 secret은 현재 권한으로 추가할 수 없다.** 배포 재개 전 repository administrator가 GitHub `husimcolor/husimcolor`의 다음 위치에서 한 번만 설정해야 한다.

> **Settings → Secrets and variables → Actions → New repository secret**
>
> Name: `HUSIM_PRODUCTION_DATABASE_URL`
>
> Value: Vercel Production에 이미 설정된 `DATABASE_URL`의 전체 connection URL

Vercel secret 값을 채팅에 보내거나 issue/PR/comment/문서에 복사하지 않는다. 설정 후 사용자가 “secret 설정 완료”라고 알려주면, 승인된 workflow를 `APPLY_PRODUCTION_ZH_CN_LOCALE_MIGRATION` confirmation으로 실행하고 schema backup artifact·migration report를 확인한 뒤에만 app PR merge/deploy를 진행한다.

## 6. 실행한 검증

| 명령/검증 | 결과 |
|---|---|
| `pnpm check` | 통과 |
| 핵심 회귀: sample/viewer, locale snapshot, outbox safety, PDF filename/download, 개인·부부·부모자녀 PDF, zh-CN catalog, migration policy | 10 files / 51 tests 통과 (migration test 보정 뒤 재실행으로 migration+sample 2 files / 9 tests도 통과) |
| 전체 Vitest (외부 credential integration 1개 제외, 직렬) | **90 files / 378 tests 통과** |
| `tests/tossTestCredentials.integration.test.ts` | 미실행/실패로 처리하지 않음. 현재 Sandbox에 `TOSS_TEST_SECRET_KEY`가 없으며 외부 API 인증 검사라 이번 UI/locale 변경 검증 범위에서 제외 |
| `npx expo export --platform web` | 통과, `/sample-report` 포함 static routes 56개 생성 |
| PDF 파일/문안 | zh-CN 3종 재생성, page count/title/대상 문안 텍스트 추출 및 대상 페이지 렌더 확인 |
| 공개 sample API | 6 locale/product 조합과 inline/download header, cache, range 확인 |
| Sandbox browser | zh-CN/한국어 sample 열람, 확대, 새 창, 복귀 확인 |

## 7. 미확인·별도 범위

1. **Production migration/배포**: secret 미설정으로 아직 실행하지 않았다.
2. **실기기 신규 열람 UX**: 앞선 기존 PDF 다운로드·재열기는 사용자 확인 완료이나, 이번 앱 내 열람 화면의 Android 기기 UI는 미확인이다.
3. **실제 결제·실제 이메일**: 이번 검증에서 실행하지 않았다. 기존 결제/쿠폰 로직은 변경하지 않았으며 email delivery는 E2E에서 강제 비활성화했다.
4. **외부 중국 본토 원어민 최종 감수**: 자동 검사와 agent 문장 독해는 원어민 심리·코칭 카피 감수를 대체하지 않는다.
5. **`husimcolor.com` 별도 홈페이지**: 소스 접근 권한이 없어 앱과 분리된 미완료 범위다. 이번 변경은 Expo/Vercel 앱과 공개 sample API에만 적용된다.

## 8. 배포 순서

1. repository administrator가 Actions secret을 안전하게 설정
2. workflow로 schema artifact 생성 → targeted additive migration → report/row count 확인
3. v11.5 review branch의 tests/Preview를 재확인
4. `main` fast-forward merge 및 기존 공식 deploy workflow 실행
5. 운영 주소에서 한국어 기본, zh-CN 선택, 무료 흐름, 6개 sample viewer URL을 smoke test
6. 오류 시 app revision만 직전 main으로 rollback; existing rows, PDFs, orders, outbox, emails는 보존
