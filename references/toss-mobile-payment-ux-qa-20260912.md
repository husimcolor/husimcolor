# Toss 모바일 결제 UX QA 기록

작성일: 2026-09-12

## 확인 목적

운영 결제 활성화 전, 휴심컬러 웹 checkout이 Android 모바일 브라우저에서 Toss 공식 결제창을 전체 화면 리다이렉트 방식으로 열고, 휴심컬러가 카드·간편결제의 보안 입력 UI를 직접 렌더링하지 않는지 확인한다.

## 현재 구현 확인

`app/(tabs)/commerce-checkout.tsx`는 Toss SDK `https://js.tosspayments.com/v2/standard`을 로드해 `payment.requestPayment()`을 호출한다. 요청에는 `windowTarget: "self"`를 명시해 모바일에서 현재 페이지가 Toss 결제창으로 이동하도록 했으며, `iframe`은 사용하지 않는다. `successUrl`과 `failUrl`은 같은 휴심컬러 checkout 원본 URL이며, 결제 인증 뒤 `paymentKey`·`orderId`·`amount` 쿼리를 받아 서버 승인 API로 전달한다.

특정 카드사·간편결제 코드는 요청하지 않으며, `card: { flowMode: "DEFAULT" }`를 사용한다. 2026-09-12 새 테스트 주문에서 Toss 결제창이 카카오페이·SSG페이와 신한·하나·삼성·롯데·토스뱅크·현대·KB국민·비씨·농협의 일반 선택 목록을 동시에 표시함을 확인했다. 페이북 QR은 비씨(페이북)를 선택한 뒤의 카드사 하위 인증 경로이며 checkout의 고정 설정이 아니다.

## 모바일 폭 QA

393×852 Android 기준 뷰포트에서 휴심컬러 checkout의 제목·가격·이메일·쿠폰 입력·CTA는 화면 폭에 맞게 한 열로 표시됐다. PC 레이아웃을 축소한 형태가 아니며, 결제 수단 보안 UI는 Toss 외부 결제창에만 표시된다.

## 공식 요구사항과 브라우저 구분

| 환경 | 현재 상태 | 운영 전 결론 |
| --- | --- | --- |
| Android Chrome | `windowTarget: "self"` 리다이렉트와 모바일 폭 주문서 확인 | 테스트 키 실승인·성공 복귀는 실제 Android 기기에서 추가 확인 필요 |
| Samsung Internet | 동일한 표준 웹 리다이렉트 경로 사용 | 실제 Android 기기에서 카드/간편결제 앱 복귀 확인 필요 |
| Kakao/Naver 인앱브라우저 | 웹 페이지에서 Toss 결제창으로 이동 가능하나 앱-투-앱 딥링크 제어 권한은 인앱브라우저가 가짐 | 결제 진입 전 외부 브라우저 열기 안내 및 실기기 QA를 운영 필수 조건으로 둔다 |
| Expo 네이티브 앱 WebView | 아직 native Toss WebView adapter·앱스킴 처리 미구현 | Play 배포 전 별도 네이티브 WebView/SDK 구현 및 Android 앱스킴 등록 필요 |

토스 공식 문서는 모바일에서 iframe·frame 위 결제창 호출을 금지하고, 모바일 호출 시 페이지가 이동한다고 명시한다. 또한 웹뷰 환경은 카드·은행 앱의 딥링크/Intent 처리를 앱 코드에서 구현해야 한다. 따라서 휴심컬러 현재 웹 checkout은 일반 Android Chrome·Samsung Internet에 맞는 `self` 리다이렉트 구조이며, Kakao/Naver 인앱브라우저와 향후 네이티브 앱은 실제 기기별 검증을 별도 완료해야 한다.

## 테스트·운영 차이

테스트 키는 실제 청구 없이 Toss 결제창과 서버 승인 계약을 확인한다. 운영 키 전환 시에는 Toss 개발자센터의 승인된 MID·허용 origin·웹훅·취소/환불 정책을 별도로 적용해야 한다. 운영 실결제·웹훅·환불은 현재 비활성 상태다.

## 참고 자료

1. https://docs.tosspayments.com/guides/v2/payment-window/integration
2. https://docs.tosspayments.com/sdk/v2/js/payment-window
3. https://docs.tosspayments.com/guides/v2/webview
4. https://docs.tosspayments.com/blog/android-ios-webview-deeplink
5. https://docs.tosspayments.com/blog/redirect
