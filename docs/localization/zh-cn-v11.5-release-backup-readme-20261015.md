# HUSIM COLOR zh-CN v11.5 배포 후보 백업 안내

- 생성일: 2026-10-15
- 브랜치: `feat/zh-cn-full-localization-v11.3`
- 기준 커밋: `1612109805cc095e9e2dfd98e8a5100fbb4cf216`
- 상태: **Production migration/배포 전 검토 백업**

## 포함 자료

| 경로 | 내용 |
|---|---|
| `source/shared/locales/` | zh-CN 정적·템플릿·reviewed override catalog, 용어/정적 문안 |
| `source/lib/zh-cn-copy.ts` | 공통 결과 payload 문안 재조립/정규화 |
| `source/shared/sample-reports.ts` | 한국어·zh-CN 공개 sample product/file/URL mapping |
| `source/app-sample-viewer/` | 앱 내 public sample viewer 및 해당 상품 진입 연결 화면 |
| `source/server-public-sample/` | 공개 sample allow-list/inline-download API 및 개발 route |
| `source/server-pdf-metadata/` | 부부/연인·부모자녀 zh-CN PDF document title metadata 변경 |
| `source/migration/` | additive locale/copyVersion migration SQL, protected Actions workflow, schema backup/apply runner |
| `source/tests/` | sample/locale/PDF/migration 정책 회귀 테스트 |
| `docs/review-reports/` | v11.3 격리 E2E와 v11.4/v11.5 검증 기록 |
| `samples/` | 한국어/zh-CN 공개 sample PDF 6종 |
| `english-v4.2-archival/` | 기존 영어 v4.2 파일럿 보관 자료(이번 변경·배포 대상 아님) |

## 제외 자료

다음은 ZIP과 Git staged files에서 제외한다.

- `.env*`, API key, database URL, OAuth/결제/메일 secret, Actions secret 값
- Production 또는 synthetic DB data directory, customer/recipient data, orders, results, private PDF blobs
- E2E access token/start grant, browser storage, local server log
- `node_modules`, build output, cache, OS metadata

## 공개 샘플 재생성

```bash
cd <repository>
SAMPLE_REPORT_LOCALE=zh-CN \
SAMPLE_REPORT_OUTPUT_DIR=/tmp/husimcolor-zh-cn-samples \
node --import tsx scripts/generate-public-sample-reports.ts
```

생성한 파일은 텍스트/페이지 수/대상 페이지 렌더를 검수한 뒤에만 `public/sample-reports/`의 zh-CN 파일로 교체한다. 공개 sample은 가상 데이터 전용이며 private customer report를 읽거나 재생성하지 않는다.

## 운영 migration과 rollback

- 실행 전 GitHub Actions secret `HUSIM_PRODUCTION_DATABASE_URL`이 필요하다. Vercel Production `DATABASE_URL`과 같은 값이지만 chat, commit, backup ZIP에 넣지 않는다.
- workflow는 `workflow_dispatch`의 정확한 confirmation 없이는 실행되지 않는다.
- 실행 시 3개 existing table에 nullable locale/copyVersion metadata만 추가하며 row update, result/PDF/outbox 재생성, email resend는 하지 않는다.
- schema artifact는 `SHOW CREATE TABLE`과 row count만 포함하며 destructive table deletion statement가 없다.
- 새 zh-CN 결과가 생성된 후 rollback은 app revision만 직전 main으로 되돌린다. locale metadata column과 기존 row는 보존한다.

자세한 증빙과 미확인 범위는 `docs/review-reports/zh-cn-v11.5-public-sample-viewer-release-validation-20261015.md`를 본다.

## 별도 미완료 범위

`husimcolor.com` 별도 홈페이지 소스에는 접근 권한이 없으므로 zh-CN 적용 여부는 이 backup/branch의 앱 범위와 별개다.
