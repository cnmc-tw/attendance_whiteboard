import Papa from "papaparse";

import type {
    ProfileImportError,
    ProfileImportResult,
    ProfileImportRow,
    RawProfileImportRow,
} from "./types";

import {
    emailValidator,
    classValidator,
    nameValidator,
    roleValidator,
} from "./validator/column";
import { validateProfileRow } from "./validator/row";
import { validateProfileRows } from "./validator/dataset";

export function parseProfileRow(
    raw: RawProfileImportRow,
    errors: ProfileImportError[],
): ProfileImportRow | null {
    const email = emailValidator(raw.email, {
        row: raw.row,
    });

    const role = roleValidator(raw.role, {
        row: raw.row,
    });

    const classValue = classValidator(raw.class, {
        row: raw.row,
    });

    const name = nameValidator(raw.name, {
        row: raw.row,
    });

    const results = [
        ["email", email],
        ["role", role],
        ["class", classValue],
        ["name", name],
    ] as const;

    let hasError = false;

    for (const [column, result] of results) {
        if (!result.success) {
            hasError = true;

            errors.push({
                row: raw.row,
                column,
                message: result.message,
            });
        }
    }

    if (hasError) {
        return null;
    }

    if (
        !email.success ||
        !role.success ||
        !classValue.success ||
        !name.success
    ) {
        return null;
    }

    return {
        row: raw.row,
        email: email.value,
        role: role.value,
        class: classValue.value,
        name: name.value,
    };
}

const REQUIRED_HEADERS = ["email", "class", "role", "name"] as const;

/** Parse one complete CSV document, retaining one-based source line numbers. */
export function parseProfileCsv(csv: string): ProfileImportResult {
    const errors: ProfileImportError[] = [];
    const warnings: ProfileImportResult["warnings"] = [];
    if (!csv.trim()) {
        return { rows: [], warnings, errors: [{ row: 1, message: "CSV 檔案沒有內容" }] };
    }

    const parsed = Papa.parse<string[]>(csv, {
        header: false,
        skipEmptyLines: false,
        dynamicTyping: false,
    });
    for (const issue of parsed.errors) {
        errors.push({ row: Math.max(1, (issue.row ?? 0) + 1), message: "CSV 格式錯誤，請檢查引號與欄位分隔符號" });
    }

    const headerIndex = parsed.data.findIndex((record) => record.some((value) => value.trim() !== ""));
    const rawHeader = parsed.data[headerIndex];
    if (!rawHeader) {
        errors.push({ row: 1, message: "CSV 檔案沒有標題列" });
        return { rows: [], warnings, errors };
    }
    const headers = rawHeader.map((value, index) =>
        (index === 0 ? value.replace(/^\uFEFF/, "") : value).trim().toLowerCase(),
    );
    const indexes = new Map<string, number>();
    let duplicateHeader = false;
    headers.forEach((header, index) => {
        if (header && indexes.has(header)) duplicateHeader = true;
        else if (header) indexes.set(header, index);
    });

    if (duplicateHeader) {
        errors.push({ row: headerIndex + 1, message: "標題列包含重複欄位" });
        return { rows: [], warnings, errors };
    }

    const missing = REQUIRED_HEADERS.filter((header) => !indexes.has(header));
    if (missing.length) {
        errors.push({ row: headerIndex + 1, message: `缺少必要欄位：${missing.join(", ")}` });
        return { rows: [], warnings, errors };
    }
    const records = parsed.data
        .map((record, index) => ({ record, index }))
        .slice(headerIndex + 1)
        .filter(({ record }) => record.some((value) => value.trim() !== ""));
    if (!records.length) {
        errors.push({ row: headerIndex + 1, message: "CSV 沒有資料列" });
        return { rows: [], warnings, errors };
    }

    const rows: ProfileImportRow[] = [];
    records.forEach(({ record, index }) => {
        const rowNumber = index + 1;
        if (record.length !== headers.length) {
            errors.push({ row: rowNumber, message: "欄位數量與標題列不一致" });
            return;
        }
        const raw: RawProfileImportRow = {
            row: rowNumber,
            email: record[indexes.get("email")!] ?? "",
            class: record[indexes.get("class")!] ?? "",
            role: record[indexes.get("role")!] ?? "",
            name: record[indexes.get("name")!] ?? "",
        };
        const result = parseProfileRow(raw, errors);
        if (result) rows.push(result);
    });

    for (const row of rows) {
        for (const issue of validateProfileRow(row)) {
            errors.push({ row: row.row, message: issue.message });
        }
    }
    for (const issue of validateProfileRows(rows)) {
        errors.push({ row: issue.row, message: issue.message });
    }
    return { rows, warnings, errors };
}
