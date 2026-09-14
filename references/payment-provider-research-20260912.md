# 결제 Provider 공식 문서 조사 메모

조사일: 2026-09-12

## 토스페이먼츠

토스페이먼츠의 온라인 결제 흐름은 요청·구매자 인증·서버 승인으로 분리된다. 성공 URL로 돌아온 `paymentKey`, `orderId`, `amount`를 클라이언트 값으로 신뢰하지 않고, 결제 요청 전에 서버 DB에 저장한 주문번호·최종 금액·쿠폰 적용 정보를 다시 대조한 뒤 서버가 승인 API를 호출해야 한다. `paymentKey`와 `orderId`는 결제 조회·취소·감사 로그를 위해 DB에 보존해야 한다.

토스페이먼츠는 `PAYMENT_STATUS_CHANGED`, `DEPOSIT_CALLBACK`, `CANCEL_STATUS_CHANGED` 웹훅을 제공하며, 웹훅 수신 서버가 200을 반환하지 않으면 최대 7회 재전송한다. 따라서 수신 이벤트 ID 또는 결제 상태 전이 기준의 멱등 처리와 저장 후 200 응답이 필요하다. 가상계좌 등 비동기 결제는 웹훅 기반 상태 갱신이 권장된다.

결제 승인·취소 같은 POST API는 `Idempotency-Key`를 지원한다. UUID 등 충분히 무작위적인 키를 사용하며, 처음 사용일부터 15일간 유효하다. 동일 키의 처리 중 재요청은 409을 반환할 수 있으므로 상점 DB의 주문 잠금·요청 이력과 함께 재시도 정책을 설계해야 한다.

토스페이먼츠 시크릿 키는 Basic 인증에만 서버에서 사용하며, 클라이언트 앱이나 정적 번들에 절대 포함하지 않는다. 공식 문서는 라이브 키 및 결제 API 키에 대해 IP 접근 정책도 지원한다고 설명한다.

## 출처

1. https://docs.tosspayments.com/guides/v2/get-started/payment-flow
2. https://docs.tosspayments.com/en/webhooks
3. https://docs.tosspayments.com/reference/using-api/authorization
4. https://docs.tosspayments.com/reference

### 결제창형 SDK 구현 확인

테스트 결제창은 토스 SDK v2의 `widgets({ customerKey: "ANONYMOUS" })`를 사용한다. 비회원 결제에는 이메일이나 증가 번호가 아닌 `ANONYMOUS`를 사용하고, 서버가 생성한 6~64자 주문번호·서버 가격 스냅샷·상품명을 `requestPayment`에 전달한다. 모바일은 Promise 방식이 아니라 `successUrl`/`failUrl` redirect 방식을 써야 하며, 성공 URL의 `paymentKey`·`orderId`·`amount`는 서버 DB의 주문번호·최종 금액과 다시 대조한 뒤에만 서버 승인 API로 넘긴다. 테스트 키는 실제 청구가 발생하지 않지만, 운영 키와 결제 권한 부여 흐름에 섞이지 않도록 Production에서는 테스트 결제 API를 비활성화한다.

5. https://docs.tosspayments.com/sdk/v2/js/environment
6. https://docs.tosspayments.com/sdk/v2/js/payment-window

## Google Play Billing

Google Play Billing은 디지털 상품과 콘텐츠 판매에 사용한다. 공식 흐름은 상품 표시 → 앱 내 구매 → 서버 검증 → 구매권한 부여 → 구매 처리 확인(acknowledge)이며, 앱 콜백만으로 권한을 열지 않고 서버 검증 후 공통 entitlement를 부여해야 한다.

일회성 디지털 상품은 Google Play Developer API의 `purchases.products.get`으로 패키지명·Play 상품 ID·purchase token을 사용해 서버에서 구매·소비·확인 상태를 조회한다. 이 API는 `androidpublisher` OAuth 범위가 필요하다.

Google Play는 Cloud Pub/Sub 기반의 실시간 개발자 알림(RTDN)을 제공한다. 알림 자체는 상태 변경 신호이므로, 수신 후 반드시 Developer API로 완전한 상태를 다시 조회해 내부 주문·구매권한을 갱신해야 한다. 메시지 ID 중복을 피하고, 일회성 상품의 구매·대기 구매 취소와 환불/무효화 이벤트에 맞춰 entitlement를 동기화한다.

Google은 크로스 플랫폼 구매권한을 안전하게 처리하기 위해 서버 백엔드 연동을 권장한다. 이번 설계에서는 토스와 Google Play의 원본 거래 ID만 provider별 구매 기록에 저장하고, 앱의 실제 이용 허용은 provider와 독립적인 entitlement 테이블로 통합한다.

## Google Play 출처

5. https://developer.android.com/google/play/billing/integrate
6. https://developer.android.com/google/play/billing/rtdn-reference
7. https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products/get
8. https://developer.android.com/google/play/billing

## 이메일·PDF 전달

추천 기본 구현은 `EmailProvider` 인터페이스를 두고 초기 구현체로 Resend를 사용하는 방식이다. Resend는 원격 파일 URL 또는 Base64 본문으로 PDF 첨부를 지원하고, 이메일 총 용량은 Base64 인코딩 후 40MB 이하여야 한다. 이 프로젝트의 PDF는 개인 심리정보를 포함하므로 공개 URL을 첨부 source로 쓰지 않고, 서버가 private storage에서 버퍼를 읽어 첨부 본문으로 전송하는 방식을 기본으로 한다.

Resend의 이메일 멱등키는 동일 요청의 중복 전송을 막고 24시간 동안 유지된다. 그러나 운영 DB의 `email_deliveries` 상태·재시도 횟수·provider message ID를 함께 저장해야 24시간 이후 수동 재발송과 감사가 가능하다.

이메일 공급자 웹훅은 적어도 한 번(at-least-once) 전달되고 순서가 보장되지 않는다. 따라서 `svix-id` 또는 provider event ID를 `webhook_events`에 unique 저장하고 중복 이벤트를 무시하며, `created_at` 기준으로 이메일 상태를 단조 증가시켜야 한다. 발송 성공 API 응답과 실제 `delivered` 이벤트는 분리 기록한다.

## 이메일 출처

9. https://resend.com/docs/dashboard/emails/attachments
10. https://resend.com/docs/dashboard/emails/idempotency-keys
11. https://resend.com/docs/dashboard/webhooks/introduction
12. https://resend.com/docs/dashboard/emails/introduction

## 재시도 실행 방식

현재 운영 주소는 GitHub Actions가 Expo 정적 번들과 선택된 Vercel serverless function을 Build Output API 형식으로 배포하는 구조다. 따라서 새 결제 웹훅·PDF 다운로드·재시도 endpoint도 workflow에서 명시적으로 함수 번들·runtime·route에 포함해야 하며, 개발 서버의 Express 프로세스가 Production에서 자동으로 동작한다고 가정해서는 안 된다.

Vercel Cron은 Production 함수 URL에 GET 요청을 보내는 방식이며 `CRON_SECRET`으로 요청을 인증할 수 있다. 호출 실패는 플랫폼이 자동 재시도하지 않고, 중복 호출이나 호출 누락도 가능하므로 `outbox_jobs` 테이블의 잠금·다음 실행 시각·시도 횟수·멱등 키를 근거로 미처리 작업을 재조정하는 방식이 필요하다.

Vercel Hobby 환경의 최소 실행 주기는 하루 1회이고, 더 짧은 간격의 작업은 배포를 실패시킬 수 있다. 이 때문에 초기에는 결제 완료 요청에서 동기적으로 PDF 생성·메일 enqueue를 수행하고, 일일 재조정은 보조 수단으로 둔다. PDF·메일 재시도를 수분 단위로 보장해야 한다면 Vercel 요금제 조건을 확인한 뒤 분 단위 scheduler 또는 별도 managed queue/worker를 선택해야 한다.

## Vercel 출처

13. https://vercel.com/docs/cron-jobs
14. https://vercel.com/docs/cron-jobs/manage-cron-jobs
15. https://vercel.com/docs/cron-jobs/usage-and-pricing
