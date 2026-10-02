CREATE OR REPLACE FUNCTION identity.prevent_user_column_tampering()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
DECLARE
    app_role text := (identity.current_user()).role::text;
BEGIN
    NEW.updated_at := NOW();

    IF app_role NOT IN ('instructor', 'supervisor') THEN
        -- NEW.name := OLD.name; removed
        NEW.email := OLD.email;
        NEW.class := OLD.class;
        NEW.role := OLD.role;
        NEW.created_at := OLD.created_at;
    END IF;

    RETURN NEW;
END;
$function$;