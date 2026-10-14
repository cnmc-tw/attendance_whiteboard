"use server";

import { createContainer } from "@/src/container";
import { requireSupervisor } from "@/src/dal/auth";
import { executeAction } from "@/src/application/actions/execute-action";
import type { ActionResult } from "@/src/application/actions/action-result";
import type { CreateProfileInput, UpdateProfileInput } from "@/src/domain/identity";
import type { Profile } from "@/src/domain/identity";
import { parseProfileCsv } from "@/src/domain/identity/import";
import type { ProfileImportResult, ProfileImportRow, ProfileUpdate } from "@/src/domain/identity/import";
import { MonitorImportError, UnauthorizedError, ForbiddenError } from "@/src/application/errors";
import type { MonitorImportErrorCode } from "@/src/application/errors";

export async function createUser(input: CreateProfileInput): Promise<ActionResult<void>> {
    return executeAction(async () => {
        await requireSupervisor();
        const container = await createContainer();
        return container.profileService.create(input);
    });
}

export async function updateUser(email: string, input: UpdateProfileInput): Promise<ActionResult<void>> {
    return executeAction(async () => {
        await requireSupervisor();
        const container = await createContainer();
        return container.profileService.update(email, input);
    });
}

export async function deleteUser(email: string): Promise<ActionResult<void>> {
    return executeAction(async () => {
        await requireSupervisor();
        const container = await createContainer();
        return container.profileService.delete(email);
    });
}

export type MonitorImportActionResult =
    | { success: true }
    | { success: false; error: MonitorImportErrorCode };

export interface MonitorImportPreview {
    importResult: ProfileImportResult;
    diff: MonitorImportPreviewDiff | null;
}

type MonitorPreviewProfile = Pick<Profile, "email" | "name" | "role" | "class">;
interface MonitorImportPreviewDiff {
    create: ProfileImportRow[];
    update: { current: MonitorPreviewProfile; incoming: ProfileUpdate["incoming"] }[];
    unchanged: MonitorPreviewProfile[];
    remove: MonitorPreviewProfile[];
}

function toPreviewProfile(profile: Profile): MonitorPreviewProfile {
    return { email: profile.email, name: profile.name, role: profile.role, class: profile.class };
}

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

async function parseMonitorUpload(formData: FormData): Promise<ProfileImportResult> {
    const upload = formData.get("file");
    if (!(upload instanceof File)) {
        return { rows: [], warnings: [], errors: [{ row: 1, message: "請選擇 CSV 檔案" }] };
    }
    if (!upload.size || upload.size > MAX_IMPORT_BYTES || !upload.name.toLowerCase().endsWith(".csv")) {
        return { rows: [], warnings: [], errors: [{ row: 1, message: "檔案必須是 5MB 以下且非空的 CSV" }] };
    }

    let result: ProfileImportResult;
    try {
        result = parseProfileCsv(await upload.text());
    } catch {
        return { rows: [], warnings: [], errors: [{ row: 1, message: "無法讀取 CSV 檔案" }] };
    }

    return result;
}

export async function previewMonitorImport(formData: FormData): Promise<MonitorImportPreview> {
    await requireSupervisor();
    const importResult = await parseMonitorUpload(formData);
    if (importResult.errors.length > 0 || importResult.rows.length === 0) {
        return { importResult, diff: null };
    }

    const container = await createContainer();
    const current = await container.profileService.getUsersByRole("monitor");
    const diff = container.diffProfiles(importResult.rows, current);
    return {
        importResult,
        diff: {
            create: diff.create,
            update: diff.update.map(({ current: profile, incoming }) => ({ current: toPreviewProfile(profile), incoming })),
            unchanged: diff.unchanged.map(toPreviewProfile),
            remove: diff.remove.map(toPreviewProfile),
        },
    };
}

export async function synchronizeMonitorImport(formData: FormData): Promise<MonitorImportActionResult> {
    try {
        await requireSupervisor();
        const importResult = await parseMonitorUpload(formData);
        if (importResult.errors.length > 0 || importResult.rows.length === 0) {
            return { success: false, error: "INVALID_PROFILE_SYNC_INPUT" };
        }

        const container = await createContainer();
        const current = await container.profileService.getUsersByRole("monitor");
        const diff = container.diffProfiles(importResult.rows, current);
        await container.profileSynchronizer.synchronize(diff);
        return { success: true };
    } catch (error) {
        if (error instanceof UnauthorizedError) return { success: false, error: "UNAUTHORIZED" };
        if (error instanceof ForbiddenError) return { success: false, error: "FORBIDDEN" };
        if (error instanceof MonitorImportError) return { success: false, error: error.code };
        console.error("Monitor import synchronization failed", error);
        return { success: false, error: "INTERNAL_ERROR" };
    }
}
