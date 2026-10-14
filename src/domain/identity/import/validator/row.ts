import type { Role } from "../../types";
import type { ProfileImportRow } from "../types";

export interface RowValidationIssue {
    message: string;
}

export type RowValidator = (
    row: ProfileImportRow,
) => RowValidationIssue[];

interface RoleRule {
    requiresClass: boolean;
}

const ROLE_RULES: Record<Role, RoleRule> = {
    monitor: {
        requiresClass: true,
    },
    instructor: {
        requiresClass: false,
    },
    supervisor: {
        requiresClass: false,
    },
};

export const validateProfileRow: RowValidator = (row) => {
    const issues: RowValidationIssue[] = [];
    const rule = ROLE_RULES[row.role];

    if (rule.requiresClass && row.class === null) {
        issues.push({
            message: `${row.role} 必須指定班級`,
        });
    }

    if (!rule.requiresClass && row.class !== null) {
        issues.push({
            message: `${row.role} 不應指定班級`,
        });
    }

    return issues;
};