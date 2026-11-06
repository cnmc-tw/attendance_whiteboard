
DROP INDEX IF EXISTS reports_date_class_submitted_idx ON attendance.reports;
CREATE INDEX reports_date_class_submitted_idx 
ON attendance.reports USING btree (report_date, class, submitted_at DESC);

CREATE VIEW attendance.latest_reports_per_class AS
SELECT DISTINCT ON (class) *
FROM attendance.reports
ORDER BY class ASC, submitted_at DESC;



DROP INDEX IF EXISTS reports_class_date_submitted_idx ON attendance.reports;