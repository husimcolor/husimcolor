-- 신규 분석 결과에만 언어·문안 버전을 기록한다.
-- 기존 고객 결과, private PDF, 주문, 이메일 outbox는 null을 유지하며 한국어 원문 경로로 계속 읽는다.
ALTER TABLE `analysis_runs`
  ADD COLUMN `locale` varchar(12) NULL,
  ADD COLUMN `copyVersion` varchar(80) NULL;

ALTER TABLE `relationship_sessions`
  ADD COLUMN `locale` varchar(12) NULL,
  ADD COLUMN `copyVersion` varchar(80) NULL;

ALTER TABLE `email_outbox`
  ADD COLUMN `locale` varchar(12) NULL,
  ADD COLUMN `copyVersion` varchar(80) NULL;
