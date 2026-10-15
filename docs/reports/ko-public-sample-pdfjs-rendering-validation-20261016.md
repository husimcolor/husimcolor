# 한국어 공개 샘플 PDF.js 직접 렌더링 검증 — 2026-10-16

## 목적과 범위

운영에 먼저 반영했던 **한국어 공개 샘플 3종**의 브라우저 기본 PDF/iframe 열람이 Android 네이버 앱에서 빈 영역으로 보인다는 보고를 해결하기 위한 수정이다.

> 범위는 **가상 데이터 공개 샘플**뿐이다. 고객 개인 PDF의 인증·접근 제한·전달 방식, 로그인, 결제·쿠폰, 기존 고객 데이터, DB schema, 중국어 전체 배포에는 변경을 넣지 않았다.

| 공개 샘플 | 페이지 수 | 검증 대상 |
|---|---:|---|
| 개인 심화분석 | 12 | PDF.js canvas 첫 페이지·순차 페이지·이미지 대안 |
| 부부·연인 관계 심화분석 | 18 | PDF.js canvas 첫 페이지·순차 페이지·이미지 대안 |
| 부모·자녀 관계 심화분석 | 17 | PDF.js canvas 첫 페이지·순차 페이지·이미지 대안 |

## 구현

1. 브라우저 기본 PDF 플러그인에 PDF 본문 표시를 맡기지 않는다.
   - 동일 origin의 정적 `pdfjs/sample-report-canvas-viewer.html`이 PDF.js 모듈·worker로 공개 sample endpoint를 fetch한다.
   - 첫 페이지 canvas를 먼저 그린 뒤, 나머지 페이지를 번호순으로 추가 렌더링한다.
2. PDF.js 또는 PDF fetch가 실패하면 동일 공개 PDF로 생성한 페이지 JPEG를 표시한다.
   - 1쪽은 eager, 2쪽 이후는 lazy loading이다.
   - 이미지도 상품 allow-list와 실제 페이지 수를 벗어나는 경로를 만들지 않는다.
3. 로딩·오류·재시도 상태를 화면에 표시한다. 빈 iframe/빈 PDF 영역을 성공으로 취급하지 않는다.
4. 웹 Production에서는 공개 PDF API를 viewer와 같은 origin으로 고정했다. Metro 개발 모드에서만 별도 API origin을 사용한다.
5. 확대/축소(85%~125%) 버튼을 제공하며, PDF.js canvas를 다시 렌더링한다. 스크롤은 canvas viewer 내부에서 전체 페이지를 읽을 수 있다.
6. `새 창에서 열기`는 PDF 파일 주소가 아니라 같은 HTML canvas 열람 화면을 연다. 다운로드만 명시적 PDF 다운로드 버튼으로 남겼다.
7. Expo 네이티브 앱에서는 같은 canvas 열람 화면을 인앱 브라우저로 연다.

## 실제 검증 결과

### 코드·빌드

| 항목 | 결과 |
|---|---|
| TypeScript `pnpm check` | 통과 |
| 집중 Vitest | **4 files / 16 tests 통과** (`sampleReports`, `homeServiceEntry`, `koreanSampleViewerIsolation`, `publicSampleCanvasViewer`) |
| 서버 번들 `pnpm build` | 통과 |
| Expo web export | 통과. PDF.js module·worker·페이지 이미지가 정적 export에 포함됨 |
| 공개 API 3종 | PDF `200`, inline / download header 분리 확인 |

> 저장소의 광범위 비외부 suite는 기존 `adminRoleBoundary` 비동기 장기 실행과 반복 발견 문제가 있어 배포 근거로 사용하지 않았다. 이 변경과 직접 관계 있는 회귀·타입·서버/웹 export 검증을 별도로 통과시켰다.

### 실제 페이지 렌더링

동일 origin 정적 export + 공개 API 프록시를 사용한 Chrome DevTools 모바일 크기 검증 결과:

| 상품 | canvas 수 | 이미지 fallback | 첫 canvas | 결과 |
|---|---:|---:|---:|---|
| 개인 심화분석 | 12 | 0 | 461 × 651 | PDF.js canvas 렌더링 |
| 부부·연인 관계 심화분석 | 18 | 0 | 461 × 651 | PDF.js canvas 렌더링 |
| 부모·자녀 관계 심화분석 | 17 | 0 | 461 × 651 | PDF.js canvas 렌더링 |

- 개인 심화분석의 모바일 크기 canvas 실제 표시 캡처: `docs/reports/evidence/ko-public-sample-pdfjs-canvas-mobile-20261016.png`
- 확대 버튼 실행 후 100% → 110% 및 canvas 재렌더링(836 × 1182)을 확인했다.
- 의도적으로 API fetch를 실패시켰을 때 이미지 대안은 **12개 이미지**, 첫 이미지 `1191 × 1684`, `fallbackReason=Failed to fetch`로 표시되었다.
- 기존 `HTTP 200`/iframe load만으로 성공 처리하지 않고 canvas 개수·실제 canvas 크기·fallback 이미지 렌더 상태를 확인했다.

## 미확인과 사용자 확인 요청

- 실제 Android 네이버 앱/카카오 인앱 브라우저에서의 새 운영 배포 확인은 이 환경에서 할 수 없다. 배포 후 각 한국어 샘플 버튼을 눌러 **첫 페이지 본문이 다운로드 없이 보이는지**, 아래 페이지로 스크롤되는지, 확대/축소·상품 복귀·PDF 다운로드가 작동하는지 확인이 필요하다.
- 실제 고객 개인 PDF는 의도적으로 이 검증에 포함하지 않았다.
- 중국어 공개 샘플 및 zh-CN locale schema migration은 이 배포에서 포함하지 않는다.

## 보안·데이터 경계

- 공개 endpoint는 `personal_deep`, `couple_love_deep`, `parent_child_deep` allow-list만 허용한다.
- 가상 데이터 샘플 PDF와 그 페이지 이미지 외의 경로를 반환하지 않는다.
- DB 읽기/쓰기, 주문, 이메일 outbox, 고객 저장 문서, locale migration을 호출하지 않는다.
