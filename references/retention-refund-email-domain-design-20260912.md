# 휴심컬러 보관·환불·결과 이메일 설계안

작성일: 2026-09-12
작성자: Manus AI
범위: **구현 전 설계**. 외부 서비스 가입, DNS 변경, 토스 결제 연동, 코드·DB migration·배포는 수행하지 않는다.

> **법률 유의사항**: 아래 환불·보관 설계는 제품 운영을 위한 기술·정책 초안이며 법률 자문이 아닙니다. 디지털콘텐츠의 제공 개시 후 청약철회 제한은 사전 표시와 시험사용 또는 정보 제공 같은 요건에 영향을 받으며, 소비자에게 불리한 약관은 효력이 제한될 수 있습니다. 실제 판매 전 전자상거래·개인정보·세무 전문 검토와 최종 약관 승인이 필요합니다.[1]

## 1. 정책 결정 요약

| 대상 | 확정 운영 기준 | 서버의 기준 시각 | 고객 접근 | 만료 처리 |
|---|---|---|---|---|
| 회원 유료 분석 | 결과·PDF **1년** 보관 | `analysis_results.completedAt + 365일` | 로그인한 주문 소유자만 | 결과 snapshot·PDF object·access token 영구 파기, 접근 차단 |
| 비회원 유료 분석 | 결과·PDF **7일** 보관 | `analysis_results.completedAt + 7일` | 이메일 OTP로 본인 확인 후 재다운로드 | 결과 snapshot·PDF object·guest access token 영구 파기 |
| 비회원 첫 전달 | 완료 즉시 결과 메일 발송 | PDF 생성 완료 시 | `result@husimcolor.com` 발신, 보안 다운로드로 전달 | 7일 이내 새 OTP 발급·재다운로드 허용 |
| 디지털 분석 | **검사 시작 전 전액 환불**, 시작 후 자동 전액 환불 대상 아님 | 서버가 첫 검사 시작을 확정한 시각 | 환불 요청은 항상 기록·검토 가능 | 성공 환불이면 권한 취소·미시작 draft 즉시 파기 |
| 예약 코칭 | 예약일 **전날 23:59:59(Asia/Seoul)**까지 전액 환불, 당일 취소·노쇼는 기본적으로 환불 불가 | 현재 확정 예약의 `cancelDeadlineAt` | 관리자 예외 검토 가능 | 전액 환불 성공 시 코칭 예약 취소·권한/fulfillment 해제 |

회원 계정 자체와 법정·정산상 필요한 최소 주문 기록의 보관은 결과/PDF 1년 정책과 별개다. 결과 전문·PDF·심리카드 선택·관계 입력값은 위 기간에 맞춰 파기하고, 결제 ID·금액·환불 상태·감사 로그는 **가명화·최소화한 거래 기록**으로만 별도 보존한다. 정확한 보존 대상·기간은 전자상거래·세무·개인정보 법률 검토에서 확정한다.[2]

## 2. 보관과 재다운로드 설계

### 2.1 데이터 분리 원칙

`analysis_results.snapshotEncrypted`와 `pdf_reports.storageKey`는 민감한 심리·관계 정보를 포함하므로 주문 화면, 공개 `shareId`, 브라우저 저장소와 분리한다. 기존 공개 공유 링크는 현 기능을 유지하되 유료 결과/PDF의 권한을 대체하지 않는다.

| 데이터 범주 | 예시 | 보관·파기 방식 |
|---|---|---|
| 민감 결과 | 컬러·심리카드 선택, 관계 입력, 생성 결과 snapshot | 회원 1년·비회원 7일 뒤 암호화 원문 및 복호화 키 참조를 파기 |
| PDF object | private storage PDF bytes, checksum | 같은 `retentionUntil`에 storage delete와 `pdf_reports` 민감 필드 scrub |
| 접근 토큰 | 이메일 OTP, magic session, signed-download ticket | OTP 10분, web session 15분, storage signed URL 60초; 결과 만료와 함께 즉시 폐기 |
| 주문·결제 최소 기록 | 주문번호, 상품/가격 snapshot, PG payment ID, 승인·환불 시각 | 결과와 분리. 이메일·주소 등 불필요 원문은 해시/암호화 최소화 후 법정·분쟁 보존 검토에 따름 |
| 이메일 운영 로그 | provider message ID, delivered/bounced, 오류 코드 | 결과 본문/PDF 없이 상태 메타데이터만 보관; recipient 원문은 암호화·최소화 |

### 2.2 회원 1년 흐름

회원의 결과 완료 transaction은 `retentionUntil = completedAt + 365일`을 기록한다. 관리 화면과 내 결과 화면은 `now < retentionUntil`인 result만 표시하며, PDF 다운로드는 로그인 세션 + 고객 소유권 + entitlement/result 관계를 모두 확인한 뒤에만 허용한다.

매일의 `PURGE_EXPIRED_PRIVATE_CONTENT` outbox job은 만료된 result를 batch lock으로 집어 다음 순서로 처리한다. 먼저 access token·다운로드 세션을 revoke하고, private storage object를 삭제한 뒤, 결과 snapshot·PDF key·원본 이메일을 cryptographic erase 또는 field scrub한다. 마지막으로 `purgedAt`, reason, job ID만 tombstone으로 남겨 재시도 및 감사 중복을 막는다. 삭제 실패는 `PURGE_FAILED`로 남기고 재시도하며, 삭제 성공 전에는 결과를 고객에게 다시 노출하지 않는다.

### 2.3 비회원 7일 재다운로드 흐름

비회원에게는 PDF를 공개 URL이나 7일짜리 storage URL로 메일에 직접 넣지 않는다. `result@husimcolor.com`의 완료 메일에는 결과 완료 사실과 **보안 재다운로드 버튼**만 넣는다. 버튼은 PDF 파일이 아니라 `/reports/access/{opaqueToken}`으로 이동한다.

해당 endpoint는 token 자체만으로 PDF를 주지 않고, masked email을 표시한 뒤 그 이메일로 6자리 OTP를 다시 발송한다. OTP가 일치하면 HTTP-only report access session을 15분 발급하고, 그 세션이 report ownership·retention 기간을 통과할 때에만 60초 signed URL 또는 server-stream download를 허용한다. 사용자는 7일 동안 다시 OTP를 요청할 수 있고, 이메일 재발송·OTP 요청은 email hash와 IP별 rate limit을 적용한다. 이 방식은 전달된 이메일 링크나 browser history만으로 PDF가 열리는 위험을 줄인다.

PDF를 자동 메일 첨부로 보내는 방식은 수신함에 장기 복제본이 남고 전달되기 쉽습니다. 따라서 1차 출시에서는 **인증형 다운로드 링크를 기본**으로 하고, 사용자가 명시적으로 선택한 경우에만 첨부를 허용하는 것이 개인정보 최소화 원칙에 더 적합합니다. 첨부를 사용하더라도 private storage 보관·7일 재다운로드 정책은 동일하게 적용되며, 이미 수신한 첨부 파일의 외부 보관까지 앱이 회수할 수는 없습니다.

### 2.4 정책 변경·삭제 요청

`retention_policy_version`을 result와 report에 snapshot으로 보관한다. 향후 기간을 바꿔도 과거 주문에 어느 정책을 적용했는지 추적할 수 있다. 회원의 별도 삭제 요청은 result/PDF를 즉시 purge queue에 넣되, 거래·환불·분쟁 기록 중 법적 보존이 필요한 최소 필드는 삭제 대상에서 제외하고 그 사실을 사용자에게 안내한다.

## 3. 환불 서버 판정 설계

### 3.1 공통 상태와 감사 모델

환불은 프런트 화면의 결제 성공/실패 표시로 판단하지 않는다. 다음 테이블과 immutable event를 추가한다.

| 모델 | 핵심 필드 | 목적 |
|---|---|---|
| `refund_policy_versions` | `code`, `version`, `effectiveFrom`, `rulesJson`, `publishedAt` | 디지털 분석·예약 코칭 정책의 변경 이력 |
| `fulfillment_events` | `orderItemId`, `type`, `occurredAt`, `actor`, `idempotencyKey`, `payloadHash` | `ASSESSMENT_STARTED`, `RESULT_COMPLETED`, `COACHING_SCHEDULED`, `CANCEL_REQUESTED`, `NO_SHOW_CONFIRMED` 등의 신뢰 가능한 서버 이벤트 |
| `refund_requests` | `orderItemId`, `requestId`, `reason`, `requestedAt`, `policyVersion`, `automaticDecision`, `status` | 고객 요청과 정책 버전 snapshot |
| `refund_decisions` | `requestId`, `eligible`, `amountKrw`, `reasonCode`, `factsJson`, `reviewRequired`, `decidedAt` | 자동 판정 근거·관리자 예외 결정 |
| `payment_refunds` | `paymentTransactionId`, `providerRefundId`, `amountKrw`, `status`, `idempotencyKey`, `approvedAt` | 토스/향후 Play 취소·환불을 분리 기록 |

모든 정책 판정은 `order_item`별로 한다. 초기에 한 주문에 한 상품만 팔더라도, 향후 분석과 코칭을 함께 주문해도 환불 대상 상품을 독립적으로 판정할 수 있다.

### 3.2 디지털 분석상품: 검사 시작 전 전액 환불

`ASSESSMENT_STARTED`는 개인정보 입력 시작이나 결과 페이지 로드가 아니라, 고객이 결제 후 고지·동의를 확인하고 **첫 번째 컬러 선택을 서버로 저장하는 요청**이 성공한 순간에 단 한 번 발생한다. 해당 API는 `assessmentAttemptId`와 idempotency key를 받고 transaction 안에서 아래를 수행한다.

1. active entitlement와 paid order item을 lock하고, 이미 `startedAt`이 있으면 기존 attempt를 반환한다.
2. 미시작 entitlement에 `assessment_attempts.startedAt`, `fulfillment_events(ASSESSMENT_STARTED)`, 정책 버전을 원자적으로 기록한다.
3. 이후부터 자동 환불 판정은 `NOT_ELIGIBLE_AFTER_SERVICE_STARTED`를 반환한다.

따라서 결제 후 개인정보 입력 화면까지만 이동했거나 새로고침·뒤로가기를 한 경우에는 `startedAt`이 없어 전액 환불 대상입니다. 반대로 첫 컬러 저장 이후에는 결과를 아직 보지 않았어도 서비스 제공 개시로 기록합니다. 이 경계는 UI에 정확히 표시하고, 결제 전 상품 상세와 결제 직전 checkbox에서 같은 정책 문구를 고지한다.

| 조건 | 자동 판정 | 후속 처리 |
|---|---|---|
| 결제 성공, `startedAt IS NULL` | `ELIGIBLE_FULL_REFUND` | entitlement를 `REFUND_PENDING`으로 잠금 → PG 전액 취소 → `REVOKED`, 쿠폰/입력 draft 처리 |
| 결제 성공, `startedAt IS NOT NULL` | `NOT_ELIGIBLE_AFTER_SERVICE_STARTED` | 자동 PG 취소 없음, 요청은 관리자 검토 가능 상태로 저장 |
| 이중 승인·PG 오류·서비스 장애 | `REVIEW_REQUIRED` 또는 명시 규칙 | 결제·권한·결과 이벤트를 함께 검토해 관리자 예외 환불 |
| 이미 완료/환불된 item | `IDEMPOTENT_RETURN` | 기존 refund 상태 반환, 중복 취소 금지 |

환불 신청 시에는 먼저 entitlement를 `REFUND_PENDING`으로 두어 검사 시작을 막고, 토스 cancel API 호출은 `refund_request_id` 기반 멱등키로 한 번만 실행한다. PG 취소 성공 시에만 `REFUNDED/REVOKED`를 확정한다. 실패·타임아웃이면 entitlement는 잠금 상태를 유지하고 reconciliation job과 관리자에게 넘기며, 확인 없이 새 권한을 만들거나 재결제 요청을 하지 않는다.

쿠폰은 결제 전 취소/만료에서는 reservation을 해제한다. 결제 후 전액 환불 때 쿠폰 재발급 여부는 `coupon.restoreOnFullRefund`이라는 명시적 상품·쿠폰 정책으로 처리하며, 초기 기본값은 **자동 재발급 안 함**으로 둔다. 무료 분석은 주문·환불 대상이 아니므로 이 경로를 만들지 않는다.

### 3.3 예약 코칭상품: 전액 결제 후 일정 기준 환불

코칭은 예약금이 아닌 전액 결제 완료 후에만 `coachings` fulfillment가 생성된다. `scheduleAt`는 UTC와 `Asia/Seoul` display timezone을 함께 기록하고, 현재 확정 예약의 정책 deadline은 다음처럼 서버에서 계산한다.

```text
cancelDeadlineAt = 예약일의 전날 23:59:59.999 Asia/Seoul
```

예를 들어 2026-10-15 10:00(KST) 예약은 2026-10-14 23:59:59.999(KST)까지 전액 환불 가능하다. 결제 상태가 `PAID`여도 이 시각 이후에는 `INELIGIBLE_SAME_DAY_OR_NO_SHOW`로 처리한다. 실제 고객/운영자 시계가 아닌 서버 시간만 사용한다.

| 코칭 상태 | `now`와 deadline | 기본 자동 결정 | 운영 주의점 |
|---|---|---|---|
| 결제 완료, 예약 전날까지 | `now <= cancelDeadlineAt` | 전액 환불 | PG 성공 후 `CANCELLED_REFUNDED` |
| 예약 당일 취소 | `now > cancelDeadlineAt` | 환불 불가 | 요청·정책 근거는 저장하고 관리자 예외는 별도 권한 필요 |
| 노쇼 | 코칭 시작 후 운영자 확인 | 환불 불가 | 시간만으로 자동 no-show 확정 금지; 진행자 확인 + audit log 필요 |
| 일정 변경 | 변경 전/후 schedule audit | 새로 확정된 일정 기준 | 당일 변경·사업자 귀책·불가항력 기준은 약관 별도 정의 필요 |

고객이 취소를 클릭하면 서버가 `coachings.status`, `scheduleAt`, `cancelDeadlineAt`, 결제/기존 환불 여부를 transactionally 읽고, 당시 정책 version과 decision facts를 snapshot한다. 정확한 법정 예외, 소비자분쟁해결기준 적용업종, 사업자 귀책·불가항력·서비스 미제공 시 처리, 코칭의 온라인/대면 계약 분류는 출시 전 전문 검토로 확정해야 한다. 소비자분쟁해결기준은 당사자 간 별도 의사표시가 없는 경우의 합의·권고 기준이며, 더 소비자에게 유리한 다른 기준이 있으면 그 기준이 우선할 수 있습니다.[3]

## 4. result@husimcolor.com 발신 설계

### 4.1 현재 DNS 상태

2026-09-12 공개 DNS 조회에서 `husimcolor.com`은 Cloudflare를 통해 HTTPS 응답을 제공하지만, **MX·SPF(TXT)·DKIM·DMARC·MTA-STS 레코드가 발견되지 않았습니다**. authoritative DNS는 `ns1.globaldomaingroup.com` 및 `ns2.globaldomaingroup.com`으로 확인됩니다. 따라서 지금은 `result@husimcolor.com`을 Production 발신자로 사용하면 안 됩니다.

### 4.2 권장 구성

초기에는 Vercel serverless와의 API 연동, PDF 링크 메일, idempotency, webhook 추적을 단순하게 제공하는 **Resend**를 권장한다. Resend는 소유 도메인의 검증이 필요하고, 도메인 검증 뒤 해당 도메인 주소로 발신할 수 있으며, DKIM/SPF 상태 및 DMARC 설정을 dashboard에서 관리한다.[4] [5] Amazon SES는 대량 발송·세밀한 AWS 이벤트 파이프라인이 필요해진 뒤의 유효한 대안이지만, IAM·SNS/EventBridge 운영이 추가된다.[8] [9]

| 항목 | 1차 권장 | 설정 이유 |
|---|---|---|
| 표시 발신자 | `휴심컬러 결과 <result@husimcolor.com>` | 사용자 요구 충족 및 브랜드 일관성 |
| 회신 | `support@husimcolor.com`을 실제 사서함으로 개설 후 `Reply-To` 지정 | 현재 루트 MX가 없어 사용자 회신을 받을 수 없음 |
| 발송 provider | Resend transactional email | serverless API·idempotency·webhook 연동이 초기 구조에 적합 |
| bounce/return path | provider가 제시하는 별도 subdomain, 예: `bounce.husimcolor.com` | 발송 평판·반송을 본 도메인/표시 발신과 분리 |
| 분석 메일 추적 | open/click tracking **비활성화** | 심리 결과 접근 여부의 불필요한 추적을 피하고 링크 재작성 위험 축소 |
| PDF 전달 | OTP 후 보안 다운로드 link | 이메일 포워딩/장기 보관으로 인한 민감 PDF 노출을 최소화 |
| 발송 상태 | `email_deliveries` + provider webhook | submitted/delivered/bounced/complained를 관리자가 확인·재시도 |

### 4.3 DNS 설정 순서

아래는 구성 순서이며, **실제 host/value는 provider dashboard가 생성한 값을 그대로 사용**해야 한다. provider account를 아직 만들지 않았으므로 DKIM selector·CNAME/MX 값을 임의로 작성하거나 DNS에 추가하지 않는다.

1. DNS 관리 권한이 있는 `globaldomaingroup` 계정에서 기존 A/웹 레코드의 export·screenshot을 백업한다.
2. Resend team을 만들고 `husimcolor.com`을 sending domain으로 추가한다. `result@husimcolor.com`이 루트 domain 발신을 상속하도록 한다.
3. Resend Dashboard **Records** 탭이 제시한 DKIM 및 SPF/return-path CNAME·TXT·MX 레코드를 정확히 추가한다. 동일 이름의 SPF record가 이미 생기면 두 개를 만들지 않고 provider 안내에 따라 하나의 정책으로 병합한다.[5]
4. DMARC를 우선 `_dmarc.husimcolor.com TXT`에 `v=DMARC1; p=none; rua=mailto:dmarc@husimcolor.com;` 형태로 설정하되, `dmarc@`가 실제 보고서를 수신·보관할 사서함 또는 보고 수집 서비스인지 먼저 확인한다. SPF/DKIM 통과와 대표 발송을 확인한 뒤 `quarantine`, 이후 `reject`로 강화한다.[6]
5. `support@husimcolor.com`과 `dmarc@husimcolor.com` 수신이 필요하면 별도 메일 호스팅(예: Google Workspace, Microsoft 365 또는 기존 메일 호스팅)을 정하고 MX를 구성한다. **Resend 발신 검증만으로 사람의 회신 수신함이 만들어지지는 않는다.**
6. inbound MX가 정해진 뒤 MTA-STS와 TLS-RPT를 별도 검토한다. 이는 husimcolor.com으로 들어오는 메일 전송 보안에 도움이 되지만, 결과 메일 발신의 선행 필수 조건은 아니다.
7. Gmail·Naver·Daum·Outlook test mailbox에 결과 메일을 보내 헤더의 `spf=pass`, `dkim=pass`, `dmarc=pass` 및 spam placement를 확인한다. 이후에만 실제 고객 발송을 연다.

### 4.4 이메일 실패와 재발송

`SEND_RESULT_EMAIL` job은 report ID와 `deliveryRevision`으로 dedupe key를 만들고, provider idempotency key로 같은 결과가 중복 발송되지 않게 한다. provider webhooks의 message ID/event ID는 unique 저장한다. bounce·complaint가 발생한 recipient는 즉시 suppression 상태로 두고, 관리자 화면에서 주소 확인·새 이메일 입력 요청·재발송을 분리한다. 단순 API accepted는 실제 delivered가 아니므로 `submitted`와 `delivered`를 구별한다.[7]

## 5. 구현 전 승인 항목

| 우선순위 | 승인할 결정 | 이유 |
|---|---|---|
| 필수 | 검사 시작 전 고지와 checkbox 문구·무료 체험/상품 정보 제공 방식 | 디지털 콘텐츠 환불 제한 요건과 UI event 경계를 연결 |
| 필수 | `support@`·`dmarc@` 수신 사서함 공급자 | `result@`의 발신과 고객 회신·DMARC 보고 수신을 분리 |
| 필수 | 결과 메일은 보안 링크 기본, 첨부는 opt-in으로 할지 | 이메일 속 민감 PDF 장기 복제 위험 결정 |
| 필수 | 코칭 당일 취소·노쇼 예외·일정 변경 규정 | 서버 자동화 범위와 관리자 override 권한 확정 |
| 필수 | 거래 기록의 최소 필드·법정 보존 기간 | 1년/7일 결과 파기와 충돌하지 않도록 분리 |
| 이후 | 쿠폰 전액 환불 시 재발급 여부 | 초기 기본값은 재발급 안 함, 쿠폰별 override 가능 |

## References

[1]: https://easylaw.go.kr/CSP/CnpClsMainBtr.laf?popMenu=ov&csmSeq=835&ccfNo=4&cciNo=1&cnpClsNo=2 "찾기쉬운 생활법령 — 인터넷 쇼핑 반품 및 환불"
[2]: https://www.law.go.kr/lsInfoP.do?lsId=009338&ancYnChk=0 "전자상거래 등에서의 소비자보호에 관한 법률 시행령"
[3]: https://www.kca.go.kr/odr/pg/pi/osPgBjResolvW.do "한국소비자원 — 소비자분쟁해결기준"
[4]: https://resend.com/docs/dashboard/domains/introduction "Resend — Verified Domains"
[5]: https://resend.com/docs/dashboard/domains/manage-domains "Resend — Managing Domains"
[6]: https://resend.com/docs/dashboard/domains/dmarc "Resend — Implementing DMARC"
[7]: https://resend.com/docs/dashboard/webhooks/introduction "Resend — Webhooks"
[8]: https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html "Amazon SES — Creating and verifying identities"
[9]: https://docs.aws.amazon.com/ses/latest/dg/monitor-using-event-publishing.html "Amazon SES — Event publishing"
