# 전환 퍼널 데이터·migration 운영 기준

이 문서는 `0023_relationship_setup_and_conversion_funnel.sql`을 적용하기 전의 운영 기준이다. 한국어 운영 DB 또는 고객 데이터를 변경하지 않으며, **승인된 보호된 migration 경로가 운영 DB의 정체와 현재 migration 이력을 확인한 경우에만** 적용할 수 있다.

## 수집 범위

`commerce_funnel_events`의 한 행에는 아래 정보만 저장한다.

- `eventKey`: 클라이언트가 생성한 UUID 기반의 재시도·중복 방지 키다. 동일 키는 unique constraint로 한 번만 저장한다.
- `deviceId`: 기존 기기 단위의 무작위 UUID다. 계정, 이메일, IP 주소, 사용자 에이전트와 연결하지 않는다.
- `eventType`: `free_result`, `paid_guide_click`, `sample_view`, `checkout_view`, `toss_request`, `payment_success`, `payment_cancelled`, `payment_failed` 중 하나다.
- `productCode`: `free_color_trial`, `personal_deep`, `couple_love_deep`, `parent_child_deep` 중 하나다.
- `locale`: 화면 locale (`ko-KR` 또는 `zh-CN`)이다.
- `channel`: `app` 또는 `web`이다.
- `isTest`: 서버 런타임이 판별한 테스트 여부다. 클라이언트가 임의 지정할 수 없다.
- `occurredAt`: 서버 저장 시각이다.

아래 값은 저장·전송하지 않는다: 이름, 이메일, 결제수단 정보, IP, 사용자 에이전트, 컬러·심리카드 식별자, 답변, 심리 해석·PDF 본문, 초대 토큰, 주문번호, 결과 토큰, 쿠폰 코드.

기존 `visitor_logs`의 과거 행은 변경하지 않는다. 새 코드에서는 `selectedColors`와 `selectedCards`를 보내지 않는다.

## 집계와 보관

관리자 `funnelDaily` API는 KST 날짜·상품·locale·channel·테스트 여부별로 행을 집계한다. 과거에 기록하지 않은 단계는 0 또는 추정치로 채우지 않는다. 이 API는 관리자 권한이 있어야만 호출된다. 공개 `visitors.stats` 및 `visitors.testStats`에는 새 퍼널 집계를 노출하지 않는다.

원시 이벤트의 보관 기간은 **90일**이다. 운영 적용 전, 운영 DB 관리 주체가 아래 SQL을 매일 1회 실행하는 보호된 작업을 등록해야 한다. 집계는 조회 시 계산하므로 별도 영구 집계 테이블은 없다.

```sql
DELETE FROM commerce_funnel_events
WHERE occurredAt < (UTC_TIMESTAMP() - INTERVAL 90 DAY);
```

이 삭제 작업은 이벤트 table만 대상으로 하며 주문·결제·이용권·고객·결과·PDF·이메일 테이블을 건드리지 않는다. 이 작업이 등록되기 전에는 raw event 수집을 Production에서 켜지 않는다.

## migration 전 확인

1. 운영 DB 제공자·DB 이름·현재 schema가 올바른 `husimcolor` 운영 DB인지 DB 관리자가 확인한다.
2. `drizzle/__drizzle_migrations`와 repository migration lineage가 일치하는지 읽기 전용으로 확인한다.
3. DB snapshot/backup의 복구 책임자와 복구 시각을 기록한다.
4. maintenance window에서 `0023_relationship_setup_and_conversion_funnel.sql`만 statement breakpoint 단위로 실행한다.
5. `relationship_participants.assignedRoleEncrypted`, `relationship_setups`, `commerce_funnel_events`와 eventKey unique index를 확인한다.
6. test checkout + `HUSIM_DISABLE_EMAIL_DELIVERY=1`의 isolated E2E를 먼저 수행한다. 실제 Toss 승인과 Resend 발송은 수행하지 않는다.

## rollback

이 migration은 기존 행의 값을 수정하지 않는 additive 변경이다. 기능을 되돌릴 때는 먼저 application code를 이전 commit으로 되돌리고, 새 raw event 기록을 중지한다. 기존 고객 결과·PDF·outbox는 어떤 경우에도 재생성·재발송·삭제하지 않는다.

DB 객체 삭제는 데이터 손실 작업이므로 자동 rollback이 아니다. 운영자가 보관 정책과 backup를 확인한 뒤에만 별도 change request로 검토한다. 최소 rollback 후보는 아래 순서지만, Production에서 실행하기 전 DB 관리자의 별도 승인이 필요하다.

```sql
DROP TABLE commerce_funnel_events;
DROP TABLE relationship_setups;
ALTER TABLE relationship_participants DROP COLUMN assignedRoleEncrypted;
```
