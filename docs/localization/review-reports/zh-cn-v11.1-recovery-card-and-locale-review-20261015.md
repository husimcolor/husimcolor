# 간체 중국어 v11.1 — 회복 카드 공통 문안 및 locale 일치 검수

- **작성일:** 2026-10-15
- **기준 소스 커밋:** `4954fd814fb602396b8c99bb0f4806ece127d846`
- **작업 브랜치:** `feat/zh-cn-full-localization-v6` (이후 검토 전용 원격 브랜치로 게시 예정)
- **범위:** 사용자가 지정한 네 문장, 이를 생성하는 공통 템플릿/카탈로그, 저장 locale·copyVersion의 PDF/이메일 전달 경로
- **비운영 원칙:** Production 배포·DB migration 실행·실제 이메일 발송·기존 고객 결과/PDF/주문/outbox 변경을 하지 않았다.

## 1. 수정 내용과 적용 경로

| 구분 | 수정 전 | 수정 후 | 공통 적용 경로 |
|---|---|---|---|
| 색상 특성/역할명 구분 | `绿色所呈现的恢复方向` | `绿色所呈现的恢复与平衡` | `shared/locales/zh-cn-static-revision-catalog.ts` → `localizePayload` → 결과 화면/PDF/샘플 |
| 회복 제안 | `倾向于节省力气地使用力量` | `尽量把精力用在自己能够承担的事情上` | 검수 문안 카탈로그 → 개인 결과/PDF |
| 블루 회복방향 | `把心里想对值得信赖的人说一句话吧。` | `试着向信任的人说一句心里话吧。` | 검수 문안 카탈로그 → 무료·개인·관계 결과 및 PDF의 공통 변환 |
| 3번 심리카드 문장 | `现在以3号恢复方向卡牌的倾向于……为底……`처럼 역할명과 문장 조각이 결합될 수 있었음 | `此刻可以参考第3张心理卡所呈现的……，在日常中慢慢找回……。从一句小小的话、一个小小的行动开始，为……留出空间……` | `zh-cn-template-catalog.ts`의 완결 템플릿 |
| 변수 키 누락 | 템플릿 변수 앞 공백 때문에 exact 검수 키가 누락되어 fragment 변환으로 후퇴 | 변수를 `trim()`한 뒤 exact 검수 키를 먼저 조회 | `lib/zh-cn-copy.ts`의 `localizeTemplateVariable` |
| 감각 변수 잔여 | `温暖的连接 감각`, `情感表达 感觉`처럼 일부 조합에 한글이 남을 수 있었음 | `温暖的连接感`, `表达情感的感觉` | `zh-cn-static-revision-catalog.ts` → 공통 템플릿 변수 |

> 세 번째 **선택 컬러의 회복방향**과 세 번째 **심리카드의恢复方向**은 역할명으로만 사용했다. 그린의 일반 색상 특성인 ‘회복·균형’은 `恢复与平衡`으로 표현하여 역할명으로 확대하지 않았다.

## 2. 실제 출력 검수 대상

이번 후속 검수는 공통 문장 변경의 영향을 받는 다음 대표 조합 3종에 한정했다. 모두 가상 데이터이며 DB 저장과 이메일 발송을 하지 않았다.

| PDF | 대표 조합 | 페이지 | 중점 확인 |
|---|---|---:|---|
| 개인 | 그린·오렌지·블랙 | 12 | 7쪽의 색상 특성/회복 제안/추천 조화색 |
| 연인 | 남자친구·여자친구 | 19 | 18쪽의 3번 심리카드 종합 문장 |
| 부모·자녀 | 아빠·아들 | 17 | 14쪽의 아들 블루 회복방향 |

- **문장 독해·시각 검수:** 위 세 페이지와 각 PDF의 contact sheet를 확인했다. 지정 문장이 중국어 완결 문장으로 표시되고, 줄바꿈이나 잘림은 관찰되지 않았다.
- **구조 검사:** 세 PDF의 텍스트에서 한글 잔여, literal `\\n`, `的的`, `的 的`, `蒂尔`, 기존 지적 문구를 검색하여 모두 `PASS`했다.
- **주의:** 이 구조 검사는 자연스러운 문체 전체를 보증하지 않는다. 이번에는 사용자가 지정한 공통 문장과 그 영향 출력만 다시 읽었다.

## 3. locale/copyVersion·PDF·이메일 전달 검증

`tests/localeSnapshotPersistence.test.ts`에서 다음을 검증했다.

1. 새 zh-CN 스냅샷은 `locale: "zh-CN"`, `copyVersion: "zh-CN-2026-10-15-v11.1"`을 보존한다.
2. 결과 화면은 저장된 locale을 우선하여, 이후 앱 선택 언어가 바뀌어도 해당 결과의 locale을 유지한다.
3. PDF 전달 서비스는 저장된 `analysisRuns.locale/copyVersion`을 payload에 사용한다.
4. 이메일 outbox는 저장된 locale을 바탕으로 zh-CN 제목 `[HUSIM COLOR] 您的分析报告（PDF）`과 본문 경로를 선택한다.
5. locale이 없는 기존 스냅샷은 `ko` fallback으로 읽혀 기존 한국어 결과를 유지한다.

이는 코드·회귀 검증이며, Production DB migration 및 실제 queue/email 발송은 수행하지 않았다.

## 4. 자동 검사 결과

```text
pnpm check                                     PASS
Vitest focused 5 files / 34 tests              PASS
- zhCnLocalizationCatalog.test.ts
- localeSnapshotPersistence.test.ts
- premiumPdfReport.test.ts
- couplePdfReport.test.ts
- parentChildPdfReport.test.ts
git diff --check                               PASS
```

## 5. 공용 샘플·화면의 동일 경로 확인

- `shared/sample-reports.ts`는 zh-CN 선택 시 `public/sample-reports/*-zh-CN-sample.pdf`를 선택한다.
- `server/commerce/pdf-delivery-service.ts`는 저장 locale에 따라 `localizePayload()` 후 개인·부부/연인·부모/자녀 PDF를 생성한다.
- `premium-result.tsx`, `couple-result.tsx`는 `ResultLocaleProvider`와 저장 locale을 사용한다.
- 현 공개 zh-CN 샘플 3종에는 이번에 제거한 과거 문구나 한글 잔여가 없음을 텍스트로 확인했다. 이번 3개 후속 대표 PDF는 실제 생성기를 같은 locale 경로로 실행한 별도 검수 산출물이다.

## 6. 남은 확인 항목

- **Android 실기기 PDF 다운로드·파일 앱 열기:** 이 Sandbox에서 직접 검증할 수 없어 **미확인**이다.
- **실제 DB round-trip:** Production migration 및 실제 고객 데이터 변경 금지 조건 때문에 **미실행**이다. 코드·회귀 검증만 수행했다.
- **실제 이메일 수신:** 발송 금지 조건에 따라 **미실행**이다. payload/제목 선택 코드와 회귀 검증만 수행했다.
- **홈페이지 `husimcolor.com`:** 소스 접근 권한이 없어 **미완료**다. 앱의 zh-CN 문안·용어집과 별도로 handoff가 필요하다.
- **전체 조합 원어민 최종 검수:** 대표 조합 검수는 했지만 25색×카드×모든 역할 조합을 중국어 원어민이 전수 독해한 것은 아니다.

## 7. 재생성 방법

```bash
cd /tmp/husimcolor-zh-cn-full-localization
SAMPLE_REPORT_LOCALE=zh-CN \
SAMPLE_REPORT_VARIANT=alternate \
SAMPLE_REPORT_OUTPUT_DIR=/desired/output \
SAMPLE_REPORT_PAYLOAD_DIR=/desired/payloads \
pnpm exec tsx scripts/generate-public-sample-reports.ts
```

생성 후 `pdftotext`, `pdftoppm`으로 텍스트·전체 페이지 이미지를 함께 검수한다.
