export type ActionResult<T> =
    | {
        success: true;
        data: T;
    }
    | {
        success: false;
        error: ActionError;
    };

export type ActionError =
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "VALIDATION_ERROR"
    | "CONFLICT"
    | "NOT_FOUND";