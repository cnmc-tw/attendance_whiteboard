'use client'

import { useState } from "react";


import { useRouter } from 'next/navigation';


import { ReportItem } from "@/src/domain/attendance"


interface ClassTableProps {
  reports: ReportItem[];
}

interface YearOption {
    key: string
    value: string
}



export function ClassTable({
    reports
} : ClassTableProps) {

    const router = useRouter()


    const yearOptions: YearOption[] = [
        { value: "全部", key: "all"},
        { value: "高一", key: "1"},
        { value: "高二", key: "2"},
        { value: "高三", key: "3"},
    ]
    const [selectedGrade, setSelectedGrade] = useState<string>("全部");

    

    

    const filteredClasses = reports.filter((report) => {
        if (selectedGrade === "全部") return true;
        return report.grade === parseInt(yearOptions.find((o) => o.value === selectedGrade)?.key!);
    });

    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="px-space-lg py-space-md bg-surface-container-low border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">
                        table_chart
                    </span>
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">
                        班級回報狀態一覽
                    </h2>
                </div>
                {/* Grade Filter Segmented Control */}
                <div className="flex p-1 rounded-xl w-full md:w-auto justify-between overflow-x-auto bg-surface-container-high self-start md:self-auto shadow-sm">
                    {yearOptions.map((option) => (
                        <button
                            key={option.key}
                            onClick={() => setSelectedGrade(option.value)}
                            className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all ${
                                selectedGrade === option.value
                                ? "bg-surface-container-lowest text-primary font-semibold shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface font-medium"
                            }`}
                            type="button"
                        >
                            {option.value}
                        </button>
                    ))}
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                    顯示 {filteredClasses.length} 個班級
                </span>
            </div>



            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase border-b border-outline-variant">
                        <th className="py-3 px-space-lg">班級名稱</th>
                        <th className="py-3 px-space-md">回報狀態</th>
                        <th className="py-3 px-space-md">缺席人數</th>
                        <th className="py-3 px-space-md">送出時間 / 人員</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/40 font-body-md text-body-md">
                    {filteredClasses.map((report) => (
                        <tr
                            key={report.class}
                            onClick={() => router.push(`/manage/class/${report.class}`)}
                            className="hover:bg-surface-container/50 transition-colors hover:cursor-pointer"
                        >
                        <td className="py-3.5 px-3 md:px-space-lg font-semibold text-on-surface whitespace-nowrap">
                            {report.class}
                        </td>
                        <td className="py-3.5 px-3 md:px-space-md whitespace-nowrap">
                            {report.status === "reported" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                                已完成
                            </span>
                            )}
                            {report.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f9f2e7] text-[#9c6b28] font-label-sm text-label-sm font-semibold border border-[#9c6b28]/20">
                                未回報
                            </span>
                            )}
                        </td>
                        <td className="py-3.5 px-space-md font-numeric-data font-semibold whitespace-nowrap">
                            {report.sick > 0 && (<span className="text-rose-500 font-bold">病 {report.sick} </span>)}
                            {report.personal > 0 && (<span className="text-yellow-600 font-bold">事 {report.personal} </span>)}
                            {report.official > 0 && (<span className="text-lime-600 font-bold">公 {report.official} </span>)}
                            {report.other > 0 && (<span className="text-red-600 font-bold">曠 {report.other} </span>)}
                            {report.absentCount > 0 && (<span className="text-on-surface-variant font-bold">共 {report.absentCount} 人</span>)}
                            {report.absentCount === 0 && (<span className="text-green-400 font-bold">全員到齊</span>)}
                            {report.absentCount === -1 && (<span className="text-outline italic">尚未填報</span>)}

                        </td>
                        <td className="py-3.5 px-space-md text-on-surface-variant font-label-sm text-label-sm whitespace-nowrap">
                            {report.submitted_at !== "" ? (
                            <span>
                                <span className="font-numeric-data text-on-surface font-medium mr-1">
                                    {new Date(report.submitted_at).toLocaleTimeString("zh-TW")}
                                </span>
                                    ({report.submitted_by})
                            </span>
                            ) : (
                            <span className="text-outline italic">尚未填報</span>
                            )}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}