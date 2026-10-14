import type { Role } from "../../../types";
import type { ColumnValidator } from "./base";

const ROLES: ReadonlySet<Role> = new Set([
    "monitor",
    "instructor",
    "supervisor",
]);

export const roleValidator: ColumnValidator<Role> = (value) => {
    const role = value.trim();

    if (!ROLES.has(role as Role)) {
        return {
            success: false,
            message: "角色無效",
        };
    }

    return {
        success: true,
        value: role as Role,
    };
};