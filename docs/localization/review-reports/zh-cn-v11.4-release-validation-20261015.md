# HUSIM COLOR 간체 중국어 v11.4 수정·관계 E2E·운영 배포 검증 기록

- **검증일:** 2026-10-15
- **대상 언어:** 간체 중국어(`zh-CN`)
- **문안 버전:** `zh-CN-2026-10-15-v11.1` (기존 저장 버전 유지)
- **범위:** 사용자 최종 문체 수정 3건, 공개 샘플 PDF 갱신, 부부·연인 및 부모·자녀의 분리 E2E, 운영 migration 사전 검증

> 이 문서는 자동 검증, 격리 E2E, 사용자의 Android 실기기 확인을 구분한다. 중국 본토 원어민의 전 조합·전 문단 출판 감수와 별도 홈페이지 `husimcolor.com` 소스 적용은 이 범위에 포함되지 않는다.

## 1. 이번 문안·공개 샘플 반영

| 대상 | 이전 | 반영 문안 | 적용 경로 | 확인 |
|---|---|---|---|---|
| 개인 PDF 5쪽 | `成长潜力` | `需要留意的倾向` | zh-CN static gap/template/reviewed catalog, 개인 결과·PDF | 재생성 PDF 5쪽에서 제목·본문 묶음 확인 |
| 개인 PDF 11쪽 | `今日专属恢复例程` | `今日自我照顾建议` | zh-CN static/revision catalog, 개인 결과·PDF | 재생성 PDF 11쪽에서 제목·본문 묶음 확인 |
| 부모·자녀 PDF 9쪽 두 번째 실천 | 이전 문안 | `在气氛变得尴尬时，女儿可以先说一句“我现在想休息一下”；妈妈收到这个信号后，可以先给她20分钟的空间。` | reviewed override + 역할 템플릿, 부모·자녀 결과·PDF | 재생성 PDF 9쪽에서 두 줄 자연스러운 줄바꿈 확인 |

공개 배포 대상은 아래 3개 중국어 샘플을 새로 생성해 교체했다.

- `public/sample-reports/husimcolor-personal-deep-zh-CN-sample.pdf`
- `public/sample-reports/husimcolor-couple-love-zh-CN-sample.pdf`
- `public/sample-reports/husimcolor-parent-child-zh-CN-sample.pdf`

`pdftotext -layout`로 새 제목과 부모·자녀 실천 문장을 재확인했고, 개인 5·11쪽 및 부모·자녀 9쪽은 렌더 이미지로 제목/본문·문단 배치도 별도 확인했다. 다른 문단의 전면 재번역은 수행하지 않았다.

## 2. 분리 관계 초대 E2E

### 2.1 안전 경계

| 항목 | 상태 |
|---|---|
| DB | 로컬 MariaDB `127.0.0.1:3308`, 임시 `husim_zhcn_relationship_e2e` DB |
| 수신자 | `invalid.example` 가상 주소만 사용 |
| 결제 | `COMMERCE_TEST_MODE=true`의 가상 test provider만 사용; 실제 Toss 호출·청구 없음 |
| 이메일 | `HUSIM_DISABLE_EMAIL_DELIVERY=true`; provider 호출 차단 |
| PDF storage | 로컬 test storage만 사용 |
| 운영 DB·스토리지·고객 데이터 | 연결·조회·변경하지 않음 |

### 2.2 통과한 실제 서비스 흐름

`scripts/relationship-invite-e2e.ts`가 API service와 local DB를 사용해 **14개 확인 항목**을 통과했다.

1. 테스트 entitlement·초대 세션 생성
2. A/B 별도 토큰을 하나의 관계 세션 슬롯으로 연결
3. A의 초안 저장 후 재접속·revision 복원
4. A만 제출 시 `awaiting_partner` 유지 및 PDF/outbox 미생성
5. B 역할 제약 및 남편·아내 양측 최종 제출
6. 중복 제출 차단
7. 부부 결과의 저장 locale/copyVersion 고정, private PDF 생성·재조회
8. 이메일 안전 게이트: outbox `queued`, `attemptCount=0`, provider message 없음
9. `email_pending` 뒤 초대 링크의 수정·재제출 차단
10. 별도 result token으로 고정 스냅샷 재조회
11. 기존 한 휴대폰 관계 분석 경로가 별도 invite session 없이 유지됨
12. 부모·자녀에서 딸이 먼저 제출해도 관계 유형을 `엄마-딸`로 확정
13. 부모·자녀 저장 PDF 재조회 및 `HUSIM_COLOR_亲子关系报告.pdf` filename 확인
14. 부모·자녀 outbox도 `zh-CN` / 동일 copyVersion / `queued` / `attemptCount=0` 유지

최종 격리 DB metadata에서 부부·연인과 부모·자녀의 생성 문서는 모두 `generated`, 결과 session은 `email_pending`, outbox는 `queued`와 `attemptCount=0`이었다. 실제 이메일은 전송하지 않았다.

## 3. 기존 결과 보호 및 운영 migration

### 3.1 필요한 스키마 변경

`drizzle/0020_locale_snapshot_metadata.sql`의 nullable 추가 열 6개만 필요하다.

| 테이블 | 추가 열 |
|---|---|
| `analysis_runs` | `locale`, `copyVersion` |
| `relationship_sessions` | `locale`, `copyVersion` |
| `email_outbox` | `locale`, `copyVersion` |

- `UPDATE`, `DELETE`, PDF 재생성, outbox 재큐잉 또는 이메일 재발송은 포함하지 않는다.
- 기존 행은 `NULL`을 유지하고 `resolveStoredResultLocale(undefined) === "ko"` fallback으로 한국어 canonical 경로를 유지한다.
- 신규 결과만 생성 시점 locale/copyVersion을 기록한다.

### 3.2 안전 runner와 복구 경로

`/scripts/apply-production-locale-snapshot-metadata.mjs`는 다음을 수행한다.

1. Production DB 연결 여부와 대상 테이블 3개 존재를 확인한다.
2. 누락된 nullable 열만 `ALTER TABLE … ADD COLUMN`으로 추가한다.
3. 모든 열의 타입·nullable 상태를 재조회한다.
4. 적용 열 목록, schema 검증, 추정 행 수 전후, 데이터 변경 0건을 JSON으로 남긴다.

로컬 격리 DB에서 이미 적용된 상태로 재실행해 `schemaVerified=true`, `dataMutation=false`, `existingRowsUpdated=0`, `destructiveStatements=0`, `appliedColumns=[]`, 6개 열을 확인했다.

운영에서는 GitHub Actions의 **Apply approved Production zh-CN locale metadata migration** workflow가 Vercel Production 환경을 private하게 pull한 뒤, 명시적 confirmation 문자열 없이는 실행되지 않도록 구성했다. workflow artifact에는 비밀값 없이 migration JSON 결과만 보관한다.

적용 직전 workflow는 `analysis_runs`, `relationship_sessions`, `email_outbox` 세 테이블의 **DDL만** `zh-cn-locale-schema-before.sql` artifact로 보관한다. 고객 행, 주문, PDF, 이메일 본문, 암호문이나 접속 정보는 백업 artifact에 포함하지 않는다. 이 schema artifact와 migration JSON은 90일 보관한다.

**복구:** 배포 직후 문제 시 Vercel을 직전 production deployment로 rollback하고 application revision만 되돌린다. 이미 생성된 zh-CN 결과가 없고 migration 직후에만 필요할 경우에 한해, artifact의 `appliedColumns`에 기재된 새 nullable 열만 별도 승인 후 제거할 수 있다. 새 결과가 생성된 뒤에는 열을 삭제하지 않고 application rollback만 사용한다. 기존 고객 데이터·PDF·주문·outbox는 어떤 복구 단계에서도 갱신·재생성·재발송하지 않는다.

### 3.3 운영 실행 결과 (배포 보류)

2026-10-15에 위 workflow를 Production `main`에서 실행했으나, Vercel CLI가 `DATABASE_URL`을 포함한 sensitive 환경값 12개를 실제 값 대신 `[SENSITIVE]` placeholder로만 내려주었다. runner는 DB 연결 전 URL 검증에서 중단되었으므로 **운영 DB에 연결하지 않았고, DDL·기존 행·PDF·outbox·이메일에 어떠한 변경도 적용되지 않았다.**

첫 실행에는 `node … | tee …` 파이프라인이 오류를 성공처럼 보이게 하는 결함이 있었고, 이를 `set -o pipefail` 보정으로 main에 반영했다. 이후 동일 오류는 반드시 workflow 실패로 표시된다. Production `DATABASE_URL`을 안전하게 workflow에 전달할 별도 GitHub Secret 또는 동등한 실행 경로가 준비되기 전까지 zh-CN 앱 PR은 병합·운영 배포하지 않는다.

## 4. 자동 검증

이번 v11.4 변경 후 다음을 실행했다.

```bash
pnpm check
pnpm exec vitest run \
  tests/zhCnLocalizationCatalog.test.ts \
  tests/relationshipInviteFlow.test.ts \
  tests/pdfDeliveryPolicy.test.ts \
  tests/emailOutboxPolicy.test.ts
node --check scripts/apply-production-locale-snapshot-metadata.mjs
```

- TypeScript: 성공
- 집중 Vitest: **4 files / 36 tests 통과**
- 관계 초대 service E2E: **14개 확인 통과**
- locale migration runner: 격리 DB 재실행에서 **6개 nullable 열 검증, 데이터 변경 0건**

## 5. 사용자 확인 및 남은 구분

| 항목 | 상태 | 근거 |
|---|---|---|
| Android에서 중국어 공개 샘플 3종 다운로드·재열기 | **사용자 확인 완료** | 사용자 보고 |
| 개인 심화 신규 생성·저장·재조회·private PDF·queued outbox | **이전 v11.3 격리 E2E 확인** | v11.3 검증 보고서 |
| 부부·연인 초대→완료→저장→재조회→private PDF | **이번 격리 E2E 확인** | 14개 E2E 확인 |
| 부모·자녀 초대→완료→저장→재조회→private PDF | **이번 격리 E2E 확인** | 딸→엄마 역순 제출 포함 |
| 실제 이메일 발송 | **미수행·금지 유지** | delivery disable gate |
| 중국 본토 원어민 전 조합 문체 감수 | **권장·미수행** | 자동 검사와 구분 |
| 별도 홈페이지 `husimcolor.com` 중국어 적용 | **미완료** | 소스 접근 권한 없음 |

## 6. 운영 후 확인 항목

공식 `main` 배포 후 `https://husimcolor.vercel.app`에서 다음만 읽기/무료 흐름으로 재확인한다.

1. 기본 선택 언어가 한국어인지
2. 简体中文 선택 후 무료 3컬러 결과와 상품 카드/샘플 버튼이 중국어인지
3. 세 샘플 버튼이 각각 중국어 개인·부부/연인·부모자녀 PDF로 열리는지
4. 새 오류가 없고 기존 결제·로그인·coupon 진입이 변경되지 않았는지

실제 결제, 실제 고객 검사, 이메일 발송, 기존 결과/PDF 재생성은 실행하지 않는다.
