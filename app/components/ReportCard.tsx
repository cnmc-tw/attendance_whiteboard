'use client'

import { RadixMultiSelect } from "./ui";
import { useState, useActionState, useEffect } from "react";


import { submitReport } from "@/app/actions"

import { AppTime } from "@/shared/time";

export function ReportCard({cooldown_seconds} : { cooldown_seconds: string}) {

    const [cooldown, setCooldown] = useState(0);
    const [submittedAt, setSubmittedAt] = useState(new Date("2022-03-25"));

    const [sickLeaveSelected, setSickLeaveSelected] = useState<string[]>([]);
    const [personalLeaveSelected, setPersonalLeaveSelected] = useState<string[]>([]);
    const [officialDutySelected, setOfficialDutySelected] = useState<string[]>([]);
    const [otherLeaveSelected, setOtherLeaveSelected] = useState<string[]>([]);
    const [state, formAction, isPending] = useActionState(
        async () => {
          setSubmittedAt(AppTime.now())
          return await submitReport({
              sick: sickLeaveSelected.map(v => parseInt(v, 10)),
              personal: personalLeaveSelected.map(v => parseInt(v, 10)),
              official: officialDutySelected.map(v => parseInt(v, 10)),
              other: otherLeaveSelected.map(v => parseInt(v, 10)),
          });
        },
        { success: false, } // 初始 state
    );

    function getRemainingCooldown(
        submittedAt: Date,
        cooldownSeconds: number,
    ): number {
        const elapsed =
            (AppTime.now().getTime() - submittedAt.getTime()) / 1000;

        return Math.max(
            0,
            Math.ceil(cooldownSeconds - elapsed),
        );
    }


    useEffect(() => {
        const update = () => {
            setCooldown(
                getRemainingCooldown(
                    submittedAt,
                    +cooldown_seconds
                ),
            );
        };

        update();

        const timer = setInterval(update, 1000);

        return () => clearInterval(timer);
    }, [cooldown_seconds, submittedAt]);


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

    function findOptions(selectedCategory: string): { label: string; value: string }[] {
        // 1. 收集「所有假別」已經選取的數字 (將多個子集合併成 Set)
        const allSelectedValues = new Set([
            ...sickLeaveSelected,
            ...personalLeaveSelected,
            ...officialDutySelected,
            ...otherLeaveSelected,
        ]);

        // 2. 取得「當前正在查看的假別」已經選取的數字
        const currentCategorySelected = new Set(
            selectedCategory === "病假" ? sickLeaveSelected :
            selectedCategory === "事假" ? personalLeaveSelected :
            selectedCategory === "公假" ? officialDutySelected :
            selectedCategory === "其他 / 曠課" ? otherLeaveSelected : []
        );

        // 3. 過濾選項：
        // 條件：(不在全域已被選取的名單中) OR (屬於當前假別自己選中的)
        return numbers.filter(
            (option) => !allSelectedValues.has(option.value) || currentCategorySelected.has(option.value)
        );
    }


    return (
        <div className="mt-8 space-y-4">
            {/* Card Form Body */}
            <form action={formAction} className="p-8 flex flex-col gap-8">
                
            {leaveCategories.map((category) => (
              <div key={category.name} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          {category.name}
                        </span>
                    </div>
                </div>
                    <RadixMultiSelect
                      options={findOptions(category.name)}
                      placeholder="請選擇..."
                      selected={category.selected}
                      onChange={category.onChange}
                    />
                </div>))}

                {/* Submit Action */}
                <div className="flex sm:flex-col gap-1.5 items-center justify-between pt-2 border-t border-outline-variant/40">
                  {state.success && (
                    <div className="flex items-center text-tertiary-container font-semibold bg-tertiary-fixed px-4 py-2 rounded-lg">
                      今日出缺勤紀錄已成功更新並送出至生輔組！
                    </div>
                  )}
                  {!state.success && state.error && (
                      <div className="flex items-center text-error px-4 py-2 rounded-lg">
                          <span className="material-symbols-outlined text-base">
                              error
                          </span>

                          <span>
                              {errorMessages[state.error] ?? "送出回報時發生錯誤，請稍後再試。"}
                          </span>
                      </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isPending || cooldown > 0}
                    className={`px-8 py-3 w-full rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm font-semibold shadow-md transition-all flex items-center justify-center gap-2 ${
                        isPending || cooldown > 0
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
    )
}