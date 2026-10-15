# 한국어 공개 샘플 바로 열람 분리 배포 검증 보고서

- 검증일: 2026-10-15 (KST)
- 대상 브랜치: `feat/ko-sample-viewer-db-free`
- 기준: `github-production/main`에서 분기한 **한국어 공개 샘플 열람 기능만**
- 상태: 코드·로컬 검증 완료, 이 문서 작성 시점에는 GitHub 게시·Production 병합·배포 전

## 1. 이번 분리 범위

| 포함 | 설명 |
|---|---|
| 한국어 공개 샘플 3종 | 개인 심화, 부부·연인, 부모·자녀의 기존 가상 데이터 PDF만 사용 |
| 앱 내 열람 | 웹에서는 same-origin inline PDF viewer, 모바일 앱에서는 시스템 PDF 엔진을 쓰는 앱 내 브라우저를 우선 사용 |
| 선택 다운로드 | 열람 화면의 별도 `PDF 다운로드` 버튼만 `attachment` 응답을 요청 |
| 대체 동작 | 로드 실패 시 재시도와 새 창 열기, 새 창 열기와 다운로드 버튼 제공 |
| 상품 연결 | `이 분석 알아보기 →`는 기존 상품 안내/결제 진입 화면으로만 이동 |

## 2. 명시적으로 제외한 범위

다음은 이 분리 배포에 **포함하지 않았다**.

- zh-CN locale, zh-CN 공개 샘플 및 locale/copyVersion 렌더링 코드
- `0020_locale_snapshot_metadata.sql` 또는 그 밖의 DB migration
- DB schema, 주문, entitlement, 결제·쿠폰 로직 변경
- 고객 개인 PDF, delivery token, 결과 재생성, 이메일 큐·재발송
- 로그인 또는 이메일 입력 요구
- 방문·결제 측정 스키마 변경 및 새 이벤트 저장

## 3. 구현 경계

`api/public-sample-report`와 `server/public-sample-report-service`는 `personal_deep`, `couple_love_deep`, `parent_child_deep` allow-list의 한국어 정적 PDF만 읽는다. 고객 PDF service·DB·주문·outbox를 import하거나 호출하지 않는다.

| 경로 | 응답 | 목적 |
|---|---|---|
| `/api/public-sample-report?product=<상품>` | `Content-Disposition: inline` | 앱 내/새 창 바로 열람 |
| `/api/public-sample-report?product=<상품>&download=1` | `Content-Disposition: attachment` | 사용자가 누른 경우에만 다운로드 |

모든 응답에는 `application/pdf`, `X-Frame-Options: SAMEORIGIN`, `Accept-Ranges: bytes`, `no-cache`가 설정된다. 언어 전환 캐시나 중국어 fallback은 이번 한국어 전용 브랜치에 존재하지 않는다.

## 4. 실제 확인 결과

| 항목 | 결과 | 근거 |
|---|---|---|
| TypeScript | 통과 | `pnpm check` |
| 기능 집중 회귀 | 통과 | 3 files / 13 tests (`sampleReports`, `homeServiceEntry`, `koreanSampleViewerIsolation`) |
| HTTP inline 3종 | 통과 | 각 상품 `200`, `application/pdf`, `inline`, allow-listed filename |
| HTTP 다운로드 3종 | 통과 | 각 상품 `200`, `application/pdf`, `attachment`, allow-listed filename |
| range 요청 | 통과 | 개인 샘플 `206`, `bytes 0-15`, `%PDF-` header |
| allow-list 밖 product | 통과 | `404`, 내부 경로 비노출 |
| Expo web export | 통과 | `index.html` 생성 |
| Vercel function bundle 재현 | 통과 | `api/public-sample-report` bundle 및 한국어 PDF 3개 복사 확인 |
| 브라우저 바로 열람 | 통과 | 개인 12쪽, 부부·연인 18쪽, 부모·자녀 17쪽의 첫 페이지/thumbnail 표시 확인 |
| 브라우저 확대 | 통과 | PDF viewer 100% → 110% 확대 동작 확인 |
| 선택 다운로드 UI | 통과 | 버튼 클릭과 attachment endpoint 헤더 확인 |

## 5. 전체 회귀 실행의 해석

`tests/` 90개 파일을 실행하되 `tossTestCredentials.integration.test.ts`는 제외했다. 새 viewer와 무관한 기존 기대값/환경 설정 때문에 아래 5개가 실패했으며, 이를 이번 기능의 통과로 바꾸거나 수정하지 않았다.

1. `relationshipInviteFlow.test.ts` 1건: 과거 “정식 오픈 준비중” gate 문구를 기대함.
2. `paidAnalysisLaunchUi.test.ts` 2건: 과거 “정식 오픈 준비중” UI를 기대함.
3. `tossTestProvider.test.ts` 2건: 현재 환경에서 테스트 결제가 비활성(`TOSS_TEST_PAYMENT_DISABLED`)이라 mock provider 응답까지 도달하지 않음.

이들은 본 브랜치의 공개 PDF allow-list, viewer, 응답 헤더, 다운로드 구분, 또는 DB 분리와 관련이 없다. 위 3개 집중 파일의 13개 검사는 통과했고, Expo export·function bundle도 별도로 통과했다.

## 6. 미확인 항목

- 실제 Android/iOS 기기에서 Custom Tab/SFSafariViewController의 확대·스크롤·닫기 동작은 에이전트가 직접 수행할 수 없다. 코드상 `expo-web-browser`로 앱 내 브라우저를 우선 열도록 구현했고, Sandbox 웹 PDF viewer의 열람·확대는 확인했다.
- Production 배포 후의 실제 도메인 HTTP·첫 페이지 열람은 배포 완료 뒤 별도로 확인해야 한다.
- 중국어 전체 배포, locale metadata Production migration, locale 별 공개 샘플 6개 연결은 이 분리 배포에 포함하지 않았다.

## 7. 복구

이 변경은 DB migration·DB write가 없고 정적 공개 PDF viewer만 추가한다. 문제 발생 시 이 기능을 포함한 Git commit을 `main`에서 revert하면 `/api/public-sample-report`와 앱 내 열람 진입만 제거된다. 기존 정적 `/sample-reports/*.pdf` 링크, 고객 PDF, 주문, 이메일, DB는 변경되지 않는다.
