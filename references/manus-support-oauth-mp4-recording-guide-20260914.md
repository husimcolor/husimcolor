# Manus 지원팀 제출용 Production Manager OAuth 오류 MP4 촬영 안내

## 결론

현재 작업 환경은 실제 브라우저 화면을 읽고 조작할 수는 있으나, **사용자 인증이 필요한 실제 브라우저 세션을 연속 MP4로 캡처·내보내는 기능은 제공하지 않습니다.** AI로 만든 영상이나 화면을 이어 붙인 영상은 지원팀이 요청한 “실제 오류 재현” 증빙이 아니므로 생성하지 않습니다.

따라서 사용자가 본인의 브라우저 또는 휴대폰 화면 녹화 기능으로 실제 오류를 촬영해야 합니다. Production 시작 화면은 아래 주소로 준비되어 있습니다.

```text
https://husimcolor.vercel.app/admin?oauth-video=20260914
```

이 절차는 **기존 Redirect URI를 수정·삭제하지 않으며**, API Key, Secret Key, 비밀번호를 입력하거나 보여주지 않습니다.

## 영상 구성

권장 길이는 **30~60초**이며, 다음 두 구간을 같은 MP4 안에 포함합니다.

| 구간 | 촬영할 화면 | 지원팀이 확인할 내용 |
|---|---|---|
| A. Production 오류 재현 | 휴심컬러 Production `/admin` → 운영자 로그인 → OAuth 오류 | Vercel Production callback이 허용되지 않아 발생하는 오류 |
| B. 사용자 설정 화면 범위 | Manus `설정 → Developers` | 일반 사용자 설정에는 API keys·Webhooks만 있고 Redirect URI 편집 UI가 없다는 점 |

## 촬영 전 안전 준비

1. 화면 녹화 전 브라우저의 다른 탭, 알림 배너, 메신저, 이메일, 비밀번호 관리자 팝업을 모두 닫습니다.
2. 브라우저 확대 비율을 100%로 맞추고 주소창은 보이게 둡니다. 주소창에는 비밀값이 없으므로 Production URL과 오류 페이지의 URL이 보이는 편이 좋습니다.
3. **API Key**, **Secret Key**, 결제 키, 쿠키 값, 이메일 인증 코드, 비밀번호, 카드 정보, 개인 이메일 주소가 포함된 화면은 열지 않습니다.
4. Manus에 이미 로그인된 브라우저를 사용하되, 계정 선택 목록이나 프로필 이메일이 보이면 화면 녹화를 **일시정지**합니다. 계정 선택이나 비밀번호 입력은 영상에 포함하지 않습니다.

## A. Production 오류 재현 촬영 순서

1. 화면 녹화를 시작합니다.
2. 주소창에 아래 주소를 입력하거나 준비된 탭으로 이동합니다.

   ```text
   https://husimcolor.vercel.app/admin?oauth-video=20260914
   ```

3. 다음 문구가 보이도록 2~3초 유지합니다.

   > 운영자 로그인 필요  
   > 통합 관리자는 서버에 관리자 역할이 있는 운영자 계정에서만 열립니다.

4. `운영자 로그인` 버튼을 누릅니다.
5. Manus 인증 화면에서 계정 목록·이메일·프로필 사진·비밀번호 입력 화면이 보이면 **바로 녹화를 일시정지**합니다. 필요한 인증을 완료한 뒤 오류 페이지가 로드되면 녹화를 재개합니다.
6. 오류 화면에서 아래 문구와 주소창을 3~5초 유지합니다.

   ```text
   invalid redirect_uri: redirect_uri domain "husimcolor.vercel.app" not allowed for this project
   ```

7. 오류 문구가 보이는 상태에서 화면을 멈추지 말고 다음 구간으로 이동합니다.

## B. 사용자가 Redirect URI를 직접 관리할 수 없는 화면 촬영 순서

1. 새 탭에서 `https://manus.im/app`을 엽니다.
2. 왼쪽 하단 프로필 메뉴에서 `Settings`를 엽니다.
3. 왼쪽 메뉴의 `Developers`를 선택합니다.
4. 화면에 `API keys`와 `Webhooks`만 보이는 상태를 3~5초 촬영합니다.
5. 이 화면에서 **Create new** 또는 API key 생성 화면을 누르지 않습니다. 이는 Redirect URI 설정과 무관하고 민감정보 노출 위험이 있습니다.
6. `Redirect URI`, `OAuth`, `Open App`, `Allowed domains`를 편집하는 항목이 보이지 않는다는 현재 상태만 보여줍니다.
7. 화면 녹화를 종료하고 MP4로 저장합니다.

## 지원팀에 함께 보낼 설명

아래 문구를 MP4와 함께 답장에 붙여 넣을 수 있습니다.

> 휴심컬러 Production Manager OAuth 오류 재현 영상입니다. 기존 Redirect URI는 유지해 주세요. 일반 사용자 Manus 설정의 `Settings → Developers`에는 API keys와 Webhooks만 보이고 OAuth Redirect URI 또는 Allowed domains를 추가하는 UI는 노출되지 않습니다.
>
> Production `/admin`의 운영자 로그인 후 아래 오류가 재현됩니다.
> `invalid redirect_uri: redirect_uri domain "husimcolor.vercel.app" not allowed for this project`
>
> OAuth appId: `mTvBGzpe4naoi2CdDkbujz`
>
> 기존 URI를 삭제하지 말고 다음 두 redirect URI를 추가해 주세요.
> 1. `https://husimcolor.com/api/oauth/callback`
> 2. `https://husimcolor.vercel.app/api/oauth/callback`

## 제출 전 점검표

- [ ] 영상이 Production `/admin` URL에서 시작한다.
- [ ] `운영자 로그인` 버튼이 보인다.
- [ ] `invalid redirect_uri` 오류와 `husimcolor.vercel.app` 도메인이 보인다.
- [ ] Manus `Settings → Developers`에서 Redirect URI 편집 메뉴가 보이지 않는 화면이 포함된다.
- [ ] API Key, Secret Key, 비밀번호, 이메일 주소, 계정 목록, 결제정보, 쿠키 값이 보이지 않는다.
- [ ] 기존 Redirect URI·OAuth 설정은 수정하거나 삭제하지 않았다.
