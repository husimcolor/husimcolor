# Production OAuth Redirect 점검 기록

- Production `/admin` 로그인 버튼은 서버 생성 OAuth URL을 통해 `https://manus.im/app-auth`까지 정상 이동했다.
- OAuth 포털은 `https://husimcolor.vercel.app/api/oauth/callback`에 대해 `invalid redirect_uri`를 반환했다. 이는 운영자 계정 문제가 아니라 OAuth 앱 등록의 허용 redirect URI 누락 상태다.
- 최종 등록 후보는 `https://husimcolor.com/api/oauth/callback` 및 현재 Production 검증용 `https://husimcolor.vercel.app/api/oauth/callback`이다.
- OAuth 앱 설정 변경은 실제 로그인 검증 뒤에만 완료로 처리한다.

로그인된 Manus 앱의 계정 메뉴에는 `Settings` 항목이 확인됐다. 문서의 과거 Open App 직접 URL은 현재 404였으므로, 이 설정 메뉴에서 현재 OAuth 앱 관리 위치를 확인해야 한다.

현재 Settings 창의 `Data & Integrations` 구역에는 `Developers` 메뉴가 확인됐다. 이 메뉴에서 해당 프로젝트 OAuth 앱의 허용 redirect URI를 점검·수정할 수 있는지 이어서 확인한다.

현재 개인 계정의 `Developers` 메뉴에는 API keys와 Webhooks만 노출되며, Open App 또는 redirect URI 관리 항목은 확인되지 않았다. 따라서 이 앱의 OAuth 허용 URI는 일반 API key 설정과 별도의 프로젝트/플랫폼 관리 영역에서 관리되는 것으로 보인다.

`Integrations` 메뉴도 Zapier·Slack·Telegram·Line 연결만 제공하며, 앱 OAuth redirect URI 설정 항목은 확인되지 않았다.

## 지원팀 MP4 재현 준비 (2026-09-14)

- `https://husimcolor.vercel.app/admin?oauth-video=20260914`는 운영자 로그인 필요 화면을 표시한다. 이 화면은 통합 관리자가 서버에 `admin` 역할이 있는 운영자 계정에서만 열린다는 안내와 `운영자 로그인` 버튼을 제공한다.
- 로그인 버튼은 Production 콜백 `https://husimcolor.vercel.app/api/oauth/callback`을 사용하는 OAuth 인증 흐름을 시작하며, 이전 재현에서 허용되지 않은 redirect URI 오류가 확인됐다.
- 로그인된 Manus 웹앱의 `설정 → Developers` 화면을 읽기 전용으로 재확인한 결과, `API keys`와 `Webhooks`만 표시되며 OAuth Redirect URI 또는 허용 도메인을 편집하는 항목은 보이지 않는다.
- 제출 영상에는 API 키 생성·조회, 계정 선택 목록·이메일·프로필 이미지·비밀번호·브라우저 자동완성 정보가 보이지 않도록 한다.
