# 카카오 로그인 구현 근거

- 카카오 로그인은 사전에 등록한 Redirect URI로 인가 코드를 전달하며, URI가 정확하지 않으면 `KOE006` 오류가 발생할 수 있다. 리디렉션 URI와 카카오 로그인 활성화 여부는 카카오 개발자 콘솔에서 확인한다.
  - https://developers.kakao.com/docs/ko/kakaologin/prerequisite
- 카카오 로그인은 동의 화면에서 서비스가 설정한 필수·선택 동의항목을 받고, 인가 코드를 서비스의 Redirect URI로 돌려준다. 이메일은 카카오계정 이메일 동의항목 설정과 사용자 동의·계정 상태에 따라 제공 여부가 달라질 수 있으므로, 미제공 회원에게는 별도의 서비스 이메일 소유권 확인 절차가 필요하다.
  - https://developers.kakao.com/docs/ko/kakaologin/rest-api

이 문서는 2026-10-12 인증 경로 점검의 공식 근거 보존용이며 키·토큰·개인정보를 포함하지 않는다.
