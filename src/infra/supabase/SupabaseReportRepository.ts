import { SupabaseClient } from "@supabase/supabase-js";

import {
    ReportRepository,
    Report,
    GetClassHistoryQuery,
    ClassHistoryResult
} from "../../domain/attendance";

import { ReportSubmissionError, ReportSubmissionErrorCode } from "@/src/errors";

export class SupabaseReportRepository 
    implements ReportRepository {

    constructor(
        protected readonly client: SupabaseClient,
    ) {}

    private from() {
        return this.client
            .schema("attendance")
            .from("reports");
    }

    private isReportSubmissionErrorCode(
        value: string
    ): value is ReportSubmissionErrorCode {
        return [
            "UNAUTHORIZED",
            "NOT_MONITOR",
            "INVALID_MONITOR_CLASS",
            "REPORT_NOT_ALLOWED",
            "REPORT_COOLDOWN",
            "SETTINGS_NOT_CONFIGURED",
            "INVALID_PAYLOAD",
        ].includes(value as ReportSubmissionErrorCode);
    }

    async getByDateAndClass(
        date: string,
        classNo: string
    ): Promise<Report[]> {

        const { data, error } = await this.from()
            .select("*")
            .eq("report_date", date)
            .eq("class", classNo);

        if (error) {
            throw error;
        }

        if (!data) {
            return [];
        }

        return data as Report[];
    }

    async getByDate(date: string): Promise<Report[]> {
        const { data, error } = await this.from()
            .select("*")
            .eq("report_date", date);

        if (error) {
            throw error;
        }

        if (!data) {
            return [];
        }

        return data as Report[];
    }


    async getClassHistory(
        query: GetClassHistoryQuery,
    ): Promise<ClassHistoryResult> {
        const limit = query.limit ?? 20;

        const { data, error } = await this.client
            .schema("attendance")
            .rpc("get_class_history", {
                p_class: query.classNo,
                p_before: query.before ?? null,
                p_limit: limit + 1,
            });

        if (error) {
            throw error;
        }

        const rows = data ?? [];

        const hasMore = rows.length > limit;
        const items = rows.slice(0, limit);

        return {
            items,
            nextCursor: hasMore
                ? items.at(-1)?.report_date ?? null
                : null,
            hasMore,
        };
    }

    async submit(payload: Record<string, number[]>): Promise<void> {
        const { error } = await this.client
            .schema("attendance")
            .rpc("submit_report", {
                p_payload: payload,
            });

        if (!error) {
            return;
        }

        if (
            error.code === "P0001" &&
            this.isReportSubmissionErrorCode(error.message)
        ) {
            console.log("Report submission error:", error.message);
            throw new ReportSubmissionError(error.message);
        }

        throw error;
    }

    async correct(
        classNo: string,
        reportDate: string,
        payload: Record<string, number[]>
    ): Promise<void> {
        const { error } = await this.client
            .schema("attendance")
            .rpc("correct_report", {
                class: classNo,
                report_date: reportDate,
                payload: payload,
            });

        if (error) {
            throw error;
        }
    }

}