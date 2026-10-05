import {
    UnauthorizedError,
    ForbiddenError,
    ValidationError,
    ConflictError,
    NotFoundError,
} from "@/src/application/errors";

import type { ActionResult } from "./action-result";

export async function executeAction<T>(
    action: () => Promise<T>,
): Promise<ActionResult<T>> {
    try {
        const data = await action();

        return {
            success: true,
            data,
        };
        
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return {
                success: false,
                error: "UNAUTHORIZED",
            };
        }

        if (error instanceof ForbiddenError) {
            return {
                success: false,
                error: "FORBIDDEN",
            };
        }

        if (error instanceof ValidationError) {
            return {
                success: false,
                error: "VALIDATION_ERROR",
            };
        }

        if (error instanceof ConflictError) {
            return {
                success: false,
                error: "CONFLICT",
            };
        }

        if (error instanceof NotFoundError) {
            return {
                success: false,
                error: "NOT_FOUND",
            };
        }

        throw error;
    }
}