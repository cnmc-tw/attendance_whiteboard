"use client";

import { useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";

import type { Profile } from "@/src/domain/identity";

interface DeleteUserDialogProps {
    isOpen: boolean;
    user: Profile | null;
    isDeleting: boolean;
    error: string | null;
    onClose: () => void;
    onConfirm: () => void;
}

export function DeleteUserDialog({
    isOpen,
    user,
    isDeleting,
    error,
    onClose,
    onConfirm,
}: DeleteUserDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!isOpen || !user || !dialog) {
            return;
        }

        dialog.showModal();
        cancelButtonRef.current?.focus();

        return () => {
            if (dialog.open) {
                dialog.close();
            }
        };
    }, [isOpen, user]);

    if (!isOpen || !user) {
        return null;
    }

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby="delete-user-title"
            aria-describedby="delete-user-description"
            aria-busy={isDeleting}
            onCancel={(event) => {
                event.preventDefault();
                if (!isDeleting) {
                    onClose();
                }
            }}
            onClick={(event) => {
                if (event.target === dialogRef.current && !isDeleting) {
                    onClose();
                }
            }}
            className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[min(100%-2rem,28rem)] overflow-y-auto rounded-xl border border-red-200 bg-surface-container-lowest p-space-lg text-on-surface shadow-xl backdrop:bg-on-surface/40"
        >
            <div className="flex flex-col gap-space-md">
                <div className="flex items-start gap-space-sm">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                        <Trash2 aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                        <h2 id="delete-user-title" className="font-headline-md text-headline-md font-bold text-red-800">
                            確認刪除使用者
                        </h2>
                        <p id="delete-user-description" className="mt-1 font-body-sm text-body-sm text-red-800">
                            確定要刪除「{user.name}」（{user.email}）嗎？此操作無法復原。
                        </p>
                    </div>
                </div>

                {error && (
                    <p role="alert" className="rounded-lg bg-red-50 p-space-sm font-body-sm text-body-sm text-red-800">
                        {error}
                    </p>
                )}

                <div className="flex justify-end gap-space-sm">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        disabled={isDeleting}
                        onClick={onClose}
                        className="min-h-10 rounded-lg border border-outline-variant px-space-md font-label-md text-label-md text-on-surface hover:bg-surface-container disabled:opacity-50"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        disabled={isDeleting}
                        onClick={onConfirm}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-700 px-space-md font-label-md text-label-md font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                        {isDeleting ? "刪除中…" : "確認刪除"}
                    </button>
                </div>
            </div>
        </dialog>
    );
}
