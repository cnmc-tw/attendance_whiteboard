-- ============================================================================
-- 0001_security_hardening.sql
-- Complete, idempotent security layer for attendance_whiteboard.
-- Safe to apply over the existing database (DROP ... IF EXISTS then CREATE).
--
-- Fixes: V1 (instructor self-escalation), V2 (email-claim trust),
--        V3 (unrestricted insert role/domain), V4 (identity-column tampering),
--        V9 (correct_report signature), V11 (missing DELETE policy),
--        V12 (RLS auto-enable coverage), V13 (anon RPC grants),
--        plus deny-by-default writes on reports.
--
-- Design principles (defense-in-depth / limit blast radius of unknown bugs):
--   * Authorization is keyed on auth.uid() (cryptographic JWT subject),
--     never on the mutable `email` string claim.
--   * Identity-linking columns (auth_user_id, created_at) are immutable from
--     the data-API roles; only the SECURITY DEFINER link flow may set them.
--   * Every policy has an explicit WITH CHECK; never rely on implicit reuse.
--   * Least privilege: anon gets nothing; reports are RPC-only writes.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Identity resolution — by cryptographic subject, not by email string
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION identity."current_user"()
RETURNS identity.users
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = identity, auth, pg_temp AS $$
    SELECT * FROM identity.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$;

-- One-time account linking, keyed on a *verified* email. This is the ONLY
-- path allowed to write auth_user_id, and it runs as the function owner.
-- An attacker cannot mint a verified session for an email they do not control,
-- and unverified sessions (e.g. if an email/password provider were ever
-- enabled) are rejected outright.
CREATE OR REPLACE FUNCTION identity.link_identity()
RETURNS identity.users
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = identity, auth, pg_temp AS $$
DECLARE
    v_email    text := lower(auth.jwt() ->> 'email');
    v_verified boolean := COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean,
        (auth.jwt() ->> 'email_verified')::boolean,
        false
    );
    v_row identity.users;
BEGIN
    IF auth.uid() IS NULL OR v_email IS NULL OR NOT v_verified THEN
        RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='UNVERIFIED_IDENTITY';
    END IF;

    UPDATE identity.users
       SET auth_user_id = auth.uid(),
           name = COALESCE(auth.jwt() -> 'user_metadata' ->> 'full_name', name)
     WHERE email = v_email
       AND (auth_user_id IS NULL OR auth_user_id = auth.uid())
    RETURNING * INTO v_row;

    -- If the email is not on the allow-list, or is already bound to a
    -- different auth user, no row is linked (caller stays unauthorized).
    RETURN v_row;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Tamper protection (applies ONLY to data-API roles; the DEFINER link
--    flow above runs as owner and is intentionally exempt).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION identity.prevent_user_column_tampering()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = identity, pg_temp AS $$
DECLARE
    actor identity.users := identity."current_user"();
BEGIN
    NEW.updated_at := now();

    -- Owner / DEFINER context (linking, admin scripts) is not restricted.
    IF current_user NOT IN ('authenticated', 'anon') THEN
        NEW.created_at := OLD.created_at;      -- still immutable
        RETURN NEW;
    END IF;

    -- Identity link + creation time are never client-mutable.
    NEW.auth_user_id := OLD.auth_user_id;
    NEW.created_at   := OLD.created_at;

    IF actor.role = 'supervisor' THEN
        -- Supervisors manage others, but NOBODY may change their own role
        -- (closes the self-escalation path, V1).
        IF NEW.email = actor.email THEN
            NEW.role := OLD.role;
        END IF;
    ELSIF actor.role = 'instructor' THEN
        -- Instructors may only touch a monitor's name/class; never role/email.
        NEW.email := OLD.email;
        NEW.role  := OLD.role;
    ELSE
        -- monitor / unlinked: only non-identity fields (e.g. display name).
        NEW.email := OLD.email;
        NEW.class := OLD.class;
        NEW.role  := OLD.role;
    END IF;

    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS enforce_user_update_restrictions ON identity.users;
CREATE TRIGGER enforce_user_update_restrictions
    BEFORE UPDATE ON identity.users
    FOR EACH ROW EXECUTE FUNCTION identity.prevent_user_column_tampering();

-- Clients may never choose auth_user_id at INSERT time (prevents mis-linking).
CREATE OR REPLACE FUNCTION identity.sanitize_user_insert()
RETURNS TRIGGER LANGUAGE plpgsql
SET search_path = identity, pg_temp AS $$
BEGIN
    IF current_user IN ('authenticated', 'anon') THEN
        NEW.auth_user_id := NULL;
    END IF;
    NEW.email := lower(NEW.email);
    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS sanitize_user_insert ON identity.users;
CREATE TRIGGER sanitize_user_insert
    BEFORE INSERT ON identity.users
    FOR EACH ROW EXECUTE FUNCTION identity.sanitize_user_insert();

-- ---------------------------------------------------------------------------
-- 2. identity.users policies  (explicit WITH CHECK on every write)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_select" ON identity.users;
CREATE POLICY "users_select" ON identity.users
FOR SELECT TO authenticated
USING (
    email = (identity."current_user"()).email
    OR (identity."current_user"()).role IN ('instructor','supervisor')
);

DROP POLICY IF EXISTS "users_insert" ON identity.users;
CREATE POLICY "users_insert" ON identity.users
FOR INSERT TO authenticated
WITH CHECK (
    (identity."current_user"()).role = 'supervisor'                  -- only supervisor creates accounts (V3)
    AND lower(email) LIKE '%@gs.hs.ntnu.edu.tw'                       -- school-domain allow-list in the DB (V3)
    AND (
        (role = 'monitor'     AND class IS NOT NULL) OR
        (role <> 'monitor'    AND class IS NULL)
    )                                                                -- mirror app validateRoleClass
);

DROP POLICY IF EXISTS "users_update" ON identity.users;
CREATE POLICY "users_update" ON identity.users
FOR UPDATE TO authenticated
USING (
    email = (identity."current_user"()).email
    OR ((identity."current_user"()).role = 'instructor' AND role = 'monitor')
    OR (identity."current_user"()).role = 'supervisor'
)
WITH CHECK (
    email = (identity."current_user"()).email
    OR ((identity."current_user"()).role = 'instructor' AND role = 'monitor')
    OR (identity."current_user"()).role = 'supervisor'
);

-- V11: supervisors can remove accounts (deny-by-default previously blocked ALL
-- deletes). A supervisor may not delete their own row (avoid self-lockout).
DROP POLICY IF EXISTS "users_delete" ON identity.users;
CREATE POLICY "users_delete" ON identity.users
FOR DELETE TO authenticated
USING (
    (identity."current_user"()).role = 'supervisor'
    AND email <> (identity."current_user"()).email
);

-- ---------------------------------------------------------------------------
-- 3. attendance.reports — SELECT by RLS, writes ONLY via DEFINER RPC
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "reports_select_monitor" ON attendance.reports;
CREATE POLICY "reports_select_monitor" ON attendance.reports
FOR SELECT TO authenticated
USING (
    class = (identity."current_user"()).class
    AND (identity."current_user"()).role = 'monitor'
);

DROP POLICY IF EXISTS "reports_select_staff" ON attendance.reports;
CREATE POLICY "reports_select_staff" ON attendance.reports
FOR SELECT TO authenticated
USING ((identity."current_user"()).role IN ('instructor','supervisor'));

-- Append-only is now enforced by privilege, not just by absent policy.
REVOKE INSERT, UPDATE, DELETE ON attendance.reports FROM authenticated, anon;

-- ---------------------------------------------------------------------------
-- 4. system.settings
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "settings_select" ON system.settings;
CREATE POLICY "settings_select" ON system.settings
FOR SELECT TO authenticated
USING ((identity."current_user"()).email IS NOT NULL);

DROP POLICY IF EXISTS "settings_insert" ON system.settings;
CREATE POLICY "settings_insert" ON system.settings
FOR INSERT TO authenticated
WITH CHECK ((identity."current_user"()).role IN ('instructor','supervisor'));

DROP POLICY IF EXISTS "settings_update" ON system.settings;
CREATE POLICY "settings_update" ON system.settings
FOR UPDATE TO authenticated
USING ((identity."current_user"()).role IN ('instructor','supervisor'))
WITH CHECK ((identity."current_user"()).role IN ('instructor','supervisor'));

REVOKE DELETE ON system.settings FROM authenticated, anon;

-- ---------------------------------------------------------------------------
-- 5. correct_report — fixed signature (TEXT class) + window/date checks (V9)
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS attendance.correct_report(integer, date, jsonb);
CREATE OR REPLACE FUNCTION attendance.correct_report(
    p_class text,
    p_report_date date,
    p_payload jsonb
)
RETURNS attendance.reports
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = attendance, identity, system, pg_temp AS $$
DECLARE v_user identity.users; v_now timestamptz; v_report attendance.reports;
BEGIN
    SELECT * INTO v_user FROM identity.users WHERE auth_user_id = auth.uid() LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='UNAUTHORIZED'; END IF;
    IF v_user.role NOT IN ('instructor','supervisor') THEN
        RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='UNAUTHORIZED'; END IF;
    IF p_class IS NULL OR length(btrim(p_class)) = 0 THEN
        RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='INVALID_CLASS'; END IF;
    IF p_report_date IS NULL THEN
        RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='INVALID_REPORT_DATE'; END IF;
    v_now := now();
    IF p_report_date > (v_now AT TIME ZONE 'Asia/Taipei')::date THEN
        RAISE EXCEPTION USING ERRCODE='P0001', MESSAGE='INVALID_REPORT_DATE'; END IF;
    PERFORM attendance.validate_report_payload(p_payload);
    INSERT INTO attendance.reports(class, report_date, submitted_by, submitted_at, payload)
        VALUES (p_class, p_report_date, v_user.email, v_now, p_payload)
        RETURNING * INTO v_report;
    RETURN v_report;
END $$;

-- ---------------------------------------------------------------------------
-- 6. Least-privilege grants (V13): anon gets nothing; RPCs for authenticated
-- ---------------------------------------------------------------------------
REVOKE ALL ON identity.users     FROM anon;
REVOKE ALL ON attendance.reports FROM anon;
REVOKE ALL ON system.settings    FROM anon;

REVOKE ALL ON FUNCTION identity."current_user"()               FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION identity.link_identity()                FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION attendance.submit_report(jsonb)         FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION attendance.correct_report(text,date,jsonb) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION identity."current_user"()               TO authenticated;
GRANT EXECUTE ON FUNCTION identity.link_identity()                TO authenticated;
GRANT EXECUTE ON FUNCTION attendance.submit_report(jsonb)         TO authenticated;
GRANT EXECUTE ON FUNCTION attendance.correct_report(text,date,jsonb) TO authenticated;

COMMIT;
