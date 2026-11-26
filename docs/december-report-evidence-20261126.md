# 2026년 12월 리포트 이벤트: 운영 근거

## 기존 운영 연결

현재 운영 주소는 https://husimcolor.vercel.app 이고 최신 확인 배포는 dpl_C5G46uYsjv3uUv2BcsKhqxotjjHn, READY, CLI source이다. 운영의 Git SHA 메타데이터는 없다. origin/main은 98f239d73f9e92a80a42e5123f1c12ae02448a7a이며, 이번 작업은 main 이후 코칭 변경을 보존하기 위해 feature/december-telephone-coaching-event의 c1f2846에서 시작했다. 오래된 WebDev 복원본 19480b39는 운영 소스로 사용하지 않았다.

2026-10-23 현재 대화의 관리자 복구 완료 보고(Qv3aOff0l5cTAQkdPTfv1H)는 기존 Manus WebDev 관리형 운영 원장 연결을 Vercel Production의 기존 DATABASE_URL에 재주입했다고 기록한다. Vercel 메타데이터 조회(2026-11-26)에서 해당 Production 민감 변수의 updatedAt은 1792747795301로, 당시 성공한 갱신 시각과 일치한다. 후속 수정은 메타데이터상 없다. 현재 시스템 DATABASE_URL의 hostname|pathname 비식별 SHA-256은 6db049e51e19f79eead8f8d42f43b35f301cf8fa0110ea6d01d571c176d0037a이다. 읽기 전용 DB 접속은 성공했다. 과거 복구 문서 원본과 현재 연결 동일성의 추가 증거를 확인하기 전 운영 write는 보류한다.

VERCEL_TOKEN 및 VERCEL_RECOVERY_TOKEN으로 직접 REST 조회는 403 forbidden이지만 Vercel 연결을 통한 프로젝트·배포·변수 메타데이터 읽기는 정상이다. sensitive 변수의 원문은 요청·화면·보고서에 출력하지 않았다.

## 기존 배포 보존

운영 파일 목록에는 /api/cron-email-outbox가 있다. 저장소의 공식 .github/workflows/deploy.yml은 기존에 이 함수를 빠뜨리므로, 새 배포에서 유지되도록 함수 번들·런타임·route·crons를 추가했다. 기존 Vercel 스케줄 0 0 * * *와 인증은 유지한다. 별도 이벤트 스케줄을 만들지 않고 서버 시간 비교로 이벤트를 시작·종료한다.

## 공식 참고 문서

- https://vercel.com/docs/rest-api/reference/endpoints/projects/retrieve-the-environment-variables-of-a-project-by-id-or-name : GET /v10/projects/{idOrName}/env, decrypt 필드 및 sensitive 변수 계약.
- https://vercel.com/docs/rest-api/reference/endpoints/deployments/get-deployment-file-contents : GET /v8/deployments/{id}/files/{fileId}, base64 response. 큰 manifest는 도구가 잘라서 소스 SHA 근거로 사용하지 않았다.
- https://vercel.com/docs/build-output-api/v3/configuration : .vercel/output/config.json crons 배열 형식 확인.

## 격리 테스트 DB

로컬 MariaDB의 새 husim_december_e2e를 준비했다. 강제 동기화 명령은 차단되어 실행되지 않았다. 사용자의 생성 전용 방식 승인을 기다리는 중이다. drizzle-kit generate는 DB 접속 없이 /tmp에 CREATE-only 스키마 SQL 81개 문장을 생성했다. SQL 실행은 하지 않았다. 운영 DB에 테스트 행을 만들지 않는다.

## 초기 검증 결과

초기 UI·전화 코칭 27건 통과. UI 작업자의 집중 회귀는 11개 파일 61건 통과. Expo 실제 웹 export 성공. 전체 TypeScript는 기존 tests/landingEbookAdminProxy.test.ts의 저장소 밖 절대 경로 파일 누락 1건으로 실패했고, 해당 기존 테스트를 제외한 앱·서버·나머지 테스트 타입 검사는 통과했다. 전체 회귀 및 할인 실제 DB 흐름은 진행 중이다.

## 추가 확인 — 15:28 KST

시스템 DB에 migration --inspect 읽기 전용 실행: commerce 테이블 4개, 행사 쿠폰 0개, 세 상품 정가 정확. Vercel Production URL과의 직접 해시 대조는 미확정이므로 apply 보류. 고객 행·접속값을 출력하지 않았다.

이미 보관한 홈페이지 11월 22일 실행 구간의 event 9EENOmfyWqKl57WHwkLpvr에는 telephone-event-app-prebuilt의 allStaticFilesPreserved 가드 후 --prebuilt --prod 배포 명령이 있다. event aqeZ6kVbpcsRnvwRzRuJUX에는 c1f2846과 동일한 커밋 제목·7개 파일을 feature/december-telephone-coaching-event에 보존/push한 명령이 있다. 후속 Vercel 조회 event Pvv1D6a5Ua47ABF2vsXTsi는 현재 운영 ID dpl_C5G46uYsjv3uUv2BcsKhqxotjjHn을 확인한다. 해당 서버 변경을 보존해야 하는 근거지만, 전체 static 산출물과 repository tree의 완전 동일성은 직접 입증되지 않았다.

서버 신규+기존 14파일 84건 통과, 로컬 E2E 가드 27건 통과·실DB 1건 미실행. DB·결제·메일 키 제거 전체 회귀는 494건 통과·실DB 1건 스킵, 기존 adminRoleBoundary의 DATABASE_NOT_AVAILABLE 및 Resend credential integration의 키 없음 2건 실패. 외부 홈페이지 import와 Toss 자격증명 외부 테스트는 명시적으로 제외했다. 전체 통과로 보고하지 않는다. source 타입, migration 문법, diff 검사 통과.

최초 브라우저 API fixture QA는 107개 중 106개 통과·직접 checkout 주소의 React hydration 품질 1개 실패였다. 웹 최초 렌더를 공통 확인 화면으로 맞춘 뒤 Expo 재export 및 브라우저 검증 107개 전부 통과·JS 페이지 오류 0건을 확인했다. 최종 집중 회귀 99건 통과·실DB 1건 스킵, source 타입·tRPC/cron 번들도 통과. 가격·SDK 인자·불일치 차단 검증은 실DB·실기기·실결제 성공 증거가 아니다.

GitHub scoped PAT 직접 GET 현재 HTTP401이나 기존 gh 경로의 허용 저장소 GET은 성공하고 push=true. 새 인증·토큰 원문은 출력하지 않았다. 운영 main 및 배포 변경 없음.
