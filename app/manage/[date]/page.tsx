import { Metrics, ClassTable, MetricsData } from "../components"

import { notFound } from "next/navigation";

import { getClassNumberingConfig, getReportsByDate } from "../../actions";

import { ReportItem } from "@/src/domain/attendance";

import type { Metadata } from "next";

type Props = {
  params: Promise<{ date: string }>;
};

// 使用 generateMetadata 動態生成 Metadata
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  // 1. 等待解構 params
  const { date } = await params;

  // 2. 解碼網址參數（如果 name 包含中文或特殊字元）
  const decodedName = decodeURIComponent(date);

  // 3. 回傳動態設定的 metadata
  return {
    title: `${decodedName} - 管理後臺 - 學務處學生出缺勤回報系統`,
    description: `生活輔導組及全校班級每日出缺勤填報 - ${decodedName}`,
  };
}


export default async function DashboardPage({ params }: Props) {
    const { date } = await params

    const today = new Date(date)

    if (isNaN(today.getTime())) return notFound();

    const [config, reports] = await Promise.all([
        getClassNumberingConfig(),
        getReportsByDate(new Date(date))
    ])

    if (!config.data) return;

    const data: MetricsData = {
        classcount: +config.data.classesPerGrade * 3,
        reportedClass: 0,

        notReportedGrade1: [],
        notReportedGrade2: [],
        notReportedGrade3: [],

        sick: 0,
        personal: 0,
        official: 0,
        other: 0,
        all: 0
    }

    const reportsMap = new Map(reports.data!.map((report) => [report.class, report]))
        
    const yearBaseClass =
        +config.data.baseClass +
        (new Date().getFullYear() - 
        +config.data.baseYear - 1) * 
        +config.data.classesPerGrade;

    function getGrade(
        classNo: number,
    ) {

        const offset =
            classNo - +yearBaseClass;

        if (
            offset < 0 ||
            offset >= data.classcount
        ) {
            return 0;
        }

        return 3 - Math.floor(offset / +config.data!.classesPerGrade);
    }

    const allClass =  Array.from({ length: 3 * +config.data.classesPerGrade }, (_, i) => {
        return String(yearBaseClass + i)
    });

    const fullReport: ReportItem[] = allClass.map((classNo) => {
        const report = reportsMap.get(classNo)
        const grade = getGrade(+classNo)

        if (report) {
            data.sick += report.sick;
            data.personal += report.personal;
            data.official += report.official;
            data.other += report.other
            data.all += report.absentCount;
            data.reportedClass += 1;

            return {
                ...report,
                grade
            }
        }

        switch (grade) {
            case 1:
                data.notReportedGrade1.push(+classNo);
                break;
            case 2:
                data.notReportedGrade2.push(+classNo);
                break;
            case 3:
                data.notReportedGrade3.push(+classNo);

        }

        return {
            id: "",
            class: classNo,
            grade,

            sick: 0,
            personal: 0,
            official: 0,
            other: 0,

            absentCount: -1,

            status: "pending",
            report_date: "Not available",
            submitted_by: "Not available",
            submitted_at: "Not available"

        }
    })

    function getFormattedDate(date: Date): string {
        const days = ['日', '一', '二', '三', '四', '五', '六'] as const;
        
        const year = date.getFullYear() - 1911;
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayName = days[date.getDay()];

        return `${year}年${month}月${day}日 (${dayName})`;
    }

  return (
    <div className="flex flex-col gap-space-lg w-full">
      <div className="flex flex-col">
          <h1 className="font-display text-4xl text-primary tracking-tight font-bold">
            {getFormattedDate(today)} 全校回報概況
          </h1>
        </div>

      {/* Metrics Grid */}
      <Metrics data={data} />

      {/* Class List Table */}
      <ClassTable reports={fullReport} />

    
    </div>
  );
}
