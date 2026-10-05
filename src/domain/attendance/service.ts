import { ReportRepository } from "./repository";
import { Report, GetClassHistoryQuery, ClassHistoryResult } from "./types";
import { ValidationError } from "@/src/application/errors";

export interface ReportItem {
    id: string;
    class: string;
    grade: number;


    sick: number;
    personal: number;
    official: number;
    other: number;

    absentCount: number;
    
    status: ReportState;
    report_date: string;
    submitted_by: string;
    submitted_at: string;
}

export type ReportState = "reported" | "pending";

export interface ReportService {

    getReportsByDate(date: Date): Promise<ReportItem[]>;

    getClassHistory(
        query: GetClassHistoryQuery,
    ): Promise<ClassHistoryResult>

    submitReport(payload: Record<string, number[]>): Promise<void>;

    correctReport(
        classNo: string,
        reportDate: string,
        payload: Record<string, number[]>
    ): Promise<void>;

}

class DefaultReportService
    implements ReportService {

    constructor(
        private readonly repository: ReportRepository
    ) {}

    async getReportsByDate(date: Date): Promise<ReportItem[]> {
        const reports = await this.repository.getByDate(
            date.toLocaleDateString("en-CA")
        );

        const reportMap = new Map<string, Report>();

        reports.forEach((report) => {
            const existingReport = reportMap.get(report.class);

            if (!existingReport) {
                reportMap.set(report.class, report);
                return;
            }

            if (existingReport.submitted_at < report.submitted_at) {
                reportMap.set(report.class, report);
            }
        });

        const latestReports = Array.from(reportMap.values());

        latestReports.sort((a, b) => +a.class - +b.class);

        return latestReports.map((report) => ({
            id: report.id,
            class: report.class,
            grade: 0,

            sick: report.payload.sick?.length ?? 0,
            personal: report.payload.personal?.length ?? 0,
            official: report.payload.official?.length ?? 0,
            other: report.payload.other?.length ?? 0,

            absentCount: Object.values(report.payload)
                .reduce((acc, arr) => acc + arr.length, 0),

            status: "reported",
            report_date: report.report_date,
            submitted_by: report.submitted_by,
            submitted_at: report.submitted_at,
        }));
    }

    async getClassHistory(
        query: GetClassHistoryQuery,
    ): Promise<ClassHistoryResult> {
        if (+query.classNo! <= 0) {
            throw new ValidationError("Invalid class number");
        }

        const limit = query.limit ?? 20;

        if (limit <= 0 || limit > 50) {
            throw new ValidationError("Invalid limit");
        }

        if (query.before) {
            const date = new Date(query.before);

            if (Number.isNaN(date.getTime())) {
                throw new ValidationError("Invalid cursor");
            }
        }

        return this.repository.getClassHistory({
            ...query,
            limit,
        });
    }

    async submitReport(payload: Record<string, number[]>): Promise<void> {
        return this.repository.submit(payload);
    }

    async correctReport(
        classNo: string,
        reportDate: string,
        payload: Record<string, number[]>
    ): Promise<void> {
        return this.repository.correct(classNo, reportDate, payload);
    }


}

export function createReportService(
    repository: ReportRepository
): ReportService {
    return new DefaultReportService(repository);
}