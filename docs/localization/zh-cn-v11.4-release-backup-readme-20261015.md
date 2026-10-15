# HUSIM COLOR zh-CN v11.4 배포·검증 보관 안내

- **문안 버전:** `zh-CN-2026-10-15-v11.1`
- **보관 버전:** v11.4
- **검토 브랜치:** `feat/zh-cn-full-localization-v11.3`
- **기준 소스 커밋:** `5ac1d993fe45874822f0d7ca2bb593b28b9baf6b` (`feat: finalize zh-CN locale release validation`)
- **schema backup 보완 커밋:** `a399d62ef2e300fa2b2b776e1dbae2361626bc5e` (`chore: back up locale migration schema before apply`)
- **언어 범위:** 한국어 기본 + zh-CN 선택 경로. 영어 v4.2는 별도 보관이며 이번 배포 변경 범위에서 제외.

## 포함 자료

| 구분 | 위치 |
|---|---|
| 공통 zh-CN 변환·문장 조립 | `lib/zh-cn-copy.ts`, `shared/locales/zh-cn-*.ts` |
| locale/copyVersion·fallback | `shared/localization.ts`, `lib/localization-context.tsx` |
| 개인·관계 결과 UI | `app/(tabs)/premium-*.tsx`, `app/(tabs)/couple-result.tsx` |
| PDF/private download/email outbox | `server/commerce/`, `server/_core/index.ts`, `server/storage.ts` |
| 비파괴 schema SQL | `drizzle/0020_locale_snapshot_metadata.sql` |
| 명시적 운영 migration runner/workflow | `scripts/apply-production-locale-snapshot-metadata.mjs`, `.github/workflows/production-zh-cn-locale-migration.yml` |
| 개인·관계 격리 E2E script | `scripts/relationship-invite-e2e.ts` |
| v11.3 개인 E2E 기록 | `docs/localization/review-reports/zh-cn-v11.3-isolated-e2e-validation-20261015.md` |
| v11.4 최종 수정·관계 E2E 기록 | `docs/localization/review-reports/zh-cn-v11.4-release-validation-20261015.md` |
| 공개 zh-CN 샘플 PDF | `public/sample-reports/*-zh-CN-sample.pdf` |
| 대표 PDF·이미지 검수 자료 | `docs/localization/zh-cn-v11-review-pdfs/`, `docs/localization/zh-cn-v11.1-review-pdfs/`, `docs/reports/zh-cn-v11.3-e2e-evidence/` |
| 영어 v4.2 보관 | `docs/localization/english-v4.2-pilot/` |

## 검증 완료 범위

- 사용자가 Android에서 개인·부부/연인·부모자녀 중국어 공개 샘플 PDF의 다운로드와 재열기를 확인했다.
- 개인 심화는 격리 앱에서 새 결과 생성→저장→재조회→private PDF GET→queued outbox를 E2E로 확인했다.
- 부부·연인 및 부모·자녀는 격리 DB에서 가상 test entitlement와 초대 토큰을 사용해 A/B 검사→완료→저장 결과 재조회→private PDF→queued outbox를 E2E로 확인했다.
- 실제 이메일 발송은 disabled gate로 차단했고, E2E outbox는 `queued`, `attemptCount=0`을 유지했다.
- 신규 locale/copyVersion column 6개를 추가하는 migration runner를 격리 DB에서 재실행해, 데이터 변경 0건과 nullable schema 검증을 확인했다.
- 2026-10-15의 최종 제목/실천 문안과 공개 zh-CN 샘플 PDF 3종을 갱신했다.

## 남은 구분

- 중국 본토 원어민의 전 조합·전 문단 최종 문체 감수는 권장되나 미수행이다.
- 실제 이메일 deliver/send는 이번 검증 및 배포 후 확인 범위에서 제외한다.
- 별도 홈페이지 `husimcolor.com`은 소스 접근 권한이 없어 zh-CN 적용 여부가 **미완료**다. 앱 `husimcolor.vercel.app`과 별도로 관리한다.

## 재생성 및 격리 검증

```bash
cd /tmp/husimcolor-zh-cn-full-localization
SAMPLE_REPORT_LOCALE=zh-CN \
SAMPLE_REPORT_VARIANT=alternate \
SAMPLE_REPORT_OUTPUT_DIR=/desired/output \
SAMPLE_REPORT_PAYLOAD_DIR=/desired/payloads \
pnpm exec tsx scripts/generate-public-sample-reports.ts

# 절대로 Production URL을 쓰지 않는다.
NODE_ENV=development \
COMMERCE_TEST_MODE=true \
HUSIM_DISABLE_EMAIL_DELIVERY=true \
DATABASE_URL=mysql://root@127.0.0.1:3308/husim_zhcn_relationship_e2e \
pnpm exec tsx scripts/relationship-invite-e2e.ts
```

운영 schema migration은 GitHub Actions의 **Apply approved Production zh-CN locale metadata migration**만 사용한다. Vercel Production environment은 workflow 내부에서만 private pull하고, `.env.production`은 완료 시 삭제한다.
이 workflow는 적용 전에 영향 테이블 3개의 DDL만 artifact로 남기며, 고객 행·PDF·주문·outbox payload는 artifact에 저장하지 않는다.

## 기밀·고객 데이터 제외

ZIP 및 Git에는 다음을 포함하지 않는다.

- `.env`, API key, password, Vercel/DB/메일 토큰, start/result/delivery token
- local MariaDB data directory, local private PDF storage, E2E output JSON
- 실제 또는 synthetic 고객·주문·결과·outbox payload/ciphertext
- `node_modules`, Expo/Metro cache

대표 PDF·캡처의 입력은 검토용 가상 데이터만 사용한다.
