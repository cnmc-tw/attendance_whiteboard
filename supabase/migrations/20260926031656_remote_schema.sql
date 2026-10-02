SET local check_function_bodies = off;

CREATE SCHEMA "attendance";

CREATE SCHEMA "identity";

CREATE SCHEMA "system";

CREATE TABLE "attendance"."reports" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "class"        text                     NOT NULL,
  "report_date"  date                     NOT NULL,
  "submitted_by" text                     NOT NULL,
  "submitted_at" timestamp with time zone NOT NULL DEFAULT now(),
  "payload"      jsonb                    NOT NULL,
  CONSTRAINT "reports_pkey" PRIMARY KEY (id)
);

ALTER TABLE "attendance"."reports"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "identity"."users" (
  "email"        text                     NOT NULL,
  "auth_user_id" uuid,
  "name"         text                     NOT NULL,
  "class"        text,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "users_auth_user_id_key" UNIQUE (auth_user_id),
  CONSTRAINT "users_pkey" PRIMARY KEY (email)
);

ALTER TABLE "identity"."users"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "system"."settings" (
  "key"        text                     NOT NULL,
  "value"      text                     NOT NULL,
  "updated_by" text,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "settings_pkey" PRIMARY KEY (key)
);

ALTER TABLE "system"."settings"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "identity"."user_role" AS ENUM (
  'monitor',
  'instructor',
  'supervisor'
);

ALTER TABLE "identity"."users"
  ADD COLUMN "role" identity.user_role NOT NULL;

CREATE OR REPLACE FUNCTION attendance.correct_report (
  p_class       integer,
  p_report_date date,
  p_payload     jsonb
)
  RETURNS attendance.reports
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'attendance', 'identity', 'system', 'public'
  AS $function$
DECLARE
    v_user identity.users;

    v_now TIMESTAMPTZ;

    v_report attendance.reports;
BEGIN
    /*
     * ---------------------------------------------------------
     * 1. Resolve current application user
     * ---------------------------------------------------------
     */

    SELECT *
    INTO v_user
    FROM identity.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'UNAUTHORIZED';
    END IF;


    /*
     * ---------------------------------------------------------
     * 2. Only instructor / supervisor can correct reports
     * ---------------------------------------------------------
     */

    IF v_user.role NOT IN (
        'instructor',
        'supervisor'
    ) THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'UNAUTHORIZED';
    END IF;


    /*
     * ---------------------------------------------------------
     * 3. Validate target class
     * ---------------------------------------------------------
     */

    IF p_class IS NULL OR p_class <= 0 THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'INVALID_CLASS';
    END IF;


    /*
     * ---------------------------------------------------------
     * 4. Validate target date
     * ---------------------------------------------------------
     *
     * We do not allow creating a correction for a future date.
     */

    IF p_report_date IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'INVALID_REPORT_DATE';
    END IF;

    v_now := now();

    IF p_report_date > v_now::DATE THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'INVALID_REPORT_DATE';
    END IF;


    /*
     * ---------------------------------------------------------
     * 5. Validate payload
     * ---------------------------------------------------------
     */

    PERFORM attendance.validate_report_payload(
        p_payload
    );


    /*
     * ---------------------------------------------------------
     * 6. Insert correction as a new immutable snapshot
     * ---------------------------------------------------------
     *
     * No UPDATE.
     * No DELETE.
     *
     * The corrected state becomes the latest report for
     * this class/date.
     */

    INSERT INTO attendance.reports (
        class,
        report_date,
        submitted_by,
        submitted_at,
        payload
    )
    VALUES (
        p_class,
        p_report_date,
        v_user.email,
        v_now,
        p_payload
    )
    RETURNING *
    INTO v_report;


    /*
     * ---------------------------------------------------------
     * 7. Return inserted report
     * ---------------------------------------------------------
     */

    RETURN v_report;

END;
$function$;

CREATE OR REPLACE FUNCTION attendance.get_class_history (
  p_class  text,
  p_before date    DEFAULT NULL::date,
  p_limit  integer DEFAULT 20
)
  RETURNS SETOF attendance.reports
  LANGUAGE sql
  STABLE
  SET search_path TO 'attendance'
  AS $function$
    SELECT DISTINCT ON (r.report_date)
        r.*
    FROM attendance.reports AS r
    WHERE r.class = p_class
      AND r.report_date < COALESCE(
          p_before,
          (now() AT TIME ZONE 'Asia/Taipei')::date
      )
    ORDER BY
        r.report_date DESC,
        r.submitted_at DESC,
        r.id DESC
    LIMIT p_limit;
$function$;

CREATE OR REPLACE FUNCTION attendance.submit_report (
  p_payload jsonb
)
  RETURNS attendance.reports
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'attendance', 'identity', 'system', 'public'
  AS $function$
DECLARE
    v_user identity.users;

    v_now TIMESTAMPTZ;
    v_local_now TIMESTAMP;
    v_report_date DATE;

    v_start_time TIME;
    v_end_time TIME;
    v_cooldown_seconds INTEGER;
    v_semester_start_date DATE;
    v_semester_end_date DATE;

    v_latest_submitted_at TIMESTAMPTZ;

    v_key TEXT;
    v_value JSONB;
    v_student_number INTEGER;

    v_seen_students INTEGER[] := ARRAY[]::INTEGER[];

    v_report attendance.reports;
BEGIN
    /*
     * ---------------------------------------------------------
     * 2. Resolve current application user
     * ---------------------------------------------------------
     */

    SELECT *
    INTO v_user
    FROM identity.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'UNAUTHORIZED';
    END IF;


    /*
     * ---------------------------------------------------------
     * 3. Only monitor can submit daily reports
     * ---------------------------------------------------------
     */

    IF v_user.role <> 'monitor' THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'NOT_MONITOR';
    END IF;

    IF v_user.class IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'INVALID_MONITOR_CLASS';
    END IF;


    /*
     * ---------------------------------------------------------
     * 4. Resolve current DB time
     * ---------------------------------------------------------
     *
     * Use database time instead of client time.
     */

    v_now := now();
    v_local_now := v_now AT TIME ZONE 'Asia/Taipei';
    v_report_date := v_local_now::DATE;


    /*
     * ---------------------------------------------------------
     * 5. Load system settings
     * ---------------------------------------------------------
     */

    SELECT value::DATE
    INTO v_semester_start_date
    FROM system.settings
    WHERE key = 'semester_start_date';

    IF v_semester_start_date IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'SETTINGS_NOT_CONFIGURED';
    END IF;

    SELECT value::DATE
    INTO v_semester_end_date
    FROM system.settings
    WHERE key = 'semester_end_date';

    IF v_semester_end_date IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'SETTINGS_NOT_CONFIGURED';
    END IF;

    SELECT value::TIME
    INTO v_start_time
    FROM system.settings
    WHERE key = 'report_start_time';

    IF v_start_time IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'SETTINGS_NOT_CONFIGURED';
    END IF;


    SELECT value::TIME
    INTO v_end_time
    FROM system.settings
    WHERE key = 'report_end_time';

    IF v_end_time IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'SETTINGS_NOT_CONFIGURED';
    END IF;


    SELECT value::INTEGER
    INTO v_cooldown_seconds
    FROM system.settings
    WHERE key = 'report_cooldown_seconds';

    IF v_cooldown_seconds IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'SETTINGS_NOT_CONFIGURED';
    END IF;

    IF v_cooldown_seconds < 0 THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'SETTINGS_NOT_CONFIGURED';
    END IF;


    /*
     * ---------------------------------------------------------
     * 6. Check reporting window
     * ---------------------------------------------------------
     *
     * Current version assumes:
     *
     * start_date <= end_date,
     * start_time <= end_time
     *
     * and the reporting window does not cross midnight.
     */

    IF v_report_date < v_semester_start_date
    OR v_report_date > v_semester_end_date
    THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'REPORT_NOT_ALLOWED';
    END IF;

    IF EXTRACT(ISODOW FROM v_report_date) IN (6, 7) THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'REPORT_NOT_ALLOWED';
    END IF;

    IF v_local_now::TIME < v_start_time
    OR v_local_now::TIME > v_end_time
    THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'REPORT_NOT_ALLOWED';
    END IF;


    /*
     * ---------------------------------------------------------
     * 7. Lock this monitor's submission path
     * ---------------------------------------------------------
     *
     * Prevent concurrent requests from both passing the
     * cooldown check and inserting reports.
     *
     * Advisory lock key is based on the current user's
     * auth UUID.
     */

    PERFORM pg_advisory_xact_lock(
        hashtextextended(auth.uid()::TEXT, 0)
    );


    /*
     * ---------------------------------------------------------
     * 8. Check cooldown
     * ---------------------------------------------------------
     */

    SELECT submitted_at
    INTO v_latest_submitted_at
    FROM attendance.reports
    WHERE class = v_user.class
      AND report_date = v_report_date
    ORDER BY submitted_at DESC
    LIMIT 1;

    IF FOUND
       AND v_latest_submitted_at
            + make_interval(secs => v_cooldown_seconds)
            > v_now
    THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'REPORT_COOLDOWN';
    END IF;

    /*
     * ---------------------------------------------------------
     * 9. Validate payload
     * ---------------------------------------------------------
     */

    PERFORM attendance.validate_report_payload(
        p_payload
    );


    /*
     * ---------------------------------------------------------
     * 10. Insert immutable report snapshot
     * ---------------------------------------------------------
     */

    INSERT INTO attendance.reports (
        class,
        report_date,
        submitted_by,
        submitted_at,
        payload
    )
    VALUES (
        v_user.class,
        v_report_date,
        v_user.name,
        v_now,
        p_payload
    )
    RETURNING *
    INTO v_report;


    /*
     * ---------------------------------------------------------
     * 11. Return inserted report
     * ---------------------------------------------------------
     */

    RETURN v_report;

END;
$function$;

CREATE OR REPLACE FUNCTION attendance.validate_report_payload (
  p_payload jsonb
)
  RETURNS void
  LANGUAGE plpgsql
  IMMUTABLE
  AS $function$
DECLARE
    v_key TEXT;
    v_value JSONB;
    v_student JSONB;
    v_student_number INTEGER;

    v_seen_students INTEGER[] := ARRAY[]::INTEGER[];
BEGIN
    /*
     * ---------------------------------------------------------
     * 1. Payload itself
     * ---------------------------------------------------------
     */

    IF p_payload IS NULL THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'INVALID_PAYLOAD';
    END IF;

    IF jsonb_typeof(p_payload) <> 'object' THEN
        RAISE EXCEPTION USING
            ERRCODE = 'P0001',
            MESSAGE = 'INVALID_PAYLOAD';
    END IF;


    /*
     * ---------------------------------------------------------
     * 2. Validate leave types
     * ---------------------------------------------------------
     */

    FOR v_key IN
        SELECT key
        FROM jsonb_object_keys(p_payload) AS key
    LOOP
        IF v_key NOT IN (
            'sick',
            'personal',
            'official',
            'other'
        ) THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P0001',
                MESSAGE = 'INVALID_PAYLOAD',
                DETAIL = v_key;
        END IF;
    END LOOP;


    /*
     * ---------------------------------------------------------
     * 3. Validate each leave-type array
     * ---------------------------------------------------------
     */

    FOR v_key, v_value IN
        SELECT key, value
        FROM jsonb_each(p_payload)
    LOOP

        IF jsonb_typeof(v_value) <> 'array' THEN
            RAISE EXCEPTION USING
                ERRCODE = 'P0001',
                MESSAGE = 'INVALID_PAYLOAD';
        END IF;


        /*
         * Empty arrays are allowed.
         *
         * Example:
         * {
         *   "sick": []
         * }
         */

        FOR v_student IN
            SELECT value
            FROM jsonb_array_elements(v_value)
        LOOP

            /*
             * Student number must be a JSON number.
             */

            IF jsonb_typeof(v_student) <> 'number' THEN
                RAISE EXCEPTION USING
                    ERRCODE = 'P0001',
                    MESSAGE = 'INVALID_PAYLOAD';
            END IF;


            /*
             * JSON number must represent an integer.
             *
             * Reject:
             *   3.5
             *   1e2
             *
             * Accept:
             *   3
             *   100
             */

            IF v_student::TEXT !~ '^[0-9]+$' THEN
                RAISE EXCEPTION USING
                    ERRCODE = 'P0001',
                    MESSAGE = 'INVALID_PAYLOAD';
            END IF;


            v_student_number := v_student::INTEGER;


            /*
             * Student number must be positive.
             */

            IF v_student_number <= 0 THEN
                RAISE EXCEPTION USING
                    ERRCODE = 'P0001',
                    MESSAGE = 'INVALID_PAYLOAD';
            END IF;


            /*
             * A student can only appear once in the
             * entire report.
             */

            IF v_student_number = ANY(v_seen_students) THEN
                RAISE EXCEPTION USING
                    ERRCODE = 'P0001',
                    MESSAGE = 'INVALID_PAYLOAD',
                    DETAIL = v_student_number::TEXT;
            END IF;

            v_seen_students := array_append(
                v_seen_students,
                v_student_number
            );

        END LOOP;

    END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION identity."current_user"()
  RETURNS identity.users
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'identity'
  AS $function$
    SELECT *
    FROM identity.users
    -- 將比對條件改成目前 JWT 裡面登入者的 email
    WHERE email = (auth.jwt() ->> 'email')
    LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION identity.prevent_user_column_tampering()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
DECLARE
    app_role text := (identity.current_user()).role::text;
BEGIN
    NEW.updated_at := NOW();

    IF app_role NOT IN ('instructor', 'supervisor') THEN
        NEW.name := OLD.name;
        NEW.email := OLD.email;
        NEW.class := OLD.class;
        NEW.role := OLD.role;
        NEW.created_at := OLD.created_at;
    END IF;

    RETURN NEW;
END;
$function$;

DROP EVENT TRIGGER IF EXISTS "ensure_rls";

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION system.set_setting_metadata()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    NEW.updated_at := now();
    NEW.updated_by := (identity.current_user()).name;

    RETURN NEW;
END;
$function$;

ALTER TABLE "identity"."users"
  ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX reports_class_date_submitted_idx ON attendance.reports USING btree (class, report_date DESC, submitted_at DESC, id DESC);

CREATE INDEX reports_date_class_submitted_idx ON attendance.reports USING btree (report_date, class, submitted_at DESC);

CREATE INDEX reports_submitted_by_idx ON attendance.reports USING btree (submitted_by, submitted_at DESC);

CREATE INDEX users_role_idx ON identity.users USING btree (ROLE);

CREATE TRIGGER enforce_user_update_restrictions
  BEFORE UPDATE ON identity.users
  FOR EACH ROW
  EXECUTE FUNCTION identity.prevent_user_column_tampering();

CREATE TRIGGER set_setting_metadata
  BEFORE INSERT OR UPDATE ON system.settings
  FOR EACH ROW
  EXECUTE FUNCTION system.set_setting_metadata();

CREATE POLICY "reports_select_monitor" ON "attendance"."reports"
  FOR SELECT
  TO "authenticated"
  USING (((class = (identity."current_user"()).class) AND ((identity."current_user"()).role = 'monitor'::identity.user_role)));

CREATE POLICY "reports_select_staff" ON "attendance"."reports"
  FOR SELECT
  TO "authenticated"
  USING (((identity."current_user"()).role = ANY (ARRAY['instructor'::identity.user_role, 'supervisor'::identity.user_role])));

CREATE POLICY "users_insert" ON "identity"."users"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((identity."current_user"()).role = ANY (ARRAY['instructor'::identity.user_role, 'supervisor'::identity.user_role])));

CREATE POLICY "users_select" ON "identity"."users"
  FOR SELECT
  TO "authenticated"
  USING (((email = (identity."current_user"()).email) OR ((identity."current_user"()).role = ANY (ARRAY['instructor'::identity.user_role, 'supervisor'::identity.user_role]))));

CREATE POLICY "users_update" ON "identity"."users"
  FOR UPDATE
  TO "authenticated"
  USING
    (((email = (identity."current_user"()).email) OR (((identity."current_user"()).role = 'instructor'::identity.user_role) AND (ROLE = 'monitor'::identity.user_role)) OR
    ((identity."current_user"()).role = 'supervisor'::identity.user_role)));

CREATE POLICY "settings_insert" ON "system"."settings"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((identity."current_user"()).role = ANY (ARRAY['instructor'::identity.user_role, 'supervisor'::identity.user_role])));

CREATE POLICY "settings_select" ON "system"."settings"
  FOR SELECT
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM identity.users
  WHERE (users.auth_user_id = auth.uid()))));

CREATE POLICY "settings_update" ON "system"."settings"
  FOR UPDATE
  TO "authenticated"
  USING (((identity."current_user"()).role = ANY (ARRAY['instructor'::identity.user_role, 'supervisor'::identity.user_role])));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

REVOKE ALL ON FUNCTION "attendance"."correct_report"(integer, date, jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "attendance"."correct_report"(integer, date, jsonb) TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "attendance"."get_class_history"(text, date, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "attendance"."get_class_history"(text, date, integer) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "attendance"."submit_report"(jsonb) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "attendance"."submit_report"(jsonb) TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "attendance"."validate_report_payload"(jsonb) TO "postgres";

REVOKE ALL ON FUNCTION "identity"."current_user"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "identity"."current_user"() TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "identity"."prevent_user_column_tampering"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "system"."set_setting_metadata"() TO "postgres";

GRANT USAGE ON SCHEMA "attendance" TO "authenticated";

GRANT CREATE, USAGE ON SCHEMA "attendance" TO "postgres";

GRANT USAGE ON SCHEMA "attendance" TO "service_role";

GRANT USAGE ON SCHEMA "identity" TO "authenticated";

GRANT CREATE, USAGE ON SCHEMA "identity" TO "postgres";

GRANT USAGE ON SCHEMA "system" TO "authenticated";

GRANT CREATE, USAGE ON SCHEMA "system" TO "postgres";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "attendance"."reports" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "attendance"."reports" TO "postgres";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "attendance"."reports" TO "service_role";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "identity"."users" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "identity"."users" TO "postgres";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "identity"."users" TO "service_role";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "system"."settings" TO "anon", "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "system"."settings" TO "postgres";

GRANT DELETE, INSERT, SELECT, UPDATE ON TABLE "system"."settings" TO "service_role";

GRANT USAGE ON TYPE "identity"."user_role" TO "postgres";

