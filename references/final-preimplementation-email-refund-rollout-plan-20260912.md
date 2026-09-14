# 휴심컬러 결제·환불·이메일 최종 구현 준비안

작성일: 2026-09-12
작성자: Manus AI
범위: **설계·설정 목록만 포함**. Resend·메일 호스팅 가입, DNS 수정, DB migration, 코드 수정, 토스 연동, Vercel 배포는 수행하지 않는다.

> **법률 검토 전제**: 환불 자격을 계산하는 서버 규칙과 고객에게 보여 주는 약관·동의 문구는 분리한다. 아래 문구의 정책 의미는 구현 가능하도록 모델링하되, 고객 노출 문안은 법률 검토가 완료된 `APPROVED` 버전만 게시한다. 디지털콘텐츠의 제공 개시 후 청약철회 제한에는 사전 표시·시험사용 또는 정보 제공 같은 요건이 관련될 수 있다.[1]

## 1. 확정 이메일 주소 체계

| 역할 | 주소 | 유형 | 외부 서비스 역할 | 운영 원칙 |
|---|---|---|---|---|
| 고객지원 수신 | `support@husimcolor.com` | **수신 사서함** | Google Workspace 등 메일 호스팅 | 고객 문의·결제/환불 안내의 `Reply-To`; 운영자가 직접 확인 |
| 결과/PDF 자동발신 | `result@husimcolor.com` | **트랜잭션 발신 주소** | Resend | 분석 완료·재다운로드 OTP·PDF 안내 전용. 고객 회신은 `support@`으로 보냄 |
| DMARC 집계 보고 | `dmarc-reports@husimcolor.com` | **분리된 수신 사서함 또는 전용 alias** | 메일 호스팅 또는 DMARC 분석 서비스 | 고객지원 inbox와 권한·보관함을 분리. 고객 문의를 받지 않음 |
| 선택: TLS 보고 | `tls-reports@husimcolor.com` | 별도 수신 alias | 메일 호스팅 | MTA-STS/TLS-RPT를 도입할 때만 사용 |
| 선택: 반송 Return-Path | `bounce.husimcolor.com` | provider 전용 subdomain | Resend | 고객용 From과 반송·평판 데이터를 분리; 주소를 사람에게 노출하지 않음 |

표시 발신은 **`휴심컬러 결과 <result@husimcolor.com>`**, `Reply-To`는 **`support@husimcolor.com`**으로 고정한다. `result@`는 메일 수신 사서함을 반드시 만들 필요는 없지만, 고객이 회신하면 `support@`으로 유도해야 하므로 Reply-To를 누락하지 않는다.

## 2. 필요한 외부 서비스와 계정 경계

| 구분 | 권장 선택 | 필요한 이유 | 아직 수행할 일 |
|---|---|---|---|
| DNS 관리 | 현재 authoritative DNS인 `globaldomaingroup` | `husimcolor.com` DNS 레코드 추가·검증 | DNS 관리자 접근권한과 기존 zone export 확보 |
| 고객지원 수신 | **Google Workspace 권장** | `support@` mailbox, `dmarc-reports@` 별도 mailbox/Group, 사용자 관리와 감사 | 요금제·관리자 계정·보관 정책만 결정. 가입하지 않음 |
| 결과 자동발신 | **Resend 권장** | serverless API, DKIM/SPF 검증, idempotency, delivery/bounce webhook이 초기 구조에 적합 | 팀 계정·발신 region·도메인 소유 검증 계획만 승인 |
| DMARC 분석 | 1차: 별도 `dmarc-reports@` inbox; 2차: 분석 서비스 | 고객지원과 보고 데이터를 분리하고, `p=none` 모니터링 자료 확보 | XML 첨부 보고의 보관자·검토 주기 결정 |
| private PDF 저장 | 기존 앱의 private storage capability를 권한 endpoint 뒤에 사용 | 심리 결과 PDF의 공개 URL 방지 | storage key prefix·암호화·삭제 작업 설계 승인 |
| 작업 재시도 | DB outbox + Vercel Cron 또는 managed queue | PDF·메일·파기 재시도 및 상태 보정 | 초기 판매량과 재시도 SLA에 맞는 scheduler 결정 |
| 결제 | 토스페이먼츠, 이후 Google Play Billing | provider adapter와 entitlement 검증 | 사업자 정보·토스 계약·테스트 키 발급은 구현 단계에서 수행 |

Google Workspace는 root domain MX를 한 번 설정하면 `support@`, `dmarc-reports@` 등 필요한 수신 주소를 한 관리 화면에서 만들기 쉽기 때문에 초기 권장안입니다. Google은 현재 root MX에 `smtp.google.com`을 사용하도록 안내하며, 도메인 소유 검증 및 Gmail 활성화를 요구합니다.[2] Zoho Mail 또는 Microsoft 365도 같은 역할을 수행할 수 있으므로, 기존 업무 도구가 있다면 그 선택을 우선합니다. 어느 수신 공급자를 선택하든 **MX는 한 공급자만** 활성화해야 전달 충돌을 피할 수 있습니다.[3]

## 3. DNS 레코드 템플릿

현재 공개 DNS에는 MX, SPF, DKIM, DMARC, MTA-STS 레코드가 없습니다. 아래는 추가할 **레코드 유형과 책임 경계**이며, provider dashboard가 생성하는 selector·값을 임의 값으로 바꾸지 않습니다.

| 목적 | Host/Name | Type | Value/구성 원칙 | 추가 시점 |
|---|---|---|---|---|
| 메일 수신 | `@` | MX | **선택한 수신 공급자 값만 사용**. Google Workspace 선택 시 priority 1 / `smtp.google.com` | 수신 사서함 생성 직후 |
| 수신 도메인 검증 | provider가 제시 | TXT 또는 CNAME | Google Workspace/선택한 host가 제시한 ownership verification 값 | MX 전환 전 |
| 수신 SPF | `@` | TXT | 한 개의 SPF policy만 유지. 수신 host와 Resend의 인증 요구를 provider 안내대로 결합 | 발신 시작 전 |
| Resend DKIM | Resend가 제시하는 selector | CNAME 또는 TXT | 대시보드의 정확한 레코드 전부 추가. 이름·underscore·target 변경 금지 | Resend domain 추가 후 |
| Resend return-path | Resend가 제시하는 subdomain | CNAME 또는 MX/TXT | 예: `bounce` 계열. 정확한 값은 Resend Records 탭 사용 | Resend domain 추가 후 |
| DMARC | `_dmarc` | TXT | 초안: `v=DMARC1; p=none; rua=mailto:dmarc-reports@husimcolor.com; adkim=s; aspf=r; pct=100` | SPF/DKIM verified 직후 |
| 선택: MTA-STS 정책 식별자 | `_mta-sts` | TXT | `v=STSv1; id=<변경시각>`; HTTPS policy hosting이 준비된 뒤 | 수신 host 안정화 후 |
| 선택: TLS 보고 | `_smtp._tls` | TXT | `v=TLSRPTv1; rua=mailto:tls-reports@husimcolor.com` | MTA-STS와 함께 |

> **중요**: `@`에 SPF TXT 레코드를 두 개 만들면 안 됩니다. Google Workspace의 SPF, Resend의 SPF/return-path 방식은 검증 시점에 제공되는 값과 함께 **하나의 정책** 또는 provider가 권장하는 CNAME 위임으로 구성합니다. Resend는 새 도메인에서 SPF 관련 값을 CNAME으로 제시할 수 있으므로 항상 Records 탭의 최신 값을 사용해야 합니다.[4]

### DNS 설정 절차

1. `globaldomaingroup` DNS zone의 기존 A/AAAA/CNAME/TXT/NS/MX 전체를 export하고, `husimcolor.com` 웹 레코드는 수정하지 않는다.
2. 선택한 수신 host에서 도메인 소유를 검증하고, **`support@`** 및 **`dmarc-reports@`**를 먼저 만든다. `dmarc-reports@`는 지원팀과 별도 access group으로 분리한다.
3. 수신 host가 제시한 MX와 SPF/DKIM을 추가한 뒤 외부 mailbox에서 `support@` 수신 테스트를 한다. MX 이전에 mailbox를 먼저 만든다.[5]
4. Resend에 `husimcolor.com`을 발신 도메인으로 추가하고, dashboard가 만든 DKIM/return-path/SPF 레코드를 추가한다. `result@`를 verified From address로 설정한다.
5. `_dmarc`는 `p=none`으로 시작해 Gmail·Naver·Daum·Outlook의 실제 결과 메일 헤더에서 SPF/DKIM/DMARC pass를 확인한다. 이후 보고서를 확인한 뒤 `quarantine`, 최종적으로 `reject`를 검토한다.[6]
6. `result@`에서 `Reply-To: support@`로 테스트 메일을 보내고, 수신·회신·bounce·complaint webhook이 각 목적지로 분리되는지 확인한다.

## 4. 환불 정책 엔진과 고객 문구의 분리

정책 내용은 DB의 versioned machine rule로, 고객에게 보이는 문구는 별도 versioned document로 관리한다. 이 구조에서는 법률 검토 후 문구나 특정 예외가 바뀌어도 과거 환불 판정의 근거와 승인 당시의 문서를 보존하면서 새 주문에만 새 정책을 적용할 수 있다.

| 모델 | 핵심 필드 | 역할 |
|---|---|---|
| `refund_policy_versions` | `code`, `version`, `effectiveAt`, `ruleJson`, `status` | `DIGITAL_ANALYSIS_V1`, `COACHING_V1`의 서버 판정 규칙. `DRAFT/APPROVED/RETIRED` 상태 |
| `policy_documents` | `policyVersionId`, `surface`, `locale`, `title`, `bodyMarkdown`, `legalReviewStatus`, `publishedAt` | 상품 상세·checkout·검사 시작·마이페이지에 표시하는 교체 가능한 문구 |
| `policy_acceptances` | `orderItemId`, `policyDocumentId`, `acceptedAt`, `method`, `requestHash` | 구매/검사 시작 시 고객이 본 문서 버전과 동의 이력 |
| `refund_decisions` | `refundRequestId`, `policyVersionId`, `eligible`, `reasonCode`, `factsJson`, `reviewRequired` | 자동 판정 결과와 당시 facts의 immutable 기록 |
| `admin_audit_logs` | `actor`, `action`, `before`, `after`, `reason` | 문구 발행·환불 예외·정책 변경 감사 |

서버 규칙은 다음을 기준으로 하며, 문구 자체를 코드에 하드코딩하지 않습니다.

| 상품 | 서버 fact | 기본 규칙 | 법률 검토 후 바뀔 수 있는 부분 |
|---|---|---|---|
| 개인·부부/연인·부모/자녀 유료 분석 | `assessment_attempt.startedAt` | null이면 전액 환불, 값이 있으면 자동 전액 환불 대상 아님 | 검사 시작의 동의·고지 방식, 예외·장애·오표시 처리 |
| 친구·무료 컬러 체험 | `grant_type=FREE` | 주문·PG 환불 흐름 없음 | 무료 서비스 고지 문구 |
| 전액 결제 코칭 | `coachings.cancelDeadlineAt`, `noShowConfirmedAt` | KST 기준 예약일 전날 23:59:59까지 전액 환불, 이후 기본 불가 | 업종 분류, 당일 변경·사업자 귀책·불가항력·개별 분쟁 예외 |

`ASSESSMENT_STARTED`는 개인정보 페이지 진입이 아니라, **결제 전 고지·동의 acceptance가 존재하고 첫 컬러 선택 저장 API가 성공한 순간**에 서버 transaction 안에서 한 번만 기록한다. 주문·구매권한·검사 attempt·정책 버전이 함께 잠기므로, 뒤로가기·새로고침·중복 클릭으로 환불 상태가 바뀌지 않는다.

## 5. 최종 구현 단계와 선행조건

| 단계 | 구현 범위 | 외부 선행조건 | 완료 기준 |
|---|---|---|---|
| 0. 법률·운영 승인 | 약관/환불 문구, 고지 위치, 보관·삭제 고지, 코칭 예외 정책 | 법률 검토 담당자, 문안 승인자 | `APPROVED` policy document 1차 발행 |
| 1. 수신 메일 기반 | `support@`, `dmarc-reports@`, mailbox access 분리 | Google Workspace 등 수신 host 결정·도메인 검증 | 외부 메일 수신·지원 회신·DMARC inbox 접근 확인 |
| 2. DNS 발신 인증 | Resend domain verification, DKIM/SPF/return-path, DMARC monitor | Resend team·DNS admin | Gmail/Naver/Daum/Outlook에서 SPF/DKIM/DMARC pass |
| 3. 서버 보안 기반 | 정책 tables, adminProcedure, audit log, secret 관리 | prod/dev DB 분리·migration 백업 | 관리자가 server-side role로만 정책 문서 발행 |
| 4. 카탈로그·주문·쿠폰 | server-side 가격, order/payment/entitlement, coupon reservation | 상품 코드·가격 승인 | 가격 위변조·쿠폰 동시성 테스트 통과 |
| 5. 토스 결제 adapter | checkout, success confirm, webhook, refund command | 토스 계약·테스트 키·웹훅 secret | 성공/실패/취소/새로고침/중복 승인 테스트 통과 |
| 6. 기존 검사 연결 | entitlement→입력→기존 검사→immutable result | 정책 document/acceptance | 분석 문장·결과 UI 변경 없이 기존 입력 결과 일치 |
| 7. PDF·메일·보관 | private storage, OTP download, outbox, purge, Resend webhook | storage secret·Resend API/webhook secret | 1년/7일 만료·재다운로드·bounce·재시도 테스트 통과 |
| 8. 관리자 | 고객→주문→결제→권한→검사→PDF→메일→환불 타임라인 | 운영자 role·SOP | 재발송·환불 예외·파기 실패를 감사 로그와 함께 처리 |
| 9. Google Play·코칭 | Play verification/RTDN, coaching schedule fulfillment | Play Console, Calendar/예약 도구 결정 | web/Android 구매와 취소·예약 상태가 entitlement에 일치 |

## 6. 구현 시작 전 제공되어야 할 값

| 항목 | 용도 | 제공·결정 주체 |
|---|---|---|
| `globaldomaingroup` DNS 관리 권한 | MX·DKIM·DMARC·provider verification 추가 | 도메인 관리자 |
| 수신 host 선택 | `support@`·`dmarc-reports@` provisioning | 운영 책임자 |
| Resend team 소유자/결제 플랜 | `result@` transactional email과 webhook | 운영 책임자 |
| 법률 검토 승인 문안 | refund/retention/디지털 제공 개시 고지 | 법률 검토자·사업자 |
| 토스 사업자 심사·테스트 키·웹훅 URL | PG adapter 시작 | 사업자·결제 담당자 |
| 발신자 표시명·support 업무 시간·개인정보 문의 SOP | 고객지원 메일 템플릿 | 운영 책임자 |
| DB·storage retention 처리 승인 | 1년/7일 purge 및 최소 거래기록 범위 | 운영·법률·개인정보 책임자 |

## References

[1]: https://easylaw.go.kr/CSP/CnpClsMainBtr.laf?popMenu=ov&csmSeq=835&ccfNo=4&cciNo=1&cnpClsNo=2 "찾기쉬운 생활법령 — 인터넷 쇼핑 반품 및 환불"
[2]: https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace "Google Workspace — MX records 설정"
[3]: https://www.zoho.com/mail/help/adminconsole/configure-email-delivery.html "Zoho Mail — MX records 설정"
[4]: https://resend.com/docs/dashboard/domains/manage-domains "Resend — Managing Domains"
[5]: https://learn.microsoft.com/en-us/microsoft-365/admin/get-help-with-domains/create-dns-records-at-any-dns-hosting-provider?view=o365-worldwide "Microsoft 365 — 도메인 DNS 연결"
[6]: https://resend.com/docs/dashboard/domains/dmarc "Resend — DMARC 구현"
