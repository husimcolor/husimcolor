# zh-CN v11.2 번역·검증 보관 안내

- **기준 문안 버전:** `zh-CN-2026-10-15-v11.1`
- **보관·검증 버전:** v11.2
- **검토 브랜치:** `feat/zh-cn-full-localization-v11.2`
- **검토 커밋:** `41e1c89cdd992d44d48c68b4686a96f9ad06fcd9` (이 문서 추가 전 기준)
- **상태:** 검토용. `main` 병합, Production 배포, Production DB migration, 실제 이메일 발송은 수행하지 않았다.

## 포함된 번역 원본

- 공통 변환: `lib/zh-cn-copy.ts`
- 정적/해석/템플릿 문안: `shared/locales/zh-cn-*.ts`
- 용어·locale/copyVersion: `shared/localization.ts`
- 결과 화면 및 공개 샘플: `app/(tabs)/premium-result.tsx`, `app/(tabs)/couple-result.tsx`, `shared/sample-reports.ts`
- PDF·이메일 locale 경로: `server/pdf-report.ts`, `server/couple-pdf-report.ts`, `server/parent-child-pdf-report.ts`, `server/commerce/email-outbox-service.ts`
- 수정·문장 검수 기록: `docs/localization/review-reports/`
- 영어 v4.2 보관: `docs/localization/english-v4.2-pilot/` (변경·배포 보류)

## v11.2에서 추가한 검증

`docs/localization/review-reports/zh-cn-v11.2-isolated-db-and-mobile-review-20261015.md`를 기준으로, 운영과 분리한 로컬 MariaDB에서 가상 zh-CN 결과를 저장·재조회했다.

- `analysis_runs.locale = zh-CN`, `copyVersion = zh-CN-2026-10-15-v11.1` 저장
- 기기 언어가 한국어여도 저장된 결과 locale이 zh-CN으로 유지되는 fallback 확인
- 저장 locale 기준 PDF 중국어 출력 확인
- 실제 전송 없이 `queued` outbox의 zh-CN 제목·본문 payload 확인
- locale 없는 기존 결과는 한국어 fallback 유지 확인

비밀값 없는 결과 요약은 `docs/localization/test-db-proofs/locale-persistence-proof-v11.2-20261015.json`에 있다.

## 공개 샘플·대표 PDF 재생성

```bash
cd /tmp/husimcolor-zh-cn-full-localization
SAMPLE_REPORT_LOCALE=zh-CN \
SAMPLE_REPORT_VARIANT=alternate \
SAMPLE_REPORT_OUTPUT_DIR=/desired/output \
SAMPLE_REPORT_PAYLOAD_DIR=/desired/payloads \
pnpm exec tsx scripts/generate-public-sample-reports.ts
```

생성 뒤 `pdftotext`로 문안 구조를 점검하고 `pdftoppm`으로 전 페이지를 렌더링해 읽는다. 저장 locale·PDF·queued outbox 검증은 `scripts/verify-zh-cn-locale-test-db.ts`를 **Production과 분리된 임시 DB**에서만 실행한다.

## 미확인·남은 항목

- Android 실기기에서 PDF 다운로드 후 파일 앱 재열기
- 로그인된 신규 결과의 모바일 API E2E
- 실제 Resend 수신
- Production DB migration/배포
- 모든 색상·심리카드·관계 역할 조합의 원어민 전수 독해
- `husimcolor.com` 홈페이지 중국어화 (소스 미확보)

## 기밀·개인정보 제외

이 보관 경로와 배포용 ZIP에는 `.env`, API 키·비밀번호, 실제 고객·주문·결과·PDF·outbox를 넣지 않는다. 검토 PDF와 테스트 레코드는 가상 데이터만 사용한다.
