-- 1. 支援「指定日期與班級」或「指定日期」的查詢，並直接在 DB 完成 submitted_at 排序
DROP INDEX IF EXISTS attendance.reports_date_class_submitted_idx;
CREATE INDEX reports_date_class_submitted_idx 
ON attendance.reports USING btree (report_date, class, submitted_at DESC);

DROP view IF EXISTS attendance.latest_reports_per_class;
CREATE VIEW attendance.latest_reports_per_class AS
SELECT DISTINCT ON (class) *
FROM attendance.reports
ORDER BY class ASC, submitted_at DESC;



DROP INDEX IF EXISTS attendance.reports_class_date_submitted_idx;