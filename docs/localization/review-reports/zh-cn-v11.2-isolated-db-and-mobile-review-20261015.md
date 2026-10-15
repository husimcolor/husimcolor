# zh-CN v11.2 — 분리 DB 저장 검증 및 휴대폰 검토 경로

- **기준 번역 문안 버전:** `zh-CN-2026-10-15-v11.1`
- **검증 기록 버전:** v11.2
- **검증일:** 2026-10-15
- **기준 검토 브랜치:** `feat/zh-cn-full-localization-v11.1` (`09c273ab460b43f207a317fc59b26636fe1a2af0`)
- **운영 배포:** 수행하지 않음
- **운영 DB migration:** 수행하지 않음
- **실제 이메일·Resend 호출:** 수행하지 않음

## 목적과 범위

이 기록은 v11.1의 중국어 문안 자체를 다시 번역한 작업이 아니다. 다음 두 가지를 확인한다.

1. **새 zh-CN 결과의 저장 언어 고정:** 결과 생성 시 저장한 `locale`과 `copyVersion`이, 이후 기기 언어가 한국어로 바뀌어도 결과 화면·PDF·발송 대기 이메일에 일관되게 적용되는지 확인한다.
2. **검토용 휴대폰 경로:** 운영 DB·결제·고객 결과·이메일 API 없이 중국어 무료 흐름과 세 공개 샘플 PDF를 확인할 수 있는 별도 정적 사이트를 제공한다.

## 분리 테스트 DB 실증

### 격리 원칙

- `/tmp` 아래에 만든 **로컬 MariaDB 10.11** 인스턴스, 데이터베이스 `husim_zhcn_test`만 사용했다.
- 프로젝트의 전체 SQL migration과 `0020_locale_snapshot_metadata.sql`을 이 임시 DB에만 적용했다.
- 운영 DB URL, 운영 DB migration, 기존 고객·주문·결과·저장 PDF·outbox 행은 사용하거나 변경하지 않았다.
- 입력은 가상 식별자와 `invalid.example` 도메인 이메일뿐이다. 실제 고객 개인정보·실제 이메일 주소·결제 데이터는 사용하지 않았다.
- 테스트 DB의 `email_outbox`는 **`queued` 행을 저장하고 재조회**했을 뿐, `deliverPrivatePdfOutboxItem()` 또는 Resend 전송 함수를 호출하지 않았다.
- 테스트 DB에는 TLS가 없으므로 `DATABASE_SSL_DISABLED=true`를 명시한 테스트 프로세스에서만 TLS를 끈다. 앱 기본 연결은 TLS를 계속 요구하며, 배포 환경에서는 이 플래그를 설정하지 않는다.

### 저장·재조회 결과

| 검증 대상 | 저장값 | 재조회 및 출력 확인 | 판정 |
|---|---|---|---|
| 새 중국어 분석 결과 | `analysis_runs.locale = zh-CN`, `copyVersion = zh-CN-2026-10-15-v11.1` | `resolveStoredResultLocale()`가 기기 언어를 `ko`로 가정한 뒤에도 `zh-CN`을 반환 | 통과 |
| 새 중국어 PDF | 저장된 locale으로 `localizePayload()` 후 실제 PDF 생성 | `推荐调和色`, `主要心理特征` 존재 / `추천 보완컬러` 부재 | 통과 |
| 발송 대기 outbox | `email_outbox.status = queued`, `locale = zh-CN`, 동일 copyVersion | 중국어 제목 `[HUSIM COLOR] 您的分析报告（PDF）` 및 중국어 HTML 본문 생성 | 통과 |
| 과거 locale 없는 결과 | `locale = NULL`, `copyVersion = NULL` | 한국어 fallback `ko`, PDF에 `추천 보완컬러`, `주기질` 유지 | 통과 |
| 실제 이메일 발송 | 호출하지 않음 | outbox는 `queued` 상태 그대로 | 비발송 확인 |

재현 스크립트는 `scripts/verify-zh-cn-locale-test-db.ts`이며, 테스트 결과의 비밀값 없는 요약은 `docs/localization/test-db-proofs/locale-persistence-proof-v11.2-20261015.json`에 보관한다.

### 코드 보완

- `server/commerce/email-outbox-service.ts`: 제목과 본문을 함께 생성하는 `getAnalysisResultEmailPayload(locale)`를 추출했다. 기존 전달 함수도 같은 helper를 사용하므로 저장 locale에 따라 제목과 본문이 분리될 위험을 줄였다.
- `server/db.ts`: 기본 TLS 연결은 보존하되, **명시적인 테스트 전용** `DATABASE_SSL_DISABLED=true`일 때만 TLS 없는 로컬 DB 접속을 허용했다.
- `tests/localeSnapshotPersistence.test.ts`: zh-CN/legacy 결과 fallback 및 outbox 제목·본문 언어를 회귀 검사한다.

## 관련 자동 검사

| 검사 | 결과 |
|---|---|
| `pnpm check` | 통과 |
| `tests/localeSnapshotPersistence.test.ts` | 통과 (3 tests) |
| `tests/premiumPdfReport.test.ts` | 통과 (12 tests) |
| 합계 | 2 files / 15 tests 통과 |

## 휴대폰 검토 경로

### SSO 없는 정적 검토본

- 주소: `https://8123-iexhyx80rvo9g65cc5q2a-64a473f3.sg2.manus.computer`
- 구성: zh-CN 선택이 가능한 정적 앱, 무료 3색 선택·결과, 세 상품의 최신 공개 zh-CN 샘플 PDF
- 제외: DB, 로그인, 주문, 결제, 실제 이메일·outbox 전달, 기존 고객 결과
- 확인된 응답: 홈 HTML과 개인·부부/연인·부모/자녀 PDF가 모두 `200`, `application/pdf`로 응답

### Vercel 검토 Preview

- v11.1 Preview: `https://husimcolor-qn922tjh1-husimcolors-projects.vercel.app`
- 이 URL은 Vercel SSO 보호가 걸려 있어, 프로젝트 권한이 있는 계정 로그인이 필요하다. 외부 검토에는 위의 SSO 없는 정적 검토본을 사용한다.

### Android 확인 순서

1. Chrome 또는 Samsung Internet에서 **정적 검토본** 주소를 연다.
2. 상단 언어에서 `简体中文`을 선택한다.
3. `免费体验`을 눌러 색상 세 개를 고르고 중국어 무료 결과를 확인한다.
4. 홈 또는 관계 상품 선택 화면에서 각 `查看 PDF 报告示例` 버튼을 누른다.
5. 브라우저 PDF 뷰어의 다운로드 버튼을 눌러 기기에 저장한다.
6. Android 파일 앱(Downloads)에서 다운로드한 PDF를 다시 열어, 제목·본문·폰트·줄바꿈과 `推荐调和色` 표기를 확인한다.

## 아직 확인하지 않은 항목

- **Android 실제 기기 다운로드·파일 앱 재열기:** 이 환경에서 실제 Android 기기를 제어하지 못하므로 미확인이다. 위 절차로 사용자 확인이 필요하다.
- **실제 로그인 후 개인/관계 신규 결과 생성 UI와 DB write의 브라우저 E2E:** 분리 DB에서는 저장·재조회·PDF·queued outbox를 직접 검증했으나, 로그인된 모바일 브라우저의 전체 API 흐름은 미확인이다.
- **실제 이메일 수신:** 의도적으로 미실행이다.
- **운영 DB migration·Production:** 의도적으로 미실행이다.
- **홈페이지 `husimcolor.com`:** 앱과 별도 소스가 제공되지 않아 미완료다.
- **영어 v4.2:** 보관만 하며 변경·배포하지 않았다.

## 재생성·보관 위치

- zh-CN 공통 문안: `shared/locales/zh-cn-*.ts`, `lib/zh-cn-copy.ts`
- 문안 버전·용어: `shared/localization.ts`
- 대표 PDF 생성: `scripts/render-final-quality-zh-cn-samples.ts`, `scripts/generate-public-sample-reports.ts`
- 분리 DB 검증: `scripts/verify-zh-cn-locale-test-db.ts`
- 문안/대표 PDF 검토 기록: `docs/localization/review-reports/`
- 영어 보관: `docs/localization/english-v4.2-pilot/`
