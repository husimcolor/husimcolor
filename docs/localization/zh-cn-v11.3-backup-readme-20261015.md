# HUSIM COLOR zh-CN v11.3 번역·E2E 검증 보관 안내

- **기준 문안 버전:** `zh-CN-2026-10-15-v11.1`
- **보관·검증 버전:** v11.3
- **검토 브랜치:** `feat/zh-cn-full-localization-v11.3`
- **기준 커밋:** `27d7f9202fa4e8981b02124f820bd79a9a2ac1cc`
- **상태:** 검토용. `main` 병합, Production 배포, Production DB migration, 실제 이메일 발송을 수행하지 않았다.

## 포함 자료

| 구분 | 포함 위치 |
|---|---|
| 공통 zh-CN 변환·문장 조립 | `lib/zh-cn-copy.ts`, `shared/locales/zh-cn-*.ts` |
| 용어·locale/copyVersion | `shared/localization.ts` |
| 개인/관계 결과 화면 | `app/(tabs)/premium-*.tsx`, `app/(tabs)/couple-result.tsx` |
| PDF·private download·email outbox | `server/commerce/`, `server/_core/index.ts`, `server/storage.ts` |
| 비파괴 migration | `drizzle/0020_locale_snapshot_metadata.sql` |
| 회귀 테스트 | `tests/*zh*`, `tests/*locale*`, `tests/*pdf*`, `tests/*email*`, `tests/*sample*` |
| 문체/용어/수정 이력 | `docs/localization/` 및 `docs/localization/review-reports/` |
| 이번 분리 E2E 기록 | `docs/localization/review-reports/zh-cn-v11.3-isolated-e2e-validation-20261015.md` |
| E2E 결과 캡처 | `docs/reports/zh-cn-v11.3-e2e-evidence/` |
| 공개 zh-CN 샘플 PDF | `public/sample-reports/*-zh-CN-sample.pdf` |
| 대표 검토 PDF | `docs/localization/zh-cn-v11-review-pdfs/`, `docs/localization/zh-cn-v11.1-review-pdfs/` |
| 영어 v4.2 보관 | `docs/localization/english-v4.2-pilot/` (보류, 이번 변경·배포 범위 제외) |

## 검증 완료 범위

- 샘플 버튼 문구를 개인/부부·연인/부모·자녀의 확정 zh-CN 문구로 통일했다.
- 격리된 로컬 앱에서 개인 심화 결과를 새로 생성하고 `analysis_runs.locale`, `copyVersion`, private document, queued outbox에 일관되게 저장되는 것을 확인했다.
- 전역 선택 언어를 한국어로 바꾼 뒤에도 저장된 zh-CN 개인 결과가 중국어로 재조회되는 것을 browser로 확인했다.
- UI의 private PDF 다운로드가 API origin의 기존 document GET을 사용하며, 다운로드가 outbox 재생성·재시도·발송을 만들지 않는 것을 확인했다.
- zh-CN 개인/부부·연인/부모·자녀 private PDF attachment filename 정책과 email payload locale source path를 회귀 테스트로 확인했다.
- `pnpm check` 및 zh-CN E2E 관련 12개 test file/68개 test를 통과했다.

자세한 경계와 실제·자동 검증의 구분은 v11.3 E2E 보고서를 따른다.

## 미확인·보류 범위

- Android 기기에서 3종 중국어 공개 샘플 PDF를 다운로드하고 Files/Downloads 앱에서 재열기
- 부부·연인 및 부모·자녀의 실제 유료 초대→완료→저장→재조회 UI E2E
- 실제 Resend 수신(실제 이메일 발송은 금지 상태)
- 중국 본토 원어민의 전 조합·전 문단 최종 문체 감수
- Production DB migration 및 배포
- 별도 홈페이지 `husimcolor.com`의 중국어 적용(소스 접근권 없음)

## 공개 샘플 및 재생성

```bash
cd /tmp/husimcolor-zh-cn-full-localization
SAMPLE_REPORT_LOCALE=zh-CN \
SAMPLE_REPORT_VARIANT=alternate \
SAMPLE_REPORT_OUTPUT_DIR=/desired/output \
SAMPLE_REPORT_PAYLOAD_DIR=/desired/payloads \
pnpm exec tsx scripts/generate-public-sample-reports.ts
```

생성 후 `pdftotext`로 문안 구조를 확인하고, `pdftoppm`으로 전 페이지를 렌더링해 읽는다. 저장 locale·PDF·queued outbox의 E2E 확인은 `scripts/verify-zh-cn-locale-test-db.ts`를 **Production과 완전히 분리된 임시 DB**에서만 실행한다. `scripts/seed-zh-cn-ui-e2e.ts`는 `ZH_CN_UI_E2E_ALLOW=1`과 loopback `127.0.0.1:3308` DB가 동시에 있어야만 가상 entitlement를 만든다.

## 기밀·개인정보 제외

백업 ZIP과 Git 검토 브랜치에 다음을 넣지 않는다.

- `.env`, API 키, 비밀번호, access/delivery token
- local MariaDB data directory, private storage blob, E2E start-grant JSON
- 실제 고객·주문·결과·PDF·outbox 데이터
- `node_modules`, Expo/Metro cache

대표 PDF·결과 화면 캡처의 입력은 가상 검토 데이터만 사용한다.
