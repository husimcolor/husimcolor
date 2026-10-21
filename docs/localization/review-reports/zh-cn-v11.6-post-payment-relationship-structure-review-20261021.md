# zh-CN v11.6 결제 후 관계·역할 설정 구조 검토

- 기준 브랜치: `feat/zh-cn-full-localization-v11.3`
- 검토 브랜치: `review/zh-cn-post-payment-relationship-v11.3`
- 작성일: 2026-10-21
- 상태: **검토용 구조 반영 완료. 공개·활성화·Production 배포·Production DB migration 미실행.**

## 목적

한국어 운영에 반영된 결제 후 관계·역할 설정 구조를 zh-CN 검토 기준에도 반영한다. 결제 전에는 부부·연인 또는 부모·자녀의 구체 관계·역할을 묻지 않고, 결제 후 컬러 선택 전에 관계와 두 역할, 첫 참여자를 한 번 확정한다.

이 작업은 중국어 공개/활성화를 뜻하지 않는다. 기존 zh-CN locale/copyVersion, 검수 완료 문안과 공개 샘플 정책을 보존하며, 이 branch에서만 구조 호환성을 준비한다.

## 반영 범위

- 부부·연인 및 부모·자녀 모두 `relationship-setup`에서 entitlement별 immutable 관계 설정을 저장한다.
- 부부·연인: `부부/연인`과 첫 참여자 역할을 선택하고 짝 역할을 자동 확정한다.
- 부모·자녀: 부모 역할, 자녀 역할, 첫 참여자 역할을 모두 명시적으로 선택한다.
- 결제 권한과 setup을 재조회해 재진입 시 서버 설정을 원천으로 사용한다.
- 초대 흐름의 assigned role, 한 휴대폰 흐름의 실제 역할, 관계 결과/PDF의 역할 순서는 기존 zh-CN locale/copyVersion snapshot 계약을 유지한다.
- 새 setup UI 16개 정적 문구를 검수용 zh-CN catalog에 추가했다. 관계 유형·역할·성별처럼 동적으로 삽입되는 값도 `localizeStaticCopy`로 표시한다.
- 공개 sample viewer는 zh-CN branch의 기존 locale-aware viewer 구현을 보존했다. 이 branch에서 공개 설정이나 URL을 변경하지 않았다.

## 검증

다음은 로컬 review branch에서 실행했으며 실제 결제, 실제 이메일, Production DB 접근을 사용하지 않았다.

- TypeScript: `tsc --noEmit` 통과
- 집중 Vitest: 5 files / 36 tests 통과
  - `postPaymentRelationshipSetup.test.ts`
  - `zhCnLocalizationCatalog.test.ts`
  - `homeServiceEntry.test.ts`
  - `sampleReports.test.ts`
  - `localeSnapshotPersistence.test.ts`
- locale snapshot test는 새 zh-CN 결과의 `locale`/`copyVersion`이 결과·PDF·발송 대기 email payload에서 유지되고, 기존 locale 없는 결과는 한국어 fallback을 유지하는 source contract를 검사한다.
- `HUSIM_DISABLE_EMAIL_DELIVERY=true` 조건을 사용했으며 이메일 provider 호출 및 실제 결제는 수행하지 않았다.
- Expo web export 통과: `relationship-setup`, `relationship-mode`, `relationship-invite-start`를 포함한 정적 route 58개를 `/tmp/husimcolor-zh-review-export`에 생성했다. 이 산출물은 검증용 임시 파일이며 배포하지 않았다.

## 공개 전 남은 확인

1. 이 review branch의 변경을 zh-CN 전체 검수 기준에 다시 대조하고, 새 setup 화면의 중국어 UX를 실제 모바일에서 검토한다.
2. zh-CN Production locale migration 접근 경로가 별도로 승인·검증된 뒤에만 app code와 schema rollout 순서를 결정한다.
3. zh-CN 공개 sample viewer와 실제 PDF/queued email의 end-to-end 재검증은 공개 승인 전 별도 격리 DB에서 수행한다.
4. 한국어 Production의 기존 고객 주문, 결과, PDF, 이메일, 결제 권한은 이 branch로 변경하지 않는다.

## 비범위

- zh-CN Production 배포, locale 활성화, Production DB migration
- 실제 Toss 결제 및 Resend 이메일 발송
- 기존 고객 결과/PDF 재생성 또는 이메일 재발송
- 한국어 운영 문안·가격·결제 방식 변경
