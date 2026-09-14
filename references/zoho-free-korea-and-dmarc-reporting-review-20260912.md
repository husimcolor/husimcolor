# Zoho Mail Free 한국 사용 가능성 및 DMARC 보고 사서함 검토

작성일: 2026-09-12
범위: 가입·DNS 변경 없이 공개 공식 문서와 비로그인 가입 화면을 확인한 결과. 계정 생성이나 도메인 검증은 수행하지 않았다.

## 결론

**Zoho Mail Free는 사용자 지정 도메인 1개, 최대 5개 사용자, 사용자당 5 GB를 지원하는 공식 플랜입니다.** 따라서 플랜이 제공되는 데이터센터에 계정이 생성되면 `support@husimcolor.com`을 실제 수신·답장 mailbox로 사용할 수 있습니다.[1] [2]

그러나 Zoho는 Free 플랜을 "selected data centers"에서만 제공한다고만 공개하고, 한국 IP가 배정되는 데이터센터가 Free 대상인지 국가별로 확정한 공식 표를 제공하지 않습니다.[1] [3] Zoho는 가입자의 IP 위치로 기본 데이터센터를 자동 배정하며, 한국은 Zoho의 공개 데이터센터 목록상 별도 데이터센터가 아니라 US·EU·IN·AU·JP·CA·SA 중 하나로 배정됩니다.[4] 비로그인 가입 화면은 현재 접속 환경에서 US 데이터센터 저장을 표시했지만, 이 환경은 한국 IP가 아니므로 **한국에서의 Free 제공을 확정하는 증거로 사용하면 안 됩니다.**

따라서 이번 조사 결과는 다음과 같습니다.

| 판단 | 결과 |
|---|---|
| Zoho Free가 제공되는 데이터센터에서 `husimcolor.com` custom mailbox 사용 | **가능** |
| 한국 사용자에게 Free가 실제 노출되는지 | **공개 문서만으로 확정 불가** |
| 가입·결제 없이 확인하는 안전한 방법 | 본인의 한국 네트워크에서 Zoho Mail 조직 가입 첫 화면에 Free 플랜이 표시되는지만 확인. 도메인 검증·MX 변경·카드 입력 전 중단 가능 |
| 현재 권장 | **Zoho Free를 우선 시도 후보로 유지**. Free가 화면에 없으면 가입·DNS 변경 없이 중단하고 Google Workspace 또는 Zoho Mail Lite로 전환 |

## 한국에서 Zoho Free를 확인하는 최소 절차

아래 단계는 가격·플랜 availability 확인만을 목적으로 하며, 계정 완성·도메인 추가·DNS 수정·요금 결제를 진행하지 않습니다.

1. 한국 인터넷 연결에서 Zoho Mail pricing 또는 organization signup을 연다.
2. Business Email / custom domain 경로에서 **Mail Free / Forever Free** 선택지가 표시되는지 확인한다.
3. Free가 보이면 최대 5 users, 5 GB/user, web-only/모바일 앱 범위를 확인한다.
4. Free가 보이지 않거나 Premium trial만 보이면 즉시 중단한다. 이 경우 해당 배정 데이터센터에는 무료 조직 플랜이 제공되지 않는 것으로 보고, 유료 대안으로 전환한다.
5. Free가 보인다는 사실만 확인된 뒤에야, 별도 승인 시 support mailbox 생성과 DNS 설계를 진행한다.

Zoho 공식 문서는 무료 플랜에 IMAP/POP/ActiveSync가 포함되지 않는다고 명시합니다. 따라서 `support@` 업무는 Zoho 웹메일 또는 Zoho Mail 모바일 앱으로 처리할 수 있을 때만 Free 플랜이 적합합니다.[2]

## DMARC 보고 사서함 재검토

`dmarc-reports@husimcolor.com`을 지금 만들어 둘 필요는 **없습니다**. 아직 Resend 발신을 시작하지 않았고, DMARC DNS record도 게시하지 않으므로 수신할 집계 보고가 없습니다.

DMARC policy record는 보고를 **선택적으로** 요청할 수 있으며, `rua`가 없더라도 DMARC 정책을 게시할 수 있습니다.[5] 다만 `p=quarantine` 또는 `p=reject`로 정책을 강화하기 전에는 실제 발신원이 모두 SPF/DKIM 정렬을 통과하는지 확인하기 위해 집계 보고가 유용합니다.[5] [6]

| 단계 | `dmarc-reports@` 필요성 | 권장 조치 |
|---|---|---|
| 지금: 가입·DNS 변경 전 | 불필요 | 주소는 설계상 예약만 하고 사서함을 만들지 않음 |
| Resend DKIM/SPF 설정과 결과 메일 테스트 | 선택 | Gmail·Naver·Daum·Outlook 수신 헤더의 SPF/DKIM/DMARC 결과를 수동 확인 |
| DMARC `p=none` 모니터링 | 권장 | Zoho Free가 가능하면 두 번째 무료 mailbox `dmarc-reports@`를 생성하거나, 별도 DMARC 분석 서비스의 주소 사용 |
| `p=quarantine/reject` 강화 전 | 사실상 필요 | 최소 2~4주 이상 aggregate report와 provider event를 검토 후 강화 |

처음부터 별도 실제 사용자 mailbox를 만들지 않으면 비용과 관리 대상이 줄어듭니다. Zoho Free가 가능하고 DMARC 모니터링을 시작하는 시점에는 두 번째 free user로 `dmarc-reports@`를 생성하면 됩니다. Free가 불가능하면 수신 provider의 group/alias 또는 DMARC 분석 서비스 주소를 쓰되, `rua`가 조직 도메인 밖을 가리키는 경우 외부 보고 목적지 authorization DNS가 필요할 수 있습니다.[7]

## 확정되지 않은 항목

| 항목 | 현재 상태 | 다음 결정 시점 |
|---|---|---|
| `support@` 수신 provider | Zoho Free 우선 후보 | 한국 네트워크에서 Free 노출 확인 후 |
| `dmarc-reports@` mailbox | 생성 보류 | DMARC `p=none` 모니터링을 시작할 때 |
| `result@` 자동발신 | Resend 유지 | Resend 계정·도메인 검증 승인 시 |
| DMARC policy | DNS 게시 보류 | Resend DKIM/SPF pass 테스트 후 |
| DMARC enforcement | 보류 | 보고서 2~4주 검토 후 |

## References

[1]: https://www.zoho.com/mail/custom-domain-email.html "Zoho Mail — Custom domain email"
[2]: https://www.zoho.com/mail/help/adminconsole/subscription.html "Zoho Mail/Workplace Subscription"
[3]: https://www.zoho.com/mail/zohomail-pricing.html "Zoho Mail Pricing"
[4]: https://help.zoho.com/portal/en/kb/accounts/manage-your-zoho-account/articles/data-center-for-zoho-account "Zoho Accounts — Data center for Zoho Account"
[5]: https://www.rfc-editor.org/info/rfc9989/ "RFC 9989 — DMARC"
[6]: https://datatracker.ietf.org/doc/rfc9990/ "RFC 9990 — DMARC Aggregate Reporting"
[7]: https://dmarc.org/2015/08/receiving-dmarc-reports-outside-your-domain/ "DMARC.org — Receiving DMARC Reports Outside Your Domain"
