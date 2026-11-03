'use client'

import { RadixMultiSelect } from "./ui";
import { useState, useActionState, useOptimistic, useTransition, useEffect } from "react";
import { Report } from "@/src/domain/attendance";
import { submitReport } from "@/app/actions";
import { AppTime } from "@/shared/time";

interface ReportCardProps {
    report: Report | null;
    cooldown_seconds: string;
}

export function ReportCard({ cooldown_seconds, report }: ReportCardProps) {
    const [isPendingTransition, startTransition] = useTransition();

    // 1. 真實狀態 (Server 的冷卻計算基準時間)
    const [submittedAt, setSubmittedAt] = useState<Date | null>(
        report?.submitted_at ? new Date(report.submitted_at) : null
    );

    const [sickLeaveSelected, setSickLeaveSelected] = useState<string[]>(report?.payload.sick.map(String) ?? []);
    const [personalLeaveSelected, setPersonalLeaveSelected] = useState<string[]>(report?.payload.personal.map(String) ?? []);
    const [officialDutySelected, setOfficialDutySelected] = useState<string[]>(report?.payload.official.map(String) ?? []);
    const [otherLeaveSelected, setOtherLeaveSelected] = useState<string[]>(report?.payload.other.map(String) ?? []);

    // 2. 設定樂觀更新 (Optimistic State)
    // 點擊提交時，立刻將 submittedAt 樂觀地更新為 AppTime.now()
    const [optimisticSubmittedAt, setOptimisticSubmittedAt] = useOptimistic(
        submittedAt,
        (_current, newTime: Date) => newTime
    );

    // 3. Server Action 狀態管理
    const [state, formAction, isPendingAction] = useActionState(
        async () => {
            const res = await submitReport({
                sick: sickLeaveSelected.map(v => parseInt(v, 10)),
                personal: personalLeaveSelected.map(v => parseInt(v, 10)),
                official: officialDutySelected.map(v => parseInt(v, 10)),
                other: otherLeaveSelected.map(v => parseInt(v, 10)),
            });

            if (res.success) {
                // 送出成功，真正寫入提交時間
                setSubmittedAt(AppTime.now());
            }
            // 若失敗，submittedAt 保持原樣，useOptimistic 會自動 Rollback 還原
            return res;
        },
        { success: false }
    );

    const isPending = isPendingTransition || isPendingAction;

    // 4. 計算剩餘冷卻時間
    const [cooldown, setCooldown] = useState(0);

    function getRemainingCooldown(submittedAtDate: Date | null, cooldownSeconds: number): number {
        if (!submittedAtDate) return 0;
        const elapsed = (AppTime.now().getTime() - submittedAtDate.getTime()) / 1000;
        return Math.max(0, Math.ceil(cooldownSeconds - elapsed));
    }

    useEffect(() => {
        const update = () => {
            setCooldown(getRemainingCooldown(optimisticSubmittedAt, +cooldown_seconds));
        };
        update();
        const timer = setInterval(update, 1000);
        return () => clearInterval(timer);
    }, [cooldown_seconds, optimisticSubmittedAt]);

    // 5. 樂觀提交處理函式 (替代傳統 formAction 傳遞)
    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        startTransition(async () => {
            // 瞬間更新 UI：進入冷卻時間
            setOptimisticSubmittedAt(AppTime.now());
            // 呼叫實際的 Server Action
            formAction();
        });
    };

    const errorMessages: Record<string, string> = {
        REPORT_NOT_ALLOWED: "目前不在今日回報時間內。",
        REPORT_COOLDOWN: "剛才已經送出回報，請稍後再試。",
        INVALID_PAYLOAD: "回報資料錯誤。",
        UNAUTHORIZED: "目前登入狀態無效，請重新登入。",
        NOT_MONITOR: "目前帳號沒有風紀回報權限。",
        INVALID_MONITOR_CLASS: "目前帳號沒有設定班級。",
        INTERNAL_ERROR: "系統發生錯誤，請稍後再試。",
    };

    const leaveCategories = [
        { name: "病假", selected: sickLeaveSelected, onChange: setSickLeaveSelected },
        { name: "事假", selected: personalLeaveSelected, onChange: setPersonalLeaveSelected },
        { name: "公假", selected: officialDutySelected, onChange: setOfficialDutySelected },
        { name: "其他 / 曠課", selected: otherLeaveSelected, onChange: setOtherLeaveSelected },
    ];

    const numbers = Array.from({ length: 40 }, (_, i) => ({
        label: String(i + 1),
        value: String(i + 1)
    }));

    function findOptions(selectedCategory: string) {
        const allSelectedValues = new Set([
            ...sickLeaveSelected,
            ...personalLeaveSelected,
            ...officialDutySelected,
            ...otherLeaveSelected,
        ]);

        const currentCategorySelected = new Set(
            selectedCategory === "病假" ? sickLeaveSelected :
                selectedCategory === "事假" ? personalLeaveSelected :
                    selectedCategory === "公假" ? officialDutySelected :
                        selectedCategory === "其他 / 曠課" ? otherLeaveSelected : []
        );

        return numbers.filter(
            (option) => !allSelectedValues.has(option.value) || currentCategorySelected.has(option.value)
        );
    }

    return (
        <div className="mt-8 space-y-4">
            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-8">
                {leaveCategories.map((category) => (
                    <div key={category.name} className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                                {category.name}
                            </span>
                        </div>
                        <RadixMultiSelect
                            options={findOptions(category.name)}
                            placeholder="請選擇..."
                            selected={category.selected}
                            onChange={category.onChange}
                        />
                    </div>
                ))}

                {/* Submit Action Block */}
                <div className="flex sm:flex-col gap-1.5 items-center justify-between pt-2 border-t border-outline-variant/40">
                    {state.success && (
                        <div className="flex items-center text-tertiary-container font-semibold bg-tertiary-fixed px-4 py-2 rounded-lg">
                            今日出缺勤紀錄已成功更新並送出至生輔組！
                        </div>
                    )}
                    {!state.success && state.error && (
                        <div className="flex items-center text-error px-4 py-2 rounded-lg gap-1">
                            <span className="material-symbols-outlined text-base">error</span>
                            <span>
                                {errorMessages[state.error] ?? "送出回報時發生錯誤，請稍後再試。"}
                            </span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending || cooldown > 0}
                        className={`px-8 py-3 w-full rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 ${isPending || cooldown > 0
                                ? "opacity-70 cursor-not-allowed"
                                : "hover:bg-primary hover:shadow-lg cursor-pointer"
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {isPending
                                ? "progress_activity"
                                : cooldown > 0
                                    ? "schedule"
                                    : "send"}
                        </span>

                        <span>
                            {isPending
                                ? "處理中..."
                                : cooldown > 0
                                    ? `請稍候 ${Math.floor(cooldown / 60)
                                        .toString()
                                        .padStart(2, "0")}:${(cooldown % 60)
                                            .toString()
                                            .padStart(2, "0")}`
                                    : "送出今日回報"}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
}