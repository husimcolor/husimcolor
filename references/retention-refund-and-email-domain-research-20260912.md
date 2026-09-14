# 보관·환불·이메일 도메인 설계 근거

작성일: 2026-09-12
범위: 구현 전 정책 및 DNS·발신 구성 조사. 외부 서비스 가입·결제·DNS 변경은 하지 않았다.

## husimcolor.com 공개 DNS 점검

2026-09-12 DNS-over-HTTPS 조회 기준으로 `husimcolor.com`은 `104.18.26.246` A 레코드와 `ns1.globaldomaingroup.com`, `ns2.globaldomaingroup.com` NS를 사용한다. `https://husimcolor.com`은 Cloudflare를 통해 HTTP 200과 HSTS를 응답한다.

그러나 루트 도메인의 MX 및 TXT가 없고, `_dmarc.husimcolor.com`, `_mta-sts.husimcolor.com`, `mta-sts.husimcolor.com`에도 필요한 TXT/A 레코드가 없었다. 따라서 현재 `result@husimcolor.com`은 **발신 인증도, 수신 사서함도 구성되지 않은 상태**로 판단한다. 단순 발신만을 위해 루트 MX가 반드시 필요한 것은 아니지만, 사용자의 회신을 받거나 DMARC aggregate report를 수신하려면 별도 수신 사서함 또는 보고서 수신 주소가 필요하다.

## 디지털 분석상품 청약철회 설계 근거

국가법령정보·찾기쉬운 생활법령은 전자상거래에서 일반적으로 7일 내 청약철회가 가능하되, 용역 또는 디지털콘텐츠의 제공이 개시된 경우에는 제한 사유가 될 수 있고, 디지털콘텐츠의 경우 청약철회 불가 사실을 표시한 뒤 일부 이용·한시적 이용·체험용 콘텐츠 또는 정보 제공 같은 시험사용 조치를 해야 한다고 설명한다. 또한 사업자가 이 조치를 하지 않으면 제한 사유에도 소비자의 청약철회가 가능할 수 있다고 안내한다.

따라서 휴심컬러의 `검사 시작`은 단순 화면 진입이 아닌, 사용자가 결제 전 상품 상세에서 **디지털 분석 제공 개시 및 환불 제한 고지**를 확인하고, 결제 후 별도 확인 동의를 한 뒤, 서버가 최초 컬러 선택을 수신해 `assessment_attempt.startedAt`을 고정한 시점으로 정의해야 한다. 무료 컬러 체험·상품 상세·샘플 결과 등은 법령상 시험사용 또는 정보 제공 역할을 할 수 있도록 유지한다. 정확한 고지 문구와 개별 사례 적용은 법률 검토가 필요하다.

## 보존 기간과 결제 기록의 분리

사용자 정책으로 회원 결과/PDF는 결과 생성일로부터 1년, 비회원 결과/PDF와 재다운로드 권한은 7일로 설계한다. 이 기간은 `analysis_results`, `pdf_reports`, private storage object, 비회원 email-login token에 적용한다.

단, 결과/PDF의 개인정보 보관 기간과 주문·결제·환불·분쟁 대응을 위한 거래 기록 보존은 분리한다. 전자상거래법 시행령의 적용 범위와 다른 세법·전자금융 관련 보존 의무에 따라 주문 금액 snapshot·결제 provider ID·환불 상태·쿠폰 정산·감사 로그의 필요 보존기간이 달라질 수 있으므로, 결과 snapshot과 PDF를 파기하더라도 최소 거래 기록의 보존·가명화 범위는 정식 법률·세무 검토 후 확정한다.

## 이메일 도메인 인증 및 발송 공급자 조사

Resend는 소유 도메인을 검증해야 하며, 검증 뒤 해당 도메인 주소에서 발신할 수 있다. Resend는 발신 평판 분리를 위해 루트보다 subdomain 발신을 권장하지만, `result@husimcolor.com`을 요구한 경우 루트 도메인을 검증하여 해당 주소로 보내는 것이 가능하다. 이메일 전송 전용 `mail.husimcolor.com` 또는 `transactional.husimcolor.com`은 Return-Path/추적 분리에만 사용하고, 사용자 표시 발신자는 `휴심컬러 결과 <result@husimcolor.com>`으로 유지하는 구성을 권장한다.

Resend 도메인 검증은 dashboard가 제시하는 정확한 DKIM/SPF(CNAME 또는 TXT/MX) 레코드를 DNS에 추가하는 방식이다. DMARC는 SPF/DKIM이 정상 통과한 뒤 `p=none` + `rua` 모니터링으로 시작하고, 실제 모든 발신이 정상임을 검증한 뒤 `quarantine`, 나아가 `reject`로 강화하는 순서가 권장된다. Resend 웹훅은 at-least-once, 순서 비보장이므로 provider event ID를 unique 저장한다.

Amazon SES도 대안이다. 도메인 identity를 검증하면 도메인 내 이메일 주소가 발신할 수 있고, Easy DKIM의 2048-bit CNAME 레코드, custom MAIL FROM MX/TXT, configuration set 이벤트 발행을 제공한다. PDF 첨부와 delivery/bounce/complaint 이벤트를 지원하지만 AWS IAM·SNS/EventBridge 운영이 추가되어 초기 도입 난이도가 높다.

## Sources

1. https://easylaw.go.kr/CSP/CnpClsMainBtr.laf?popMenu=ov&csmSeq=835&ccfNo=4&cciNo=1&cnpClsNo=2
2. https://www.kca.go.kr/odr/pg/pi/osPgBjResolvW.do
3. https://resend.com/docs/dashboard/domains/introduction
4. https://resend.com/docs/dashboard/domains/dmarc
5. https://resend.com/docs/dashboard/domains/manage-domains
6. https://resend.com/docs/dashboard/webhooks/introduction
7. https://docs.aws.amazon.com/ses/latest/dg/creating-identities.html
8. https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim.html
9. https://docs.aws.amazon.com/ses/latest/dg/attachments.html
10. https://docs.aws.amazon.com/ses/latest/dg/monitor-using-event-publishing.html
