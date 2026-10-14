import type {
    ProfileImportError,
    ProfileImportResult,
    ProfileImportRow,
    ProfileImportWarning,
    RawProfileImportRow,
} from "../types";

import { parseProfileRow } from "../parser";
import { validateProfileRow } from "./row";
import { validateProfileRows } from "./dataset";

export function validateProfileImport(
    rawRows: RawProfileImportRow[],
): ProfileImportResult {
    const errors: ProfileImportError[] = [];
    const warnings: ProfileImportWarning[] = [];
    const rows: ProfileImportRow[] = [];

    for (const rawRow of rawRows) {
        const result = parseProfileRow(rawRow, errors);

        if (result !== null) {
            rows.push(result);
        }
    }

    for (const row of rows) {
        const issues = validateProfileRow(row);

        for (const issue of issues) {
            errors.push({
                row: row.row,
                message: issue.message,
            });
        }
    }

    const datasetIssues = validateProfileRows(rows);

    for (const issue of datasetIssues) {
        errors.push({
            row: issue.row,
            message: issue.message,
        });
    }

    return {
        rows,
        warnings,
        errors,
    };
}