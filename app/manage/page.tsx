import { Metrics, ClassTable, MetricsData } from "./components"

import { getClassNumberingConfig, getReportsByDate } from "../actions";

import { ReportItem } from "@/src/domain/attendance";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "本日回報 - 學務處學生出缺勤回報系統",
  description: "生活輔導組及全校班級每日出缺勤填報",
};

export default async function DashboardPage() {
    const [config, reports] = await Promise.all([
        getClassNumberingConfig(),
        getReportsByDate(new Date())
    ])

    if (!config.data || config.error) return;

    const data: MetricsData = {
        classcount: +config!.data.classesPerGrade * 3,
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

    if (!reports.data || reports.error) return;

    const reportsMap = new Map(reports.data.map((report) => [report.class, report]))
        
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


  return (
    <div className="flex flex-col gap-space-lg w-full">
      <div className="flex flex-col">
          <h1 className="font-display text-4xl text-primary tracking-tight font-bold">
            今日全校回報概況
          </h1>
        </div>

      {/* Metrics Grid */}
      <Metrics data={data} />

      {/* Class List Table */}
      <ClassTable reports={fullReport}/>

    
    </div>
  );
}
