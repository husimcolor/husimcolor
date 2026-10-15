# HUSIM COLOR 한국어 공개 샘플 PDF.js 열람 백업 — 2026-10-16

## 기준

- 브랜치: `fix/ko-sample-pdfjs-viewer`
- 기준 소스 커밋: `71748c217e9516280a728b273ca9b1ab09482528` (`fix: render Korean public samples with PDF.js`)
- 범위: 한국어 공개 샘플 3종만. 중국어 locale source, locale DB migration, 고객 리포트, 고객 PDF, 주문·이메일, 로그인, 결제·쿠폰 변경은 제외한다.

## 포함 자료

| 경로 | 내용 |
|---|---|
| `app/(tabs)/sample-report.tsx` | 공개 샘플 열람 화면 및 native in-app browser 연결 |
| `shared/sample-reports.ts` | 공개 샘플 allow-list, web viewer, 다운로드, 이미지 URL 규칙 |
| `public/pdfjs/` | 정적 PDF.js module·worker·canvas reader HTML |
| `public/sample-report-pages/` | 공개 가상 샘플만의 fallback 페이지 JPEG |
| `tests/publicSampleCanvasViewer.test.ts` | PDF.js first-canvas·이미지 fallback·상태 회귀 |
| `tests/sampleReports.test.ts` | 공개 allow-list 및 URL 회귀 |
| `tests/homeServiceEntry.test.ts` | 상품 진입 화면의 공개 reader 연결 회귀 |
| `tests/koreanSampleViewerIsolation.test.ts` | 고객 문서/DB 비접근 경계 회귀 |
| `docs/reports/ko-public-sample-pdfjs-rendering-validation-20261016.md` | 검증 결과와 미확인 범위 |
| `docs/reports/evidence/ko-public-sample-pdfjs-canvas-mobile-20261016.png` | DevTools 모바일 크기 canvas 표시 근거 |

## 제외 자료

- `.env*`, 비밀키, 토큰, DB 접속 문자열
- 고객 데이터, 주문, 이메일 outbox, private storage, local database
- `node_modules`, build output, 임시 mobile screenshot/DevTools profile
- 중국어 locale migration 및 전체 zh-CN 배포 후보

## 재생성 방법

1. `pnpm install --frozen-lockfile`
2. `pnpm check`
3. `pnpm exec vitest run tests/sampleReports.test.ts tests/homeServiceEntry.test.ts tests/koreanSampleViewerIsolation.test.ts tests/publicSampleCanvasViewer.test.ts --maxWorkers=1 --no-file-parallelism`
4. `pnpm build`
5. `EXPO_USE_METRO_WORKSPACE_ROOT=1 pnpm exec expo export --platform web --output-dir /tmp/husimcolor-ko-pdfjs-export`

PDF.js viewer는 Production 웹에서 same-origin `/api/public-sample-report` endpoint를 fetch한다. API가 실패하면 `public/sample-report-pages/`의 같은 공개 샘플 페이지 JPEG가 표시된다.

## 미확인 항목

실제 Android 네이버 앱·카카오 인앱 브라우저의 운영 배포 후 물리 기기 확인은 사용자 확인이 필요하다. 브라우저 기본 PDF reader가 아니라 HTML/PDF.js canvas와 이미지 대안을 사용하므로, 해당 확인에서는 첫 페이지 자동 표시·전체 스크롤·확대/축소·상품 복귀·명시적 다운로드를 확인한다.
