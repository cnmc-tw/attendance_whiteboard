export interface MetricsData {

    classcount: number
    reportedClass: number

    notReportedGrade1: number[]
    notReportedGrade2: number[]
    notReportedGrade3: number[]


    sick: number
    personal: number
    official: number
    other: number
    all: number

}


export function Metrics({data}: {data: MetricsData}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* Card 1: Completed */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-tertiary-container" />
            <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                已完成回報班級
                </span>
                <span
                className="material-symbols-outlined text-tertiary-container text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
                >
                task_alt
                </span>
            </div>
            <div className="mt-space-md flex items-baseline gap-space-xs">
                <span className="font-display text-3xl text-primary font-bold tracking-tight">
                    {data.reportedClass}
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                / {data.classcount} 班
                </span>
            </div>
            {/* <div className="mt-space-sm flex items-center justify-between pt-space-xs border-t border-outline-variant/30">
                <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-tertiary-container" />
                <span className="font-numeric-data text-label-sm text-tertiary-container font-semibold">
                    66.7% 完成進度
                </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                符合常態速率
                </span>
            </div> */}
            </div>

            {/* Card 2: Pending */}
            <div className="bg-surface-container-lowest lg:col-span-2 rounded-xl p-space-lg shadow-sm flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#b87333]" />
            <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                尚未送出回報
                </span>
                <span className="material-symbols-outlined text-[#8a531e] text-[20px]">
                notifications_active
                </span>
            </div>
            <div className="mt-space-md flex flex-col items-baseline gap-space-xs">
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                    高一：{data.notReportedGrade1.map((v,idx,a) => `${v}${
                        idx === (a.length-1) ? "。" : "、"
                    }`)}
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                    高二：{data.notReportedGrade2.map((v,idx,a) => `${v}${
                        idx === (a.length-1) ? "。" : "、"
                    }`)}
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                    高三：{data.notReportedGrade3.map((v,idx,a) => `${v}${
                        idx === (a.length-1) ? "。" : "、"
                    }`)}
                </span>
            </div>
            {/* <div className="mt-space-sm flex items-center justify-between pt-space-xs border-t border-outline-variant/30">
                <button
                type="button"
                className="inline-flex items-center gap-1 text-primary-container hover:text-primary font-label-sm text-label-sm font-semibold transition-colors hover:underline cursor-pointer"
                >
                <span className="material-symbols-outlined text-[15px]">
                    campaign
                </span>
                <span>發送推播廣播提醒</span>
                </button>
                <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                剩餘 25 分
                </span>
            </div> */}
            </div>

            {/* Card 3: Absence */}
            <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary-container" />
            <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                全校登記缺席
                </span>
                <span className="material-symbols-outlined text-primary-container text-[20px]">
                person_off
                </span>
            </div>
            <div className="mt-space-md flex items-baseline gap-space-xs">
                <span className="font-display text-3xl text-primary font-bold tracking-tight">
                {data.all}
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                名學生
                </span>
            </div>
            <div className="mt-space-sm flex items-center gap-2 pt-space-xs border-t border-outline-variant/30 font-label-sm text-label-sm text-on-surface-variant">
                <span className="px-1.5 py-0.5 bg-surface-container rounded text-rose-500 font-medium">
                病 {data.sick}
                </span>
                <span className="px-1.5 py-0.5 bg-surface-container rounded text-yellow-600 font-medium">
                事 {data.personal}
                </span>
                <span className="px-1.5 py-0.5 bg-surface-container rounded text-lime-600 font-medium">
                公 {data.official}
                </span>
                <span className="px-1.5 py-0.5 bg-surface-container rounded text-red-600 font-medium">
                曠 {data.official}
                </span>
            </div>
            </div>
        </div>
    )
}