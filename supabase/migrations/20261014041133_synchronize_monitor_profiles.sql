CREATE OR REPLACE FUNCTION identity.synchronize_monitor_profiles(
    p_input JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, identity, auth
AS $$
DECLARE
    v_actor identity.users;
    v_item JSONB;
BEGIN
    /*
     * 1. Validate payload structure.
     */
    IF p_input IS NULL
       OR jsonb_typeof(p_input) IS DISTINCT FROM 'object'
       OR jsonb_typeof(p_input -> 'create') IS DISTINCT FROM 'array'
       OR jsonb_typeof(p_input -> 'update') IS DISTINCT FROM 'array'
       OR jsonb_typeof(p_input -> 'remove') IS DISTINCT FROM 'array'
    THEN
        RAISE EXCEPTION USING
            ERRCODE = '22023',
            MESSAGE = 'INVALID_PROFILE_SYNC_INPUT';
    END IF;


    /*
     * 2. Resolve the caller through the authenticated identity.
     */
    SELECT u.*
    INTO v_actor
    FROM identity.users AS u
    WHERE u.auth_user_id = auth.uid()
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING
            ERRCODE = '42501',
            MESSAGE = 'UNAUTHORIZED';
    END IF;

    IF v_actor.role NOT IN ('instructor', 'supervisor') THEN
        RAISE EXCEPTION USING
            ERRCODE = '42501',
            MESSAGE = 'INSUFFICIENT_ROLE';
    END IF;


    /*
     * 3. Validate monitor rows before writing.
     *
     * Non-monitor rows are intentionally ignored.
     * Invalid monitor rows reject the entire transaction.
     */
    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_input -> 'create')
    LOOP
        IF v_item ->> 'role' = 'monitor' THEN
            IF COALESCE(
                   v_item ->> 'email' ~*
                       '^[^@]+@gs\.hs\.ntnu\.edu\.tw$',
                   FALSE
               ) IS NOT TRUE
               OR NULLIF(BTRIM(v_item ->> 'class'), '') IS NULL
            THEN
                RAISE EXCEPTION USING
                    ERRCODE = '22023',
                    MESSAGE = 'INVALID_MONITOR_PROFILE';
            END IF;
        END IF;
    END LOOP;

    FOR v_item IN
        SELECT value
        FROM jsonb_array_elements(p_input -> 'update')
    LOOP
        IF v_item #>> '{profile,role}' = 'monitor' THEN
            IF COALESCE(
                   v_item ->> 'email' ~*
                       '^[^@]+@gs\.hs\.ntnu\.edu\.tw$',
                   FALSE
               ) IS NOT TRUE
            THEN
                RAISE EXCEPTION USING
                    ERRCODE = '22023',
                    MESSAGE = 'INVALID_MONITOR_PROFILE';
            END IF;
        END IF;
    END LOOP;


    /*
     * 4. Create monitor profiles only.
     */
    INSERT INTO identity.users (
        email,
        name,
        role,
        class
    )
    SELECT
        BTRIM(item.email),
        COALESCE(item.name, ''),
        'monitor',
        item.class
    FROM jsonb_to_recordset(p_input -> 'create') AS item(
        email TEXT,
        name TEXT,
        role TEXT,
        class TEXT
    )
    WHERE item.role = 'monitor';


    /*
     * 5. Update existing monitor profiles only.
     *
     * A null name/class preserves the existing value.
     * An empty name is valid and is not converted to NULL.
     */
    UPDATE identity.users AS u
    SET
        name = COALESCE(
            item.profile ->> 'name',
            u.name
        ),
        class = COALESCE(
            item.profile ->> 'class',
            u.class
        )
    FROM (
        SELECT
            value ->> 'email' AS email,
            value -> 'profile' AS profile
        FROM jsonb_array_elements(p_input -> 'update')
    ) AS item
    WHERE u.email = item.email
      AND u.role = 'monitor'
      AND item.profile ->> 'role' = 'monitor';


    /*
     * 6. Remove monitor profiles only.
     */
    DELETE FROM identity.users AS u
    USING (
        SELECT BTRIM(value) AS email
        FROM jsonb_array_elements_text(p_input -> 'remove')
    ) AS item
    WHERE u.email = item.email
      AND u.role = 'monitor';

END;
$$;


/*
 * 7. Restrict function execution.
 */
REVOKE ALL
ON FUNCTION identity.synchronize_monitor_profiles(JSONB)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION identity.synchronize_monitor_profiles(JSONB)
FROM anon;

GRANT EXECUTE
ON FUNCTION identity.synchronize_monitor_profiles(JSONB)
TO authenticated;