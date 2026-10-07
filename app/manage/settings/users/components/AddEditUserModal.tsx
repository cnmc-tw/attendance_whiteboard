'use client'

import { useState, useEffect } from "react";
import { useForm, SubmitHandler, useWatch } from "react-hook-form";

import { Profile, Role, EMAIL_DOMAIN } from "@/src/domain/identity";

import { createUser, updateUser } from "@/app/actions"

import { ActionError } from "@/src/application/actions/action-result";

interface AddEditUserModalProps {
    isOpen: boolean;
    userToEdit: Profile | null;
    onClose: () => void;
    onSuccess: () => void;
}

type ProfileFormValues = {
    emailLocalPart: string;
    name: string;
    role: Role;
    class: string;
};

function parseEmailLocalPart(email: string): { localPart: string; isValid: boolean } {

    if (!email.endsWith(EMAIL_DOMAIN)) {
        return {
            localPart: email,
            isValid: false,
        };
    }

    return {
        localPart: email.slice(0, -EMAIL_DOMAIN.length),
        isValid: true,
    };
}


export function AddEditUserModal ({
    isOpen,
    userToEdit,
    onClose,
    onSuccess
}: AddEditUserModalProps) {

    const {
        register,
        handleSubmit,
        reset,
        control,
        setValue,
        formState: {
            errors,
            isSubmitting
        },  
    } = useForm<ProfileFormValues>({
        defaultValues: {
            emailLocalPart: "",
            name: "",
            role: "monitor",
            class: "",
        },
    });

    const [actionError, setActionError] = useState<ActionError | null>(null);
    const profileError = userToEdit && !parseEmailLocalPart(userToEdit.email).isValid
    ? "人員資料的 Email 格式異常"
    : null;

    const role = useWatch({
        control,
        name: "role",
        defaultValue: "monitor"
    });

    useEffect(() => {
        if (!userToEdit) {
            reset({
                emailLocalPart: "",
                name: "",
                role: "monitor",
                class: "",
            });
            return;
        }

        const { localPart } = parseEmailLocalPart(userToEdit.email);

        reset({
            emailLocalPart: localPart,
            name: userToEdit.name,
            role: userToEdit.role,
            class: userToEdit.class ?? "",
        });
    }, [userToEdit, reset]);

    useEffect(() => {
        if (role !== "monitor") {
            setValue("class", "");
        } else if (userToEdit) {
            setValue("class", userToEdit.class)
        }
    }, [role, setValue, userToEdit]);

    const errorMessage =
        profileError ??
        (actionError
            ? getActionErrorMessage(actionError)
            : null);



    if (!isOpen) return null;
    
    function getActionErrorMessage(
        error: ActionError,
    ): string {
        switch (error) {
            case "UNAUTHORIZED":
                return "登入狀態已失效，請重新登入";

            case "FORBIDDEN":
                return "你沒有權限執行此操作";

            case "VALIDATION_ERROR":
                return "資料格式不符合要求";

            case "CONFLICT":
                return "資料已存在，請確認後再試";

            case "NOT_FOUND":
                return "找不到這筆人員資料";

            default:
                return "操作失敗，請稍後再試";
        }
    }

    const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
        setActionError(null);

        const className =
            data.role === "monitor"
                ? data.class.trim()
                : null;

        const input = {
            name: data.name.trim(),
            role: data.role,
            class: className,
        };

        const email = `${data.emailLocalPart.trim().toLowerCase()}@gs.hs.ntnu.edu.tw`;

        const result = userToEdit
            ? await updateUser(userToEdit.email, input)
            : await createUser({
                email,
                ...input,
            });

        if (!result.success) {
            setActionError(result.error);
            return;
        }

        reset({
            emailLocalPart: "",
            name: "",
            role: "monitor",
            class: "",
        });
        setActionError(null);
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs">
            <div className="bg-surface-container-lowest rounded-xl shadow-xl max-w-lg w-full p-space-lg flex flex-col gap-space-md border border-outline-variant/60 animate-in fade-in zoom-in duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/30">
                    <div className="flex items-center gap-space-sm">
                        <span className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
                        <span className="material-symbols-outlined text-[18px]">
                            {userToEdit ? "edit" : "person_add"}
                        </span>
                        </span>
                        <h2 className="font-headline-md text-headline-md text-primary font-bold">
                            {userToEdit ? "編輯人員資料" : "新增人員帳號"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="關閉視窗"
                        className="w-8 h-8 rounded-lg hover:bg-surface-container flex items-center justify-center text-secondary transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-space-md">
                    <fieldset
                        disabled={!!profileError || isSubmitting}
                        className={`${profileError ? "opacity-60 cursor-not-allowed" : undefined}`}
                    >
                        <div className="flex flex-col gap-1">
                            <label htmlFor="profile-name" className="font-label-sm text-label-sm text-secondary font-medium">
                                姓名<span className="text-error">*</span>
                            </label>
                            <input
                                type="text"
                                {...register("name", {
                                    required: "請輸入姓名",
                                    validate: (value) =>
                                        value.trim().length > 0 ||
                                        "姓名不可為空白",
                                })}
                                placeholder="請輸入姓名"
                                className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/60 font-body-md text-on-surface focus:outline-none focus:border-primary"
                            />
                            {errors.name && <span className="text-error font-body-sm">{errors.name.message}</span>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="profile-role" className="font-label-sm text-label-sm text-secondary font-medium">
                            身分角色<span className="text-error">*</span>
                            </label>
                            <select
                            {...register("role")}
                            className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/60 font-body-md text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                            >
                            <option value="monitor">風紀股長</option>
                            <option value="instructor">教官</option>
                            <option value="supervisor">管理員</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label htmlFor="profile-class" className="font-label-sm text-label-sm text-secondary font-medium">
                            班級
                            </label>
                            <input
                                type="text"
                                {...register("class", {
                                    validate: (value) => {
                                        if (role === "monitor" && !value.trim()) {
                                            return "風紀股長必須指定班級";
                                        }

                                        return true;
                                    },
                                })}
                                disabled={role !== "monitor"}
                                placeholder={
                                    role === "monitor"
                                        ? "請輸入班級"
                                        : "非風紀股長不需要指定班級"
                                }
                                className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/60 font-body-md text-on-surface focus:outline-none focus:border-primary"
                            />
                            {errors.class && <span className="text-error font-body-sm">{errors.class.message}</span>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label
                                htmlFor="profile-email"
                                className="font-label-sm text-label-sm text-secondary font-medium"
                            >
                                Email（本校 GS 帳號）<span className="text-error">*</span>
                            </label>

                            <div className="flex items-center">
                                <input
                                    type="text"
                                    disabled={!!userToEdit}
                                    {...register("emailLocalPart", {
                                        required: "請輸入帳號",
                                        pattern: {
                                            value: /^[a-zA-Z0-9._%+-]+$/,
                                            message: "帳號格式不正確",
                                        },
                                    })}
                                    placeholder=""
                                    className="h-10 flex-1 px-space-sm rounded-l-lg bg-surface-container-low border border-outline-variant/60 font-body-md text-on-surface focus:outline-none focus:border-primary"
                                />

                                <span className="h-10 flex items-center px-space-sm rounded-r-lg bg-surface-container border border-l-0 border-outline-variant/60 font-body-md text-secondary">
                                    @gs.hs.ntnu.edu.tw
                                </span>
                            </div>

                            {errors.emailLocalPart && (
                                <span className="text-error font-body-sm">
                                    {errors.emailLocalPart.message}
                                </span>
                            )}
                        </div>
                    </fieldset>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-space-sm pt-space-xs">
                        {errorMessage && (
                            <div
                                role="alert"
                                className="px-space-sm py-space-xs text-error font-body-sm"
                            >
                                {errorMessage}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-space-md h-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer border border-outline-variant/40"
                        >
                            取消
                        </button>

                        <button
                            type="submit"
                            disabled={!!profileError || isSubmitting}
                            className="px-space-md h-10 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                        >
                            {userToEdit ? "儲存更新" : "確認新增"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
