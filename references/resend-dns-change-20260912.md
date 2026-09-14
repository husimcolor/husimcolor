# Resend DNS 변경 기록 — 2026-09-12

## 변경 범위

Manus Settings → Deployments → Purchased domains → `husimcolor.com` → DNS records 화면에서, 사용자 승인 후 아래 세 레코드만 기본 TTL(1분)로 추가했다.

| 유형 | 이름 | 값 | TTL |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCkwbH8Oinpqa0p4Kg57wxDD79irm++H/BTZsgTqoHJFn1u0ObBWTz1SoFgjLNEsu5NMKAleqibuZHeA7iogkcI+uQL1sJMhmRb9+RugxZW7CBdlwHJTY8zbs4DK5P3jA7TQXlgcMZvKzkEQMR+E3P67fQXv4worljI7AdLmiiv1QIDAQAB` | 1분 |
| CNAME | `rsend` | `rsend-apne1.forge.rmta.net` | 1분 |
| CNAME | `send` | `send.forge.rmta.net` | 1분 |

## 보존 확인

Manus DNS 관리 화면에서 기존 `A @`, `A www`, Zoho MX 3개, Zoho SPF TXT, Zoho 도메인 인증 TXT, Zoho DKIM TXT(`zmail._domainkey`)가 그대로 유지됨을 확인했다. DMARC는 추가하지 않았고, Zoho SPF도 변경하지 않았다.

## 공개 DNS 상태

추가 직후 Cloudflare·Google 공개 DNS 조회에서는 Zoho MX·SPF·DKIM·웹 A 레코드는 정상 응답했으나, 새 Resend 세 레코드는 아직 응답 섹션에 나타나지 않았다. 이후 `ns1.globaldomaingroup.com`과 `ns2.globaldomaingroup.com`을 직접 조회해도 같은 상태였다. 즉 Manus 관리 화면에는 세 레코드가 저장됐지만 권한 네임서버로의 동기화가 아직 완료되지 않았다. 기존 Zoho·웹 레코드는 권한 네임서버에서 그대로 정상 응답했다. 이후 Resend 대시보드에서 사용자가 도메인 인증 상태를 확인한다.

추가 후 약 8분 뒤 권한 네임서버를 재조회했으나 세 Resend 레코드는 여전히 SOA만 반환했다. 이 시점에는 추가 DNS 변경을 하지 않고 Manus 도메인 관리 계층의 동기화 완료를 기다린다.
