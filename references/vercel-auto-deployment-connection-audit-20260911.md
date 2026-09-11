# Vercel 자동 배포 연결 복구 점검 기록

## 확인 시각

2026-09-11 GMT+9

## 단절 원인

Vercel 프로젝트 `husimcolor`은 기존 GitHub 저장소 `husimcolor/husimcolor`의 `main`과 연결되어 있었으나, Manus 작업공간은 별도 S3 원격을 사용하고 있어 최신 체크포인트가 GitHub `main`으로 전달되지 않았다. GitHub `main`은 2026-06-02 커밋 `4fb1554`에 머물러 있었고, 최신 Manus 체크포인트 `fe2a5f3`은 해당 공통 조상보다 296개 커밋 앞서 있었다.

Vercel의 GitHub App은 `husimcolor/husimcolor`에 설치되어 코드·배포·웹훅 권한을 보유하고 있었고, 연결 자체는 정상이었다. GitHub `main`을 `fe2a5f3`으로 fast-forward 동기화한 뒤 Vercel은 자동 Production 배포 `83rKfbU9td5o3NXSmPh5kfKgx16M`을 생성했다.

그러나 당시 Vercel에는 Build Command 오버라이드가 없고 Output Directory만 `dist`로 지정되어 있어 저장소에 커밋된 이전 `dist`를 그대로 게시했다. 따라서 자동 배포는 실행됐지만 최신 Expo 웹 번들이 생성되지 않아 운영 화면이 이전 문장을 보였다.

추가 확인 결과, 저장소에는 과거 수동 Vercel Build Output API 산출물인 `.vercel/output/`도 커밋되어 있다. 이 디렉터리가 있으면 Vercel은 새 Git 커밋에서 일반 Build Command를 실행하지 않고 해당 사전 빌드 산출물을 우선 게시한다. 최신 자동 배포가 6초 만에 Ready가 되고 정적 번들 해시가 이전 값으로 유지된 직접 원인이다.

## 복구한 Vercel 프로젝트 설정

| 항목 | 복구 값 | 목적 |
| --- | --- | --- |
| 프로젝트 | 기존 `husimcolor` | 새 프로젝트를 만들지 않고 기존 Production 도메인 유지 |
| 연결 저장소 | `husimcolor/husimcolor` / `main` | GitHub push 기반 자동 Production 배포 |
| Build Command | `npx expo export --platform web --output-dir dist` | GitHub `main` 변경 시 최신 Expo 웹 번들을 재생성 |
| Output Directory | `dist` 유지 | 기존 정적 배포 구조 유지 |
| Node.js Version | `22.x` | 현재 검증 환경과 일치 |
| Domain | `husimcolor.vercel.app` 유지 | 운영 주소 변경 없음 |

## 다음 검증

설정 변경 후 빈 확인 커밋을 기존 GitHub `main`에 푸시해 Vercel이 새 Build Command로 자동 배포를 시작하는지 확인한다. 빌드가 Ready가 되면 `husimcolor.vercel.app/couple-result`에서 부모·자녀 최신 개인화 문구가 실제 번들로 반영됐는지 확인한다.

현재는 Build Command와 Node.js 버전까지 저장되어 있다. 자동 빌드를 실제로 복구하려면 `.vercel/output/`의 추적을 중단하고 향후 생성물을 `.gitignore`로 제외한 뒤, 코드 변경이 없는 확인 커밋을 한 번 더 GitHub `main`에 푸시해야 한다.

## Cloud build 오류 확인

`.vercel/output/` 추적 해제 커밋 `d33d17d` 뒤 Vercel은 실제 cloud build를 시작했다. 이로써 사전 빌드 산출물 우선 게시 문제는 해소되었으나, 첫 빌드는 Metro가 `node_modules/react-native-css-interop/.cache/web.css`의 SHA-1을 계산하지 못해 실패했다.

> `Failed to get the SHA-1 for: /vercel/path0/node_modules/react-native-css-interop/.cache/web.css.`

로컬 개발 서버는 `EXPO_USE_METRO_WORKSPACE_ROOT=1`을 사용하므로, 다음 후보는 Vercel Build Command에도 같은 Metro workspace root 환경을 명시하는 것이다. 이는 결과 생성·도메인·DB를 변경하지 않는 빌드 환경 보정이다.

## GitHub Actions 자동 배포 경로 확인

운영 도메인에 실제로 별칭을 연결하는 성공 배포는 GitHub `main` 푸시마다 실행되는 `.github/workflows/deploy.yml`의 `Deploy to Vercel` 워크플로였다. 이 워크플로는 `dist/`를 `.vercel/output/static/`으로 복사한 뒤 `vercel deploy --prebuilt --prod`를 실행하지만, Expo export 단계가 없었다. 따라서 최신 소스가 아닌 커밋된 과거 `dist/` 번들을 계속 배포했다.

로컬에서는 아래 복구 워크플로를 검증했다. Node.js 22에서 기존 Metro workspace root 환경을 명시하고 Expo web export를 먼저 실행한 뒤, 생성된 `dist`만 Vercel prebuilt output에 복사한다.

```yaml
- name: Build latest Expo web bundle
  run: |
    rm -rf dist .vercel/output
    EXPO_USE_METRO_WORKSPACE_ROOT=1 pnpm exec expo export --platform web --output-dir dist
```

현재 자동 GitHub 토큰에는 workflow 파일을 푸시할 `workflow` 권한이 없어 로컬 커밋 `8513970`의 전송은 거부됐다. 로그인된 GitHub 브라우저에서 같은 변경을 저장하면 기존 자동 배포가 복구된다.

GitHub 웹 편집에서 첫 저장 커밋 `73c92b1`은 CodeMirror 가상 편집기의 일부 뷰만 입력되어 워크플로 블록이 중첩되는 문제가 있었다. 즉시 전체 문서 상태를 교체해 단일 `on` 블록, Node.js 22, Expo export 1회, `dist` 복사 1회, 기존 SPA fallback(`/index.html`)만 남도록 보정했다. 최종 저장 전 EditorView 기준 80행·`on` 1개·Expo build 1개·복사 1개를 확인했다.

두 번째 저장 커밋 `8e72017`은 `Write Vercel output config`의 `run: |` 들여쓰기가 2칸 과도해 GitHub Actions YAML 파싱이 58행에서 실패했다. 현재 편집기에서 해당 `run: |`을 8칸, JSON 내부의 `/index.html` route를 14칸으로 보정했고, 다시 단일 `on`·Expo build 1개 조건을 확인했다. 이 보정 커밋으로 자동 실행을 재검증한다.

YAML 보정 커밋 `1340a86`은 실행을 시작했으나 새 GitHub runner에서 `react-native-css-interop/.cache/web.css`가 Metro 초기 파일 스캔 이후 생성되어 SHA-1을 계산하지 못했다. 같은 상태를 로컬에서 재현한 뒤, Expo export 직전에 해당 cache directory와 빈 `web.css`를 만들면 export가 성공함을 확인했다. 이 사전 생성은 결과 코드가 아닌 CI 빌드 준비 단계이며, 최신 web bundle 생성 명령 앞에만 추가한다.

최종 workflow 커밋 `3eefb22`에서 CSS cache 초기 생성 단계를 적용한 자동 배포 run `34584039740`은 2026-09-11에 성공했다. Checkout → Node.js 22 → pnpm 설치 → 최신 Expo export → prebuilt Vercel Production 배포의 모든 단계가 통과했다. `husimcolor.vercel.app/couple-result?autoDeployRestored=3eefb22&v=202609110926`에서 기존 아빠-아들 세션을 읽기 전용으로 확인한 결과, 실제 호칭, 부모·자녀 전용 관계 역할, DO & DON'T, 갈등 시작·회복 순서, 우리 관계를 위한 3가지 실천, 새로운 부모·자녀 분석 시작 버튼이 모두 렌더링됐다. 관계 설명에는 최신 컬러 교차 문장인 `약속을 확정하는 순간의 속도 차이`도 확인됐다.
