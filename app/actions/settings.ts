"use server";


import { createContainer } from '@/src/container';

import { SystemConfig, ReportConfig, ClassNumberingConfig } from '@/src/domain/system/';
import { UnauthorizedError, ForbiddenError } from "@/src/errors";
import { requireSupervisor, requireUser } from "@/src/dal/auth";


export type ConfigResponse<T> =
    | {
        data: T;
        error: null;
      }
    | {
        data: null;
        error: string;
      };

export async function getReportConfig(): Promise<ConfigResponse<ReportConfig>> {
    try {
        await requireUser();

        const container = await createContainer();

        const config = await container.settingsService.getReportConfig();

        if (!config) {
            return {
                data: null,
                error: "CONFIG_NOT_FOUND",
            };
        }

        return {
            data: config,
            error: null,
        };
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return {
                data: null,
                error: "UNAUTHORIZED",
            };
        }

        if (error instanceof ForbiddenError) {
            return {
                data: null,
                error: "FORBIDDEN",
            };
        }

        throw error;
    }
}


export async function getClassNumberingConfig(): Promise<ConfigResponse<ClassNumberingConfig>> {
    try {
        await requireUser();

        const container = await createContainer();

        const config = await container.settingsService.getClassNumberingConfig();

        if (!config) {
            return {
                data: null,
                error: "CONFIG_NOT_FOUND",
            };
        }

        return {
            data: config,
            error: null,
        };
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return {
                data: null,
                error: "UNAUTHORIZED",
            };
        }

        if (error instanceof ForbiddenError) {
            return {
                data: null,
                error: "FORBIDDEN",
            };
        }

        throw error;
    }
}

export async function getSettings() {
    const container = await createContainer();
    return container.settingsService.getSettings();
}

export type UpdateSettingsState =
    | {
        success: true;
      }
    | {
        success: false;
        error?: string;
      };

export async function setSettings(setting: SystemConfig ): Promise<UpdateSettingsState> {
    
    try {
        await requireSupervisor();
        const container = await createContainer();
        container.settingsService.setSettings(setting);

        return {
            success: true,
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

        throw error;
    }
}