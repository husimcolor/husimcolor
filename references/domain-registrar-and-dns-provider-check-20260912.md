# husimcolor.com 등록업체 및 DNS 관리업체 조회

조회일: 2026-09-12
범위: RDAP 및 공개 DNS 읽기 전용 조회. DNS 레코드·네임서버·도메인 설정은 변경하지 않았다.

| 항목 | 확인 결과 |
|---|---|
| 도메인 등록업체(Registrar) | **Global Domain Group LLC** (IANA Registrar ID 3956) |
| 권한 네임서버 | `ns1.globaldomaingroup.com`, `ns2.globaldomaingroup.com` |
| DNS 관리업체 | **Global Domain Group** |
| SOA primary | `ns1.globaldomaingroup.com` |
| Cloudflare nameserver 사용 여부 | 사용하지 않음 |
| Cloudflare 가입 필요 여부 | 현재 DNS를 수정하려면 **Cloudflare 가입이 아니라 Global Domain Group DNS 관리 화면 접근권한**이 필요함 |

## 판단

현재 `husimcolor.com`은 Cloudflare에 위임되어 있지 않다. 따라서 Zoho 인증 TXT를 비롯한 DNS 변경은 Global Domain Group의 DNS 관리 화면에서 수행해야 하며, Cloudflare 계정을 새로 만들 필요는 없다.

Cloudflare를 추후 DNS 관리업체로 사용하려면 Cloudflare에 도메인을 추가하고, Global Domain Group에서 네임서버를 Cloudflare가 지정한 값으로 교체하는 별도 이전 작업이 필요하다. 이는 웹·Vercel·메일 레코드에 영향을 줄 수 있으므로 이번 Zoho TXT 인증 목적에는 권장하지 않는다.

## 보존 확인 범위

공개 조회에서 A 레코드는 `104.18.26.246`으로 응답했다. MX와 TXT는 현재 별도 레코드가 없는 상태로 조회됐다. 이번 조회는 추가·삭제·수정 없이 종료했다.

## Reference

- RDAP: https://rdap.verisign.com/com/v1/domain/husimcolor.com
- DNS-over-HTTPS: https://dns.google/resolve?name=husimcolor.com&type=NS
