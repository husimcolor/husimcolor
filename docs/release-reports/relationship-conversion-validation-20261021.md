# 관계 결제 전환 개선 1차 검증 기록 — 2026-10-21

## 포함한 변경

부부·연인과 부모·자녀 상품 화면에서는 더 이상 세부 관계·역할 조합을 결제 전에 요구하지 않는다. 상품을 고르면 `다음 · 결제 정보 입력하기`로 checkout에 진입한다. 결제 grant가 준비된 뒤, 첫 참여자의 컬러 선택 전에 관계와 A/B 역할 쌍을 한 번만 확정한다. 부부·연인은 부부/연인과 남편·아내 또는 남자친구·여자친구를, 부모·자녀는 부모와 자녀의 실제 역할(아빠/엄마/아들/딸) 및 첫 참여자를 명시적으로 선택한다. 임의 기본 역할은 사용하지 않는다.

확정값은 entitlement별 `relationship_setups`에 암호화해 저장한다. invite 방식에서는 세션 A/B의 고정 역할도 암호화해 저장하고, 상대는 보완 역할로만 진행할 수 있다. 한 휴대폰 방식에서는 새 로컬 세션에 optional role을 보존한다. 기존 role 없는 세션은 기존 fallback으로 읽으며 변경하지 않는다. 결과 스냅샷, 통합 해석, PDF payload, queued email payload는 새 세션의 고정 역할을 재사용한다.

무료 결과, 유료 안내 클릭, 샘플 열람, checkout 표시, Toss 호출, 결제 성공·취소·실패를 제품·locale·channel·테스트 구분으로 기록한다. 컬러·심리카드와 개인정보는 새 이벤트에 포함하지 않는다. 이벤트 키 unique constraint와 클라이언트 scope key로 React 재렌더·callback 재시도 중복을 줄인다. 관리자 KST 일별 집계만 보호된 `admin.funnelDaily`에서 제공한다.

홈과 무료 결과에는 개인 심화 가치인 `컬러 3개 + 심리카드 3장 / 순서별·통합 해석 / 맞춤 회복 루틴 / PDF 리포트`를 표시했다. 가격과 무료 결과 본문은 바꾸지 않았다. checkout 이메일 입력에는 `주문 확인과 완성된 PDF 리포트를 받을 이메일입니다`를 추가했다.

## 실제 수행한 검증

- `tsc --noEmit` 통과.
- 직렬 전체 Vitest: **94 files / 377 tests 통과**. Toss provider test는 네트워크 요청을 mock한 단위 test다.
- Expo web export 통과. 새 `relationship-setup` route가 static route 목록에 포함됐다.
- 빈 `/tmp` MariaDB에서 current schema를 생성하고, 새 `0023_relationship_setup_and_conversion_funnel.sql`을 statement breakpoint 단위로 적용했다. `relationship_setups`, `commerce_funnel_events`, `assignedRoleEncrypted`, eventKey unique index를 확인했다.
- 같은 격리 DB에서 `COMMERCE_TEST_MODE=true`, `HUSIM_DISABLE_EMAIL_DELIVERY=1`, local private storage로 무실결제·무발송 E2E를 통과했다. 결제 grant → 서버 setup → A 저장/재접속 → B의 보완 역할 제한 → 양측 제출 → private PDF 생성 → queued outbox까지 검증했다.
- E2E 종료 시 outbox는 `queued`, `attemptCount=0` 1건이고 local private PDF 1건이었으며, 실제 Resend/Toss 호출은 하지 않았다.
- 부모·자녀의 자녀 우선 초대 흐름(역할 setup → 재접속 → 보완 역할 고정 → private PDF 생성 → queued outbox)과 한 휴대폰 역할 기반 PDF 매핑도 같은 격리 run에서 통과했다.

## 적용하지 않은 항목

Production DB에는 아직 접속·migration·데이터 변경을 수행하지 않았다. 이번 branch에는 Vercel Production env를 GitHub Actions에서만 private하게 pull하고, schema backup 후 additive `0023`만 적용하는 수동 승인 workflow를 추가했다. workflow 실행 권한과 `VERCEL_TOKEN` Secret은 repository integration 권한으로 조회할 수 없으므로, 실행 결과가 확인되기 전에는 새 관계 setup 서버 저장과 퍼널 table이 Production에서 활성화됐다고 판단하지 않는다.

zh-CN locale branch는 현재 main과 공통 기반이 오래되어, 이번 한국어 feature commit의 직접 cherry-pick에서 locale/checkout/relationship server 관련 충돌이 발생했다. 중국어 번역 경로를 덮어쓰지 않기 위해 자동 해결·배포하지 않았다. 즉, **한국어 feature branch에서의 구조·locale 필드 검증은 완료했지만, zh-CN UI 문구·실제 앱 흐름 검증은 아직 미완료**다. 별도 controlled integration에서 중국어 번역을 추가하고 Korean default/zh-CN 결과·PDF·queued email locale 회귀를 다시 실행해야 한다.

Android 실기기 검증은 수행하지 않았다. Expo web export와 browser/mobile-emulation은 실기기를 대체하지 않는다.

## 운영 적용 전 필수 순서

1. 운영 DB identity와 `__drizzle_migrations` lineage를 보호된 read-only 경로에서 확인한다.
2. snapshot/backup과 DB rollback 책임자를 확정한다.
3. 90일 raw funnel event 보관 삭제 작업을 보호된 운영 scheduler에 등록한다. 세부 데이터 항목과 SQL은 `docs/operations/conversion-funnel-data-and-migration.md`에 있다.
4. Production과 분리된 Preview/test runtime에서 zh-CN 통합 branch의 전체 흐름과 무발송 E2E를 통과시킨다.
5. Product별 checkout 표시(개인/부부·연인/부모·자녀), Korean/zh-CN, Android 실기기를 별도로 확인한다.
6. 그 뒤에만 additive migration과 앱 release를 별도 change로 검토한다.

## 복구

앱 코드만 되돌릴 때는 feature commit을 revert하거나 PR을 merge하지 않는다. `0023`은 기존 고객 행을 수정하지 않는 additive migration이다. DB object drop은 event/setup 데이터를 잃게 하므로 자동 rollback 대상이 아니며, 운영 DB 관리자 승인 및 backup 확인 뒤에만 별도 change로 검토한다. 기존 고객 결과, PDF, 주문, outbox 이메일의 재생성·재발송은 금지한다.
