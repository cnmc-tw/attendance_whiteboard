'use client'

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

import { Profile } from "@/src/domain/identity";

interface AddEditUserModalProps {
    isOpen: boolean;
    userToEdit: Profile | null;
    onClose: () => void;
}

export function AddEditUserModal ({
    isOpen,
    userToEdit,
    onClose
}: AddEditUserModalProps) {

    const emptyProfile: Profile = {
        email: "",
        auth_user_id: "",
        name: "",
        role: "monitor",
        class: ""
    };

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },  
    } = useForm<Profile>({ defaultValues: userToEdit ?? emptyProfile });

    useEffect(() => {
        reset(userToEdit ?? emptyProfile);
    }, [userToEdit, isOpen, reset, emptyProfile]);

    if (!isOpen) return null;

    const onSubmit: SubmitHandler<Profile> = (data) => {
        if (!data.email) return;

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
                    <div className="flex flex-col gap-1">
                        <label htmlFor="profile-name" className="font-label-sm text-label-sm text-secondary font-medium">
                            姓名
                        </label>
                        <input
                            type="text"
                            {...register("name",
                                

                            )}
                            placeholder="請輸入姓名"
                            className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/60 font-body-md text-on-surface focus:outline-none focus:border-primary"
                        />
                        {errors.name && <span className="text-error font-body-sm">{errors.name.message}</span>}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="profile-role" className="font-label-sm text-label-sm text-secondary font-medium">
                        身分角色
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
                            {...register("class")}
                            disabled={true}
                            placeholder="請輸入班級"
                            className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/60 font-body-md text-on-surface focus:outline-none focus:border-primary"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="profile-class" className="font-label-sm text-label-sm text-secondary font-medium">
                            Email(限用本校GS帳號)<span className="text-error">*</span>
                        </label>
                        <input
                            type="text"
                            disabled={!!userToEdit}
                            {...register("email", {
                                required: true,
                                pattern: /^[a-zA-Z0-9._%+-]+@gs.hs.ntnu.edu.tw$/
                            })}
                            placeholder="請輸入Email"
                            className="h-10 px-space-sm rounded-lg bg-surface-container-low border border-outline-variant/60 font-body-md text-on-surface focus:outline-none focus:border-primary"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-space-sm pt-space-xs">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-space-md h-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer border border-outline-variant/40"
                        >
                            取消
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
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
