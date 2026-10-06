"use server";


import { createContainer } from '@/src/container';
import { requireUser } from '@/src/dal/auth';
import { ReportItem } from '@/src/domain/attendance';

import { AppTime } from '@/shared/time';


import { ReportSubmissionError, UnauthorizedError, ForbiddenError } from "@/src/application/errors";

export type ReportResponse =
    | {
        data: ReportItem[];
        error: null;
      }
    | {
        data: null;
        error: string;
      };

export async function getReportsByDate(
    date: Date = AppTime.now()
): Promise<ReportResponse> {
    try {
        await requireUser();
        const container = await createContainer();
        const data = await container.reportService.getReportsByDate(date);
        return {
            data,
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




export type SubmitReportState =
    | {
        success: true;
      }
    | {
        success: false;
        error?: string;
      };


export async function submitReport(
    payload: Record<string, number[]>
): Promise<SubmitReportState> {

    
    try {

        await requireUser();
        const container = await createContainer();

        await container.reportService.submitReport(payload);

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

        if (error instanceof ReportSubmissionError) {
            return {
                success: false,
                error: error.code,
            };
        }

        console.error(error);

        return {
            success: false,
            error: "INTERNAL_ERROR",
        };
    }
}