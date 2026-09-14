# Global Domain Group DNS 접근권한 및 Zoho TXT 추가 경로

작성일: 2026-09-12
범위: Manus 세션·프로젝트 설정과 공개 등록업체 사이트의 읽기 전용 확인. DNS, 도메인, Vercel, 메일 설정은 변경하지 않았다.

## 권한 확인 결과

현재 Manus 세션에는 **Global Domain Group 전용 연결·API·MCP·프로젝트 환경변수·DNS 관리 권한이 없다.** 현재 목록에 있는 도메인 관련 연결은 Cloudflare, GoDaddy, Vercel뿐이며 모두 비활성 상태이고, `husimcolor.com`은 Cloudflare·GoDaddy가 아니라 Global Domain Group의 권한 네임서버를 사용한다. 따라서 이 프로젝트에서 Global Domain Group DNS를 직접 수정할 수 있는 경로는 확인되지 않았다.

Cloudflare 연결을 활성화해도 현재 authoritative nameserver가 Cloudflare로 위임되어 있지 않으므로, Zoho TXT를 추가할 수 없다. 네임서버를 Cloudflare로 바꾸는 방법은 웹·Vercel·향후 메일 레코드 전체에 영향을 주는 별도 DNS 이전 작업이므로 이번 목적에는 사용하면 안 된다.

Global Domain Group의 공개 사이트에는 일반 고객용 DNS 콘솔 로그인 링크가 노출되지 않았으며, 지원 문의 주소로 `resellers@globaldomaingroup.com`이 안내되어 있다.[1] 도메인이 Manus 추천·구매 흐름으로 생성됐다면, 구매 당시 수신한 도메인 등록 확인 이메일 또는 Manus 도메인 관리 화면에서 관리 계정·재설정 링크가 제공되는지 먼저 확인하는 것이 안전하다.

## 권한 상태별 정확한 방법

| 현재 찾은 권한 | 해야 할 일 | 하지 말아야 할 일 |
|---|---|---|
| Global Domain Group 관리 계정을 찾음 | DNS zone에서 TXT record 1건만 추가 | A/CNAME/NS/MX/SPF/DKIM/DMARC를 수정·삭제하지 않음 |
| 계정 이메일은 알지만 비밀번호를 모름 | 계정의 password reset으로 복구 | 새 Cloudflare zone 생성 또는 nameserver 변경 |
| 관리 계정을 찾지 못함 | 구매 영수증/도메인 등록 이메일을 찾고, 없으면 Manus 도움말 또는 Global Domain Group 지원에 도메인 관리 접근 복구 요청 | 도메인 이전·nameserver 교체를 시도하지 않음 |

## Global Domain Group 콘솔에 접근할 수 있을 때의 Zoho TXT 입력값

DNS 편집 화면의 `DNS Records`, `Zone Editor`, `Manage DNS` 등에서 **Add Record**를 선택한 뒤, 아래 레코드 1건만 만든다.

| 필드 | 입력값 |
|---|---|
| Type | `TXT` |
| Host / Name | `@` *(콘솔이 `@`를 받지 않으면 빈칸 또는 `husimcolor.com`으로 표시되는지 콘솔 도움말을 먼저 확인)* |
| Value / Content | `zoho-verification=zb84860709.zmverify.zoho.com` |
| TTL | 기본값 유지 |

저장 전 기존 레코드 목록을 화면 캡처하거나 export한다. 저장 뒤에는 TXT 레코드 값만 조회해 Zoho 검증을 진행한다. `result@` 자동발신을 위한 MX, SPF, DKIM, DMARC는 이 단계에서 추가하거나 수정하지 않는다.

## 접근권한이 없을 때 보낼 요청 문안

> `husimcolor.com`의 DNS 관리 접근권한을 복구하고 싶습니다. Zoho Mail 도메인 소유권 인증을 위해 기존 DNS 레코드는 전혀 변경하지 않고 TXT 1건만 추가하려고 합니다. 도메인 관리 콘솔 로그인 또는 DNS zone 편집 권한을 안내해 주세요. 추가할 레코드는 Type TXT, Host @, Value `zoho-verification=zb84860709.zmverify.zoho.com`입니다.

## Reference

[1]: https://www.globaldomaingroup.com/ "Global Domain Group — Support Team"
