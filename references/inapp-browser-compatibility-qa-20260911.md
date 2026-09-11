# 관계 통합분석 인앱 브라우저 호환성 QA

## 점검 목적

카카오톡·Instagram 등의 Android WebView가 시스템 다크 모드 또는 WebKit 텍스트 채움 상속을 적용해 관계 통합분석 카드의 제목·본문을 흐리게 표시하는 문제를, 분석 내용·관계 유형·PDF·이미지 저장 변경 없이 해결한다.

## 원인

`app/+html.tsx`의 전역 `-webkit-text-fill-color: inherit` 규칙은 React Native Web이 각 `Text` 요소에 적용한 글자색보다 부모의 색상을 우선 상속하게 했다. 이에 따라 어두운 카드 내부의 밝은 본문 및 밝은 내부 카드의 짙은 본문이 WebKit 계열 인앱 브라우저에서 저대비로 렌더링될 수 있었다.

## 적용한 공통 보정

| 영역 | 보정 | 범위 |
|---|---|---|
| 범위 제한 WebKit 텍스트 채움 | `.relation-result-webview` 내부만 각 요소의 `currentColor`를 강제 사용 | 관계 통합분석 Text의 명시 색상 보존, 개인 심화 분석 등 다른 화면은 미변경 |
| 강제 라이트 팔레트 | 관계 결과 화면에서 라이트 팔레트를 명시 사용 | 카카오·Instagram WebView의 시스템 다크 모드 격리 |
| 브라우저 색상 강제 변경 방지 | 라이트 색상 스킴·강제 색상 보정 비활성·텍스트 크기 100% 유지 | Android 인앱 및 일반 모바일 브라우저 |
| 공유 요청 격리 | 진행 중 요청은 동일 입력 세션일 때만 재사용 | 새 세션이 이전 진행 요청의 shareId를 공유하지 않음 |

## 로컬 모바일 렌더링 확인

고정 엄마–딸 QA 경로를 393px 모바일 폭에서 확인했다. 상단 요약 카드, 관계 유형 카드, 컬러명, 심리카드명, 제목과 본문이 모두 라이트 팔레트에서 충분한 대비로 표시됐다. 이는 첨부된 카카오 인앱 화면에서 관찰된 어두운 카드 내 텍스트 소실과 반대되는 렌더링 상태다.

## 배포 전 검증

`coupleSharing.test.ts`와 `inAppBrowserCompatibility.test.ts`에서 현재 세션 서명·불변 shareId·관계 결과 전용 WebKit 색상 규칙을 검증했다. 전체 회귀는 117개 통과·1개 스킵했고, TypeScript 및 공백 검사도 통과했다. Production 공유 링크와 실제 인앱 앱 내 렌더링 확인은 배포 후 수행한다.

## Production 일반 브라우저 확인

2026-09-11에 Production 공유 URL `https://husimcolor.vercel.app/couple-result?shareId=18dcec20-592c-4134-9e70-6bac928e1088&inAppCompatibility=3c881d3a`를 열었다. 엄마–딸의 선택 컬러(그린·세이지그린·라벤더 / 옐로우·핑크·코랄), 심리카드 흐름, 관계 유형, 부모·자녀 전용 섹션 및 PDF 버튼이 공유 스냅샷에서 정상 복원됐다. 상단 요약, 관계 유형, 사회적 역할 카드의 제목·본문·컬러명은 라이트 팔레트에서 충분한 대비로 표시됐다.

카카오톡·Instagram의 실제 앱 내 WebView는 이 환경에서 직접 실행할 수 없으므로, WebKit 색상 상속·시스템 다크 모드 간섭을 코드 및 일반 모바일 브라우저에서 차단한 상태로, 배포 뒤 실제 앱에서의 최종 확인이 필요하다.

같은 Production에서 친구 관계 공유 URL `https://husimcolor.vercel.app/couple-result?shareId=c5d1a8ea-4cb8-4d49-a424-48c1572dd36e&inAppCompatibility=3c881d3a`도 확인했다. 친구 관계의 블루·옐로우·그린 / 핑크·피치·라벤더와 심리카드·감정 교류형 우정 결과가 자체 shareId에서 복원됐고, 상단 요약·관계 유형·오해 패턴·연결 방식의 카드 제목과 본문이 명확하게 표시됐다. 기존 친구 관계의 분석 구성·문구는 변경하지 않았다.

부부 관계 공유 URL `https://husimcolor.vercel.app/couple-result?shareId=f222b49f-8cad-44a8-a38e-54fb4682d285&inAppCompatibility=3c881d3a`도 확인했다. 핑크·그린·라벤더 / 블루·옐로우·브라운, 각 심리카드 흐름, 현실협력형 관계와 부부 전용 통합 분석이 해당 shareId에서 정상 복원됐다. 상단 요약과 밝은 「두 사람이 함께 만드는 관계 특성」 카드의 라벨·제목·본문이 명확한 대비로 표시됐다. 부부·연인 분석 문장과 PDF·이미지 저장 기능은 변경하지 않았다.
