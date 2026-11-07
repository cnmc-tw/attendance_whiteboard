

-- ---------------------------------------------------------------------------
-- 0. Security inovker
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW attendance.latest_reports_per_class
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (class) *
FROM attendance.reports
ORDER BY class ASC, submitted_at DESC;


-- ---------------------------------------------------------------------------
-- 1. Tamper protection (applies ONLY to data-API roles; the DEFINER link
--    flow above runs as owner and is intentionally exempt).
-- ---------------------------------------------------------------------------


REVOKE ALL ON FUNCTION identity.synchronize_monitor_profiles(jsonb)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION identity.synchronize_monitor_profiles(jsonb)
TO authenticated;


-- ---------------------------------------------------------------------------
-- 1. Tamper protection (applies ONLY to data-API roles; the DEFINER link
--    flow above runs as owner and is intentionally exempt).
-- ---------------------------------------------------------------------------

ALTER FUNCTION identity.synchronize_monitor_profiles(jsonb)
SET search_path = pg_catalog, identity, auth, pg_temp;


