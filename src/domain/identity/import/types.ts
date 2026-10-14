import type { Profile, Role } from "../types";

export interface RawProfileImportRow {
    row: number;
    email: string;
    class: string;
    role: string;
    name: string;
}

export interface ProfileImportRow {
    row: number;
    email: string;
    class: string | null;
    role: Role;
    name: string | null;
}

export interface ProfileImportWarning {
    row: number;
    column?: string;
    message: string;
}

export interface ProfileImportError {
    row: number;
    column?: string;
    message: string;
}

export interface ProfileImportResult {
    rows: ProfileImportRow[];
    warnings: ProfileImportWarning[];
    errors: ProfileImportError[];
}

export interface ProfileUpdate {
    current: Profile;
    incoming: ProfileImportRow;
}

export interface ProfileDiff {
    create: ProfileImportRow[];
    update: ProfileUpdate[];
    unchanged: Profile[];
    remove: Profile[];
}