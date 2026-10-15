# HUSIM COLOR 간체 중국어 v11.3 격리 E2E 검증 기록

- **검증일:** 2026-10-15
- **대상 소스 기준:** `feat/zh-cn-full-localization-v6`의 v11.2 기준 위에 반영한 미커밋 v11.3 변경
- **대상 언어:** 간체 중국어(`zh-CN`), copyVersion `zh-CN-2026-10-15-v11.1`
- **운영 영향:** 없음. Production main 병합·배포, Production DB migration, 실제 고객 데이터 변경, 실제 이메일 발송을 수행하지 않았다.

## 1. 이번 묶음의 목적

정적 화면 또는 DB 단위 확인만으로 전체 흐름을 통과로 표시하지 않고, 분리한 로컬 환경에서 **앱 화면 → 신규 개인 결과 생성·저장 → 저장 결과 재조회 → 보관 PDF 다운로드 → 발송 대기 이메일 metadata**를 확인한다.

## 2. 분리 환경과 안전 경계

| 항목 | 사용 값 / 상태 |
|---|---|
| 앱 웹 | Expo Metro `8081` |
| API | 로컬 Express `3000` |
| DB | 로컬 MariaDB `3308`, 데이터베이스 `husim_zhcn_e2e` |
| 입력 데이터 | `invalid.example` 도메인의 가상 고객·가상 entitlement만 사용 |
| PDF 저장소 | 로컬 private storage |
| 이메일 | `HUSIM_DISABLE_EMAIL_DELIVERY=1`; provider 호출을 차단하고 outbox를 `queued`로 유지 |
| 운영 DB / 스토리지 | 연결하거나 읽지 않음 |

개발 Express에는 Vercel의 private PDF endpoint와 동등한 **GET/HEAD 전용 개발 호환 route**를 추가했다. 이 route는 이미 생성된 private document만 읽어 반환하며, PDF 재생성, outbox 생성, 이메일 전송을 수행하지 않는다.

> 주의: 안전 게이트를 적용하기 전의 초기 synthetic record(id=1)는 `invalid.example` 주소를 대상으로 `sent`가 된 이력이 있다. 실제 고객 또는 실재 주소에는 보내지 않았지만, 이를 “모든 E2E 메일이 전혀 시도되지 않았다”고 표현하지 않는다. 이번 최종 확인 대상 record(id=2)는 게이트 적용 후 생성됐으며 `queued`, `attemptCount=0`을 유지했다.

## 3. 실제 앱 흐름 확인

### 3.1 생성과 저장

격리 브라우저에서 다음 순서를 실제 앱 화면으로 진행했다.

1. 기본 언어 상태에서 **简体中文** 선택
2. 가상 entitlement로 개인 정보 입력
3. 컬러 3개 선택
4. 심리카드 3장 선택
5. 개인 심화 결과 화면 진입 및 private PDF/outbox 생성

생성된 기록은 `analysis_runs.id=2`이며, 확인 시 아래 상태였다.

| 항목 | 확인값 |
|---|---|
| result 상태 | `completed` |
| 저장 locale | `zh-CN` |
| 저장 copyVersion | `zh-CN-2026-10-15-v11.1` |
| private document | `generated` |
| outbox | `queued` |
| outbox attemptCount | `0` |
| outbox locale / copyVersion | `zh-CN` / `zh-CN-2026-10-15-v11.1` |

### 3.2 저장 결과 재조회와 전역 언어 분리

초기 재개 시 결과 화면이 계속 “카드 정보를 불러오는 중...”에 머물렀다. 원인은 앱 source가 아니라, 외부 worktree의 `node_modules` 심볼릭 링크를 Metro가 따라가면서 잘못된 bundle URL을 내보낸 **로컬 E2E 런타임 문제**였다. E2E worktree에 독립 `node_modules`를 두고 Metro를 cache clear로 재기동한 뒤 최신 source bundle이 로드됨을 확인했다.

그 뒤 전역 선택 언어 저장값을 `ko`로 바꾸고 `/premium-result`을 다시 열었다. 저장된 delivery의 locale/copyVersion을 우선하는 결과 scope가 적용되어, 화면은 계속 중국어로 표시됐다. 확인된 화면에는 다음이 보였다.

- `我的色彩心理解读`
- `潜意识` / `当前状态` / `恢复方向`
- `推荐调和色`
- `绿色所呈现的恢复与平衡、橙色所呈现的活力与黑色所呈现的保护感……`

화면 캡처: `docs/reports/zh-cn-v11.3-e2e-evidence/personal-result-zh-cn-after-global-ko-20261015.webp`

### 3.3 결과 화면 PDF 다운로드

결과 화면의 `下载 PDF 报告` 버튼을 실제로 작동시켜 다음을 확인했다.

1. web runtime이 Metro origin `8081`이 아닌 API origin `3000`의 `/api/private-pdf-download`에 **HEAD** 요청함
2. HEAD 응답이 `200`, `application/pdf`였음
3. 같은 private GET URL을 anchor download로 전달함
4. 동일한 browser context에서 GET 응답이 `200`, `application/pdf`, `213,590 bytes`였음
5. 다운로드/GET 뒤 DB의 private document는 계속 `generated`, outbox는 계속 `queued`, `attemptCount=0`이었음

이 경로는 기존 private PDF를 읽기만 한다. 결과 화면에서 재생성 POST 또는 outbox 재적재로 돌아가지 않는다. 별도 직접 read-only 검증에서는 중국어 본문과 `HUSIM_COLOR_个人深度分析报告.pdf` attachment filename header를 확인했다. 파일명 정책은 회귀 테스트에서도 개인·부부/연인·부모/자녀 zh-CN 이름을 검사한다.

### 3.4 기존 한국어 fallback

기존 locale이 없는 snapshot은 `resolveStoredResultLocale(undefined) === "ko"`로 처리됨을 회귀 테스트로 확인했다. Production의 기존 고객 결과는 안전 경계에 따라 조회·변경하지 않았다.

## 4. 이번 source 보정

| 범주 | 반영 내용 |
|---|---|
| 상품 샘플 버튼 | 개인 `查看个人深度分析报告示例`, 부부·연인 `查看夫妻／恋人关系报告示例`, 부모·자녀 `查看亲子关系报告示例`로 통일 |
| 개인 컬러/심리카드/결과 UI | E2E 중 확인한 한국어 잔여 static UI 및 동적 문장 경로를 zh-CN catalog로 보정 |
| 결과 문장 | 컬러의 일반 키워드 `회복`을 역할명 `恢复方向`으로 오인하지 않도록, 결과 조립 시 `恢复与平衡`으로 자연스럽게 재구성 |
| private PDF 다운로드 | web에서 sandbox API origin을 사용하고, Vercel/일반 도메인에서는 same-origin으로 안전하게 fallback |
| 파일명 | saved locale을 기준으로 private personal/relationship download 및 이메일 첨부 파일명에 zh-CN 명칭 적용 |
| E2E 안전 | development read-only PDF route 및 명시적 email disable runtime gate 추가 |

## 5. 자동 검증

새로운 물리적 `node_modules` 작업 트리에서 symlink 재귀 없이 아래 명령을 실행했다.

```bash
pnpm check
pnpm exec vitest run \
  tests/zhCnLocalizationCatalog.test.ts \
  tests/free-test-ui-labels.test.ts \
  tests/sampleReports.test.ts \
  tests/premiumPdfReport.test.ts \
  tests/couplePdfReport.test.ts \
  tests/parentChildPdfReport.test.ts \
  tests/localeSnapshotPersistence.test.ts \
  tests/pdfDeliveryPolicy.test.ts \
  tests/kakaoPdfDownload.test.ts \
  tests/privatePdfDeliveryLoader.test.ts \
  tests/emailOutboxPolicy.test.ts \
  tests/storageBackend.test.ts
```

결과는 TypeScript 성공, **12 test files / 68 tests 통과**다. 과거의 symlink 재귀로 부풀려진 `123 files / 492 tests` 수치는 유효한 결과가 아니므로 사용하지 않는다.

이 자동 검증이 보장하는 범위:

- zh-CN catalog, 샘플 링크와 공개 샘플 규칙
- 개인/부부·연인/부모·자녀 PDF payload와 locale 규칙
- 저장 locale/copyVersion 우선 및 legacy Korean fallback source contract
- zh-CN private filename policy
- personal/relationship private GET 경로와 development compatibility route의 source contract
- 명시적 E2E email-disable gate
- ambient Forge credential이 있더라도 명시적으로 설정한 non-production local storage가 우선하고, Production에서는 local test storage를 선택하지 않는 안전 경계

## 6. 검증 범위의 구분

| 범위 | 상태 | 근거 |
|---|---|---|
| 개인 심화 화면→생성→저장→재조회→PDF private GET→queued outbox | **격리 E2E 확인** | 실제 browser/API/DB record id=2 |
| 전역 ko 전환 뒤 저장된 zh-CN 개인 결과 언어 유지 | **격리 browser 확인** | 결과 locale scope 및 캡처 |
| 개인 PDF 중국어 본문 / 페이지 수 / 파일명 | **read-only 다운로드 확인** | 저장 private PDF 및 filename policy |
| 이메일 subject/body/attachment locale | **무발송 helper·source·outbox metadata 확인** | payload helper, filename policy, queued record |
| 부부·연인 / 부모·자녀 실제 유료 초대→완료→저장→재조회 UI E2E | **미수행** | shared route/PDF/sample tests와 대표 PDF 검수만 수행 |
| Android Files 앱에서 3개 공개 샘플 PDF 다운로드·재열기 | **사용자 확인 대기** | 에이전트가 실제 Android 기기 파일 앱을 조작할 수 없음 |
| 중국 본토 원어민 최종 문체 감수 | **권장, 미수행** | 기계 검사와 문장 독해는 원어민 출판 감수가 아님 |
| 별도 홈페이지 `husimcolor.com` 중국어 적용 | **미완료** | homepage source 접근 권한 없음 |

## 7. 다음 배포 전 조건

1. 사용자가 Android에서 개인·부부/연인·부모/자녀 중국어 공개 샘플 PDF를 다운로드 후 Files/Downloads에서 재열기 확인
2. 필요하다면 중국 본토 원어민의 심리·자기돌봄 문체 최종 감수
3. 이 변경만 담은 검토 PR을 확인
4. 명시적 배포 승인 후에만 Production migration과 공식 deploy 경로를 별도 실행

Production migration은 아직 실행하지 않았다. 필요한 migration은 기존 데이터를 재생성하지 않는 `drizzle/0020_locale_snapshot_metadata.sql`이며, 운영 적용 전에는 현재 main schema·백업·복구 절차를 다시 확인한다.
