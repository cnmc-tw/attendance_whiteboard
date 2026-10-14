import type { ColumnValidator } from "./base";

export const nameValidator: ColumnValidator<string | null> = (value) => {
    const name = value.trim();

    if (!name) {
        return {
            success: true,
            value: null,
        };
    }

    return {
        success: true,
        value: name,
    };
};