# HUSIM COLOR 한국어 공개 샘플 viewer 백업 안내

- 버전: `ko-sample-viewer-20261015`
- 생성일: 2026-10-15 (KST)
- 기준 브랜치: `feat/ko-sample-viewer-db-free`
- 기준 소스 커밋: `8e835a99c0318d7c627ca240d7d2838019cbb90c`

## 포함 자료

- 한국어 공개 PDF 3종: 개인 심화 / 부부·연인 / 부모·자녀
- 공개 샘플 allow-list 및 URL helper
- `inline` 열람 / 명시적 `attachment` 다운로드 endpoint
- 앱 내 PDF 열람 화면과 홈·무료 결과·관계 상품 진입 연결
- Vercel prebuilt function bundle 복사 규칙
- 분리 배포 검증 보고서와 관련 회귀 테스트

## 의도적으로 제외한 자료

- `.env*`, credential, token, database URL, 운영·테스트 DB 데이터
- 고객 결과, 주문, 이메일 본문·outbox, private PDF blob
- zh-CN locale/copyVersion 구현과 중국어 PDF
- DB migration SQL 및 Production migration runner
- `node_modules`, Expo export 중간 산출물

## 재생성·검증

```bash
pnpm check
pnpm exec vitest run tests/sampleReports.test.ts tests/homeServiceEntry.test.ts tests/koreanSampleViewerIsolation.test.ts --maxWorkers=1 --no-file-parallelism
npx esbuild api/public-sample-report.ts --bundle --platform=node --target=node20 --format=cjs --outfile=/tmp/public-sample-report.js
EXPO_USE_METRO_WORKSPACE_ROOT=1 npx expo export --platform web --output-dir=/tmp/husimcolor-ko-sample-viewer-export
```

배포 workflow는 `api/public-sample-report.ts`를 bundle하고, 함수 디렉터리 안에 한국어 공개 PDF 세 파일을 복사한다. DB credential이나 schema migration은 필요하지 않다.

## 확인 범위

검증 보고서에 기록된 것처럼 웹 inline 열람, PDF 확대, 선택 다운로드, range response, product allow-list를 확인했다. Android/iOS 실제 기기 Custom Tab/SFSafariViewController의 동작과 Production 도메인 검증은 배포 후 별도로 확인한다.
