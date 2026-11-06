import { Report, GetClassHistoryQuery, ClassHistoryResult } from "./types";

export interface ReportRepository {

    getLatestByDateAndClass(
        date: string,
        classNo: string
    ): Promise<Report | null>;

    getLatestReportsByDate(date: string): Promise<Report[]>;

    getClassHistory(
        query: GetClassHistoryQuery,
    ): Promise<ClassHistoryResult>

    submit(payload: Record<string, number[]>): Promise<void>;

    correct(
        classNo: string,
        reportDate: string,
        payload: Record<string, number[]>
    ): Promise<void>;

}