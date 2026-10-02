'use client'

import { FormInputField } from "./FormsInputField";

import { setSettings } from "@/app/actions"
import { SystemConfig } from "@/src/domain/system";

import { useForm, SubmitHandler } from 'react-hook-form';


export function SettingForms({config} : {config: SystemConfig}) {

    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting}
    } = useForm<SystemConfig>({
        defaultValues: config,
    });

    const onSubmit: SubmitHandler<SystemConfig> = async (data) => {
        await setSettings(data)
    }


    return (
        <form onSubmit={handleSubmit(onSubmit)} className="col-span-12 lg:col-span-9 flex flex-col gap-space-xl">
            {/* Section 1: Reporting Window */}
            <section
                id="section-reporting"
                className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col gap-space-lg relative overflow-hidden border border-outline-variant"
            >
                <div className="flex items-center gap-space-sm border-b border-outline-variant pb-space-md">
                    <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
                    <span
                        className="material-symbols-outlined text-[24px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        timer
                    </span>
                    </div>
                    <div>
                    <h2 className="font-headline-md text-headline-md text-primary tracking-tight font-bold">
                        回報時段與規則設定
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                        設定風紀股長每日常態登記與開放填報的時間區間
                    </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                    {/* 回報開始時間 */}
                    <FormInputField
                        label="回報開始時間"
                        registration={register("report.report_start_time", {
                            required: '請輸入回報開始時間',
                            pattern: {
                            value: /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
                            message: '請輸入正確時間格式(hh:mm:ss)'
                            }
                        })}
                        error={errors.report?.report_start_time}
                    />

                    {/* 回報結束時間 */}
                    <FormInputField
                        label="回報結束時間"
                        registration={register("report.report_end_time", {
                            required: '請輸入回報結束時間',
                            pattern: {
                            value: /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/,
                            message: '請輸入正確時間格式(hh:mm:ss)'
                            },
                            validate: (endTime, formValues) => {
                            const startTime = formValues.report?.report_start_time;
                            if (startTime && /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(startTime)) {
                                if (endTime <= startTime) return '結束時間必須晚於開始時間';
                            }
                            return true;
                            }
                        })}
                        error={errors.report?.report_end_time}
                    />

                    {/* 回報冷卻時間 */}
                    <FormInputField
                        label="回報冷卻時間"
                        registration={register("report.report_cooldown_seconds", {
                            required: '請輸入回報冷卻時間',
                            pattern: {
                                value: /^\d+$/,
                                message: '請輸入有效的秒數（正整數）'
                            },
                            validate: (value) => {
                                const num = Number(value);
                                if (num > 999) return '數字過大';
                                if (num < 0) return '秒數不能為負數';
                                return true;
                            }
                        })}
                        error={errors.report?.report_cooldown_seconds}
                    />
                </div>
            </section>

            {/* Section 2: Semester Config */}
            <section
                className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col gap-space-lg relative overflow-hidden border border-outline-variant"
            >
                <div className="flex items-center gap-space-sm border-b border-outline-variant pb-space-md">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-[24px]">
                    calendar_month
                    </span>
                </div>
                <div>
                    <h2 className="font-headline-md text-headline-md text-primary tracking-tight font-bold">
                    學期與校曆設定
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                    維護目前的學年度
                    </p>
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md font-body-md">
                    <FormInputField
                        label="學期開始日期"
                        registration={register("report.semester_start", {
                                required: '請輸入學期開始日期',
                                pattern: {
                                    value: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
                                    message: '請輸入正確日期格式(yyyy-mm-dd)'
                                }
                            })}
                        error={errors.report?.semester_start}
                    />
                    <FormInputField
                        label="學期結束日期"
                        registration={register("report.semester_end", {
                            required: '請輸入學期結束日期',
                            pattern: {
                                value: /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/,
                                message: '請輸入正確日期格式(yyyy-mm-dd)'
                            },
                            validate: (endDate, formValues) => {
                                const startDate = formValues.report?.semester_start;
                                const dateRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

                                if (startDate && dateRegex.test(startDate)) {
                                    if (endDate <= startDate) {
                                        return '學期結束日期必須晚於開始日期';
                                    }
                                }
                                return true;
                            }
                        })}
                        error={errors.report?.semester_end}
                    />
                </div>
            </section>

            {/* Section 3: Class Config */}
            <section className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col gap-space-lg relative overflow-hidden border border-outline-variant">
                <div className="flex items-center gap-space-sm border-b border-outline-variant pb-space-md">
                <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
                    <span
                    className="material-symbols-outlined text-[24px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                    account_tree
                    </span>
                </div>
                <div>
                    <h2 className="font-headline-md text-headline-md text-primary tracking-tight font-bold">
                    年班規則設定
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                    設定班級基準
                    </p>
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                    <FormInputField
                        label="基準年(西元)"
                        registration={register("classNumbering.baseYear", {
                            required: '請輸入基準年',
                            pattern: {
                                value: /^\d+$/,
                                message: '請輸入正確西元年'
                            }
                        })}
                        error={errors.classNumbering?.baseYear}
                    />

                    <FormInputField
                        label="起始班號"
                        registration={register("classNumbering.baseClass", {
                            required: '請輸入起始班號',
                            pattern: {
                                value: /^\d+$/,
                                message: '請輸入正確班號'
                            }
                        })}
                        error={errors.classNumbering?.baseClass}
                    />

                    <FormInputField
                        label="年班間隔"
                        registration={register("classNumbering.classesPerGrade", {
                            required: '請輸入年班間隔',
                            pattern: {
                                value: /^\d+$/,
                                message: '請輸入有效間隔'
                            }
                        })}
                        error={errors.classNumbering?.classesPerGrade}
                    />
                    
                </div>
                <span className="text-red-500 text-xl text-center">
                    計算公式：起始班號 +  (西元年度 - 基準年) * 年班間隔 = 高三 第一班班號
                </span>
            </section>

            
            {/* Save Action */}
            <div className="flex justify-end pt-2">
                <button
                type="submit"
                disabled={!!isSubmitting}
                className="px-8 py-3 rounded-lg bg-primary-container text-on-primary font-headline-sm text-headline-sm font-semibold hover:bg-primary shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                <span className="material-symbols-outlined text-[20px]">save</span>
                <span>{isSubmitting ? '儲存中...' : '儲存系統設定'}</span>
                </button>
            </div>
        </form>
        
    )
}