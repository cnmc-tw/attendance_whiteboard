import type { ProfileImportRow } from "../types";

export interface DatasetValidationIssue {
    row: number;
    message: string;
}

export function validateProfileRows(
    rows: ProfileImportRow[],
): DatasetValidationIssue[] {
    const issues: DatasetValidationIssue[] = [];
    const seenEmails = new Map<string, number>();

    for (const row of rows) {
        const previousRow = seenEmails.get(row.email);

        if (previousRow !== undefined) {
            issues.push({
                row: row.row,
                message: `Email 與第 ${previousRow} 列重複`,
            });

            continue;
        }

        seenEmails.set(row.email, row.row);
    }

    return issues;
}