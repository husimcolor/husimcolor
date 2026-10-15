# HUSIM COLOR zh-CN v9 보관 README (2026-10-15)

## 목적

이 폴더와 연결된 repository 소스는 HUSIM COLOR의 간체 중국어(`zh-CN`) **검토 전용** 작업본을 보관한다. 한국어가 기본 언어이며, 기존 고객의 저장 결과·PDF·주문·outbox 이메일을 수정하거나 재발송하지 않는다.

## 최신 기준

- **버전:** `zh-CN-2026-10-15-v9`
- **검토 브랜치:** `feat/zh-cn-full-localization-v6`
- **최신 커밋:** 이 README와 함께 커밋되는 HEAD
- **운영 상태:** 검토 브랜치만 갱신. `main` 병합·Production 배포·Production DB migration·실제 이메일 발송을 하지 않음.

## 번역 원본 위치

| 목적 | 위치 |
|---|---|
| 공통 한국어→zh-CN 변환 및 최종 정규화 | `lib/zh-cn-copy.ts` |
| 화면/정적 UI 재검수 문안 | `shared/locales/zh-cn-static-revision-catalog.ts` |
| 색상·카드 해석 카탈로그 | `shared/locales/zh-cn-interpretation-catalog.ts` |
| 완결 문장 템플릿 | `shared/locales/zh-cn-template-catalog.ts` |
| 실제 출력용 수동 검수 override | `shared/locales/zh-cn-reviewed-output-overrides.ts` |
| 무료 25색 문안 | `shared/locales/zh-cn-free-colour-copy.ts` |
| 용어/locale 정의 | `shared/localization.ts` |
| 회귀 검사 | `tests/zhCnLocalizationCatalog.test.ts` |

## 고정 용어

| 한국어 역할 | 간체 중국어 |
|---|---|
| 주기질 | 主要心理特征 |
| 보조기질 | 辅助心理特征 |
| 회복방향 (선택 색상 3번 / 심리카드 3번) | 恢复方向 |
| 무의식 | 潜意识 |
| 현재흐름 | 当前状态 |
| 별도 추천 보완컬러 | 推荐调和色 |
| 틸 | 蓝绿色 |
| 브랜드 | HUSIM COLOR |

> 선택 색상 3번의 **恢复方向**, 심리카드 3번의 **恢复方向**, 결과 계산으로 별도 제시되는 **推荐调和色**는 서로 다른 항목이며 혼동하지 않는다.

## v9 검토 PDF

다음 모두 가상 입력으로 생성했으며 실제 고객 개인정보를 포함하지 않는다.

- 기본 3종 및 추가 대표 조합 3종: `docs/localization/zh-cn-v9-review-pdfs/`
- 상세 변경·검수 범위·미검수 항목: `docs/localization/review-reports/zh-cn-v9-targeted-output-review-20261015.md`

## 재생성

```bash
# 기본 3종 canonical fixture
pnpm exec tsx scripts/render-final-quality-zh-cn-samples.ts

# 추가 대표 조합 (가상 입력, DB/메일 미사용)
SAMPLE_REPORT_LOCALE=zh-CN \
SAMPLE_REPORT_VARIANT=alternate \
pnpm exec tsx scripts/generate-public-sample-reports.ts
```

생성 후에는 `pdftotext`로 문장 파편·한글 잔여·잘못된 호칭을 검사하고, `pdftoppm`으로 모든 페이지를 렌더링해 실제 레이아웃을 읽는다.

## 검수 완료와 보류

- **확인됨:** v9 보고서에 지정한 기본 3개와 추가 3개 대표 조합의 공통 출력, 구조 패턴, PDF 글꼴/레이아웃.
- **보류:** 모든 25색×심리카드 조합, 모든 관계 역할 조합, 실제 결제/메일/모바일 파일앱 E2E, 원어민 최종 QA, 홈페이지 `husimcolor.com` 소스 반영.

## 영어 파일럿

영어 v4.2는 `docs/localization/english-v4.2-pilot/`에 별도 보관한다. 이 파일은 참고용이며, 이번 zh-CN 보정이나 배포 대상이 아니다.

## 보안·개인정보

이 보관물에는 API 키, 비밀번호, 환경변수, 실제 고객 결과, 주문, 이메일 outbox, 데이터베이스 덤프를 포함하지 않는다.
