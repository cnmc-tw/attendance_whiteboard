// app/daily-report/components/ReportSection.tsx
import { getReportConfig, getLeastReportByClass } from "../actions";
import { ReportCard } from "./ReportForms";
import { AppTime } from "@/shared/time";

export async function ReportSection({ userClass }: { userClass: string }) {
    // 這裡進行慢速的資料庫 / API 查詢
    const [config, lastReport] = await Promise.all([
        getReportConfig(),
        getLeastReportByClass(userClass),
    ]);

    const report = lastReport.data ?? null;

    // 檢查回報時間邏輯
    const date = AppTime.date();
    const day = AppTime.day();
    const time = AppTime.time();

    if (!config.data) return <ErrorMessage message="系統尚未啟用" />;
    if (date < config.data.semester_start) return <ErrorMessage message="本學期尚未開始" />;
    if (date > config.data.semester_end) return <ErrorMessage message="本學期已結束" />;
    if (day === 0 || day === 6) return <ErrorMessage message="今日非回報日" />;
    if (time < config.data.report_start_time) return <ErrorMessage message="今日回報尚未開始" />;
    if (time > config.data.report_end_time) return <ErrorMessage message="今日回報時間已結束" />;

    return (
        <ReportCard
            cooldown_seconds={config.data.report_cooldown_seconds}
            report={report}
        />
    );
}

function ErrorMessage({ message }: { message: string }) {
    return (
        <h1 className="text-2xl text-center text-on-surface mb-space-sm tracking-tight font-bold">
            {message}
        </h1>
    );
}