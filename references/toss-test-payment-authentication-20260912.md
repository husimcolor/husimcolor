# Toss 테스트 결제 카드 인증 및 페이북 QR 점검

작성일: 2026-09-12
범위: 휴심컬러 테스트 checkout의 카드 선택 경로와 Toss Payments 공식 테스트 환경 문서 점검. 실제 운영 결제·주문 승인·DNS는 변경하지 않았다.

## 확인 결과

`commerce-checkout.tsx`는 Toss SDK v2의 `payment.requestPayment()`에 `method: "CARD"`만 전달한다. 카드사 코드, 페이북, 간편결제, 특정 앱 결제를 고정하는 입력은 없으며, 서버의 `toss-test-provider.ts`도 인증 이후 `paymentKey`, `orderId`, `amount`만 승인 API에 전달한다.

따라서 페이북 QR 화면은 휴심컬러 요청 파라미터가 강제한 결제수단이 아니라, 테스트 결제창에서 사용자가 페이북을 선택한 뒤의 카드사 앱 인증 분기다. 첨부 화면에서 QR을 휴대폰으로 스캔했을 때 페이북 앱 테스트 인증으로 넘어가지 않고 문자열이 표시된 현상은 이 앱 인증 경로가 테스트 상점과 호환되지 않는 상황으로 본다.

## 공식 테스트 환경 기준

토스는 테스트 환경에서 실카드 정보를 입력해도 가상 승인되고 실제 결제수단에서 돈이 출금되지 않는다고 안내한다. 또한 국내 전용 테스트 카드번호는 제공하지 않으며, 테스트 카드에는 사용자가 직접 발급받은 유효한 카드를 입력하도록 안내한다.[1] [2]

> "테스트용 국내 카드번호는 없어요. 직접 발급받은 카드 정보를 입력해서 결제를 해도 테스트 환경에서는 실제로 돈이 출금되지 않기 때문에 안심하고 사용해도 됩니다." — Toss Payments 공식 테스트 안내[2]

토스는 별도 앱·QR 인증 없이 테스트 `paymentKey`를 얻고 API 승인을 검증하려면 개발자센터 샌드박스를 사용할 수 있다고 안내한다. 샌드박스에서 결제수단을 선택하고 인증 정보를 입력한 뒤 `결제 승인하기`를 누르면 승인 호출과 `paymentKey` 발급을 확인할 수 있다.[2] 이 방법은 Toss 승인 API 자체 검증에는 적합하지만, 휴심컬러 자체 checkout에서 success URL→주문 승인→entitlement로 이어지는 전체 UI 경로를 대신하지는 않는다.

## 권장 테스트 경로

| 목적 | 권장 수단 | 비고 |
|---|---|---|
| 휴심컬러 화면 전체 흐름 | Toss 결제창의 `신용·체크카드`에서 일반 카드번호 입력 경로 선택 | 페이북·앱카드·QR 경로를 선택하지 않음 |
| 서버 승인 API 독립 검증 | Toss 개발자센터 샌드박스 | 테스트 `paymentKey` 발급 후 승인 응답 확인 |
| 실패·취소·중복 회귀 | 현재 구현된 test provider 및 `TossPayments-Test-Code` 헤더 기반 자동검수 | 운영 결제는 비활성 상태 유지 |

## 2026-09-12 checkout 보정 및 확인

휴심컬러 checkout 요청에 `card: { flowMode: "DEFAULT" }`를 명시했다. 이는 카드사·간편결제 자체창을 여는 `DIRECT` 모드가 아닌 통합 선택창을 고정하는 공식 SDK 설정이다.[4] 카드사 코드(`cardCompany`), 간편결제 코드(`easyPay`), 앱카드 전용 옵션(`useAppCardOnly`)은 전달하지 않는다.

수정 뒤 새 테스트 주문에서 Toss 결제창이 `신한`, `하나Pay`, `삼성`, `롯데`, `토스뱅크`, `현대`, `KB국민`, `비씨(페이북)`, `농협`을 동시에 표시하는 일반 카드 선택 목록으로 열리는 것을 확인했다. 따라서 특정 카드사·페이북 결제로 고정된 요청은 없다. 페이북 QR 화면은 사용자가 `비씨(페이북)`을 선택한 뒤의 하위 인증 경로다.

## References

[1]: https://docs.tosspayments.com/guides/v2/get-started/environment "토스페이먼츠 환경 설정하기"

[2]: https://docs.tosspayments.com/blog/how-to-test-toss-payments "회원가입, 사업자번호 없이 결제 테스트하기"

[3]: https://docs.tosspayments.com/guides/v2/get-started/payment-flow "결제 흐름 이해하기"

[4]: https://docs.tosspayments.com/sdk/v2/js/payment-direct "카드사 및 간편결제 자체창 JavaScript SDK"
