"use client";

import {
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
    type KeyboardEvent,
} from "react";
import {
    previewMonitorImport,
    synchronizeMonitorImport,
} from "@/app/actions/user";
import { ImportDiffPreview } from "./import-csv/components/ImportDiffPreview";
import { ImportFileStep } from "./import-csv/components/ImportFileStep";
import {
    ImportStageNavigation,
    ImportStagePanel,
} from "./import-csv/components/ImportStageNavigation";
import { ImportValidationFeedback } from "./import-csv/components/ImportValidationFeedback";
import { getSyncErrorMessage } from "./import-csv/lib/errors";
import { toDiffRows } from "./import-csv/lib/diff";
import { ROLE_LABELS } from "./import-csv/lib/labels";
import { importReducer, initialState } from "./import-csv/reducer";
import type { ImportCsvModalProps } from "./import-csv/types";

const PAGE_SIZE = 10;

function createImportFormData(file: File): FormData {
    const formData = new FormData();
    formData.set("file", file);
    return formData;
}

export const ImportCsvModal = ({
    isOpen,
    onClose,
    onDownloadTemplate,
    onSuccess,
}: ImportCsvModalProps) => {
    const [state, dispatch] = useReducer(importReducer, initialState);
    const {
        selectedFile,
        preview,
        previewStatus,
        saveStatus,
        previewError,
        saveError,
        stage,
        removalAcknowledged,
        searchQuery,
        diffFilter,
        currentPage,
        closeError,
    } = state;
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const stagePanelRef = useRef<HTMLElement>(null);
    const previousStageRef = useRef(stage);
    const operationIdRef = useRef(0);
    const operationInProgressRef = useRef(false);

    const isBusy =
        previewStatus === "loading" || stage === "syncing";

    useEffect(() => {
        if (!isOpen) return;

        const previousFocus = document.activeElement as HTMLElement | null;
        closeButtonRef.current?.focus();
        return () => previousFocus?.focus();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            previousStageRef.current = stage;
            return;
        }

        if (previousStageRef.current !== stage) {
            stagePanelRef.current?.focus();
            previousStageRef.current = stage;
        }
    }, [isOpen, stage]);

    const resetWorkflow = () => {
        operationIdRef.current += 1;
        operationInProgressRef.current = false;
        dispatch({ type: "RESET" });
    };

    const requestClose = () => {
        if (stage === "syncing") {
            dispatch({ type: "CLOSE_BLOCKED_DURING_SYNC" });
            return;
        }

        if (selectedFile && saveStatus !== "success") {
            const confirmed = window.confirm(
                previewStatus === "loading"
                    ? "CSV 正在驗證中。確定要放棄這次匯入並關閉視窗嗎？"
                    : "這次匯入尚未同步完成。確定要放棄目前的檔案與預覽嗎？",
            );
            if (!confirmed) return;
        }

        resetWorkflow();
        onClose();
    };

    const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Escape") {
            event.preventDefault();
            requestClose();
            return;
        }

        if (event.key !== "Tab") return;
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!focusableElements?.length) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const setNewFile = (file: File | undefined) => {
        if (!file || operationInProgressRef.current) return;
        operationIdRef.current += 1;
        dispatch({ type: "FILE_SELECTED", file });
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setNewFile(event.currentTarget.files?.[0]);
        event.currentTarget.value = "";
    };

    const handleFileDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingFile(false);
        if (isBusy || operationInProgressRef.current) return;
        setNewFile(event.dataTransfer.files[0]);
    };

    const handlePreview = async () => {
        if (
            stage !== "select" ||
            !selectedFile ||
            isBusy ||
            operationInProgressRef.current
        ) {
            return;
        }

        const operationId = ++operationIdRef.current;
        operationInProgressRef.current = true;
        dispatch({ type: "PREVIEW_STARTED" });

        try {
            const result = await previewMonitorImport(
                createImportFormData(selectedFile),
            );
            if (operationId !== operationIdRef.current) return;
            dispatch({ type: "PREVIEW_SUCCEEDED", preview: result });
        } catch {
            if (operationId !== operationIdRef.current) return;
            dispatch({
                type: "PREVIEW_FAILED",
                error: "預覽失敗，請確認登入與權限後重新嘗試。",
            });
        } finally {
            if (operationId === operationIdRef.current) {
                operationInProgressRef.current = false;
            }
        }
    };

    const handleSynchronize = async () => {
        if (
            !selectedFile ||
            !canSynchronize ||
            operationInProgressRef.current ||
            (removeCount > 0 && !removalAcknowledged)
        ) {
            return;
        }

        const operationId = ++operationIdRef.current;
        operationInProgressRef.current = true;
        dispatch({ type: "SYNC_STARTED" });

        let result: Awaited<ReturnType<typeof synchronizeMonitorImport>>;
        try {
            result = await synchronizeMonitorImport(
                createImportFormData(selectedFile),
            );
        } catch {
            if (operationId !== operationIdRef.current) return;
            dispatch({
                type: "SYNC_FAILED",
                error: "同步請求未完成。請重新預覽名冊狀態後再重試。",
            });
            operationInProgressRef.current = false;
            return;
        }

        if (operationId !== operationIdRef.current) return;
        operationInProgressRef.current = false;

        if (!result.success) {
            dispatch({
                type: "SYNC_FAILED",
                error: getSyncErrorMessage(result.error),
            });
            return;
        }

        dispatch({ type: "SYNC_SUCCEEDED" });
        try {
            onSuccess?.();
        } catch {
            dispatch({
                type: "SYNC_REFRESH_FAILED",
                error: "同步已成功，但名冊清單重新整理失敗；請手動重新載入頁面。",
            });
        }
    };

    const diffRows = useMemo(
        () => (preview ? toDiffRows(preview) : []),
        [preview],
    );
    const filteredRows = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
        return diffRows.filter((row) => {
            if (diffFilter !== "all" && row.type !== diffFilter) return false;
            if (!normalizedQuery) return true;

            const profile = row.after ?? row.before;
            if (!profile) return false;
            const searchableValues = [
                profile.name ?? "",
                profile.email,
                profile.class ?? "",
                ROLE_LABELS[profile.role],
            ];
            return searchableValues.some((value) =>
                value.toLocaleLowerCase().includes(normalizedQuery),
            );
        });
    }, [diffFilter, diffRows, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    const pageRows = filteredRows.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );
    const firstVisibleRow = filteredRows.length
        ? (currentPage - 1) * PAGE_SIZE + 1
        : 0;
    const lastVisibleRow = Math.min(currentPage * PAGE_SIZE, filteredRows.length);

    const counts = preview?.diff
        ? {
            create: preview.diff.create.length,
            update: preview.diff.update.length,
            remove: preview.diff.remove.length,
            unchanged: preview.diff.unchanged.length,
        }
        : { create: 0, update: 0, remove: 0, unchanged: 0 };
    const removeCount = counts.remove;
    const hasSafeDiff =
        previewStatus === "complete" &&
        !!preview &&
        preview.importResult.errors.length === 0 &&
        preview.importResult.rows.length > 0 &&
        !!preview.diff;
    const canSynchronize =
        hasSafeDiff &&
        (stage === "confirm" ||
            (stage === "result" && saveStatus === "error")) &&
        saveStatus !== "success" &&
        !isBusy &&
        (removeCount === 0 || removalAcknowledged);
    const canRequestConfirmation =
        stage === "review" && hasSafeDiff && saveStatus === "idle";

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 backdrop-blur-xs sm:p-4"
            onKeyDown={handleDialogKeyDown}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="monitor-import-title"
                aria-describedby="monitor-import-description"
                className="flex h-[100dvh] max-h-[100dvh] w-full min-h-0 flex-col overflow-hidden rounded-none border border-outline-variant/60 bg-surface-container-lowest shadow-xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-5xl sm:rounded-xl"
            >
                <header className="flex shrink-0 items-center justify-between gap-space-sm border-b border-outline-variant/30 px-space-md py-space-sm sm:px-space-lg">
                    <div className="flex min-w-0 items-center gap-space-sm">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary shadow-xs">
                            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                                upload_file
                            </span>
                        </span>
                        <h2
                            id="monitor-import-title"
                            className="min-w-0 break-words font-headline-md text-headline-md font-bold text-primary"
                        >
                            匯入風紀股長名冊
                        </h2>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={requestClose}
                        disabled={saveStatus === "loading"}
                        aria-label="關閉匯入視窗"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                            close
                        </span>
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-space-md py-space-md sm:px-space-lg">
                    <p
                        id="monitor-import-description"
                        className="mb-space-md font-body-md text-body-md leading-relaxed text-on-surface-variant"
                    >
                        上傳 CSV 後先檢視伺服器驗證結果與名冊差異；確認無誤後才會同步。預覽完成不會自動寫入資料。
                    </p>



                    <ImportStageNavigation stage={stage} />
                    <ImportStagePanel stage={stage} panelRef={stagePanelRef}>
                        {stage === "select" && (
                            <div>
                                <h3 className="mb-space-md font-label-lg text-label-lg font-bold text-on-surface">
                                    選擇 CSV 檔案
                                </h3>
                                <ImportFileStep
                                    selectedFile={selectedFile}
                                    isBusy={isBusy}
                                    isDraggingFile={isDraggingFile}
                                    previewStatus={previewStatus}
                                    setIsDraggingFile={setIsDraggingFile}
                                    handleFileDrop={handleFileDrop}
                                    handleFileChange={handleFileChange}
                                    handlePreview={handlePreview}
                                    onDownloadTemplate={onDownloadTemplate}
                                />
                                <ImportValidationFeedback
                                    preview={null}
                                    previewError={previewError}
                                    previewStatus={previewStatus}
                                />
                            </div>
                        )}

                        {stage === "review" && (
                            <div>
                                <h3 className="mb-space-md font-label-lg text-label-lg font-bold text-on-surface">
                                    檢視驗證結果與名冊差異
                                </h3>
                                {saveStatus === "success" && (
                                    <p
                                        role="status"
                                        aria-live="polite"
                                        className="mb-space-md rounded-lg border border-green-200 bg-green-50 p-space-sm font-body-sm text-body-sm font-semibold text-green-800"
                                    >
                                        名冊同步成功。此視窗仍保留預覽結果，您可以檢視後再關閉。
                                    </p>
                                )}
                                {saveStatus === "error" && saveError && (
                                    <p
                                        role="alert"
                                        className="mb-space-md rounded-lg border border-red-200 bg-red-50 p-space-sm font-body-sm text-body-sm text-red-800"
                                    >
                                        {saveError}
                                    </p>
                                )}
                                <ImportValidationFeedback
                                    preview={preview}
                                    previewError={null}
                                    previewStatus={previewStatus}
                                />
                                <ImportDiffPreview
                                    hasSafeDiff={hasSafeDiff}
                                    preview={preview}
                                    counts={counts}
                                    removeCount={removeCount}
                                    searchQuery={searchQuery}
                                    onSearchQueryChange={(query) =>
                                        dispatch({ type: "SEARCH_CHANGED", query })
                                    }
                                    diffFilter={diffFilter}
                                    onDiffFilterChange={(filter) =>
                                        dispatch({ type: "FILTER_CHANGED", filter })
                                    }
                                    filteredRows={filteredRows}
                                    pageRows={pageRows}
                                    firstVisibleRow={firstVisibleRow}
                                    lastVisibleRow={lastVisibleRow}
                                    totalPages={totalPages}
                                    currentPage={currentPage}
                                    onPageChange={(page) =>
                                        dispatch({ type: "PAGE_CHANGED", page })
                                    }
                                />
                            </div>
                        )}

                        {stage === "confirm" && hasSafeDiff && (
                            <section aria-labelledby="sync-confirmation-title">
                                <h3
                                    id="sync-confirmation-title"
                                    className="font-label-lg text-label-lg font-bold text-on-surface"
                                >
                                    確認同步名冊
                                </h3>
                                <p className="mt-space-sm rounded-xl border border-primary/30 bg-primary-fixed/30 p-space-md font-body-sm text-body-sm leading-relaxed text-on-surface-variant">
                                    將新增 {counts.create} 筆、修改 {counts.update} 筆、移除{" "}
                                    {counts.remove} 筆；{counts.unchanged} 筆資料不變。同步前伺服器會重新驗證並計算差異。
                                </p>
                                {removeCount > 0 && (
                                    <label className="mt-space-sm flex cursor-pointer items-start gap-space-sm rounded-lg border border-red-300 bg-red-50 p-space-sm font-body-sm text-body-sm text-red-900 focus-within:ring-2 focus-within:ring-red-700 focus-within:ring-offset-2">
                                        <input
                                            type="checkbox"
                                            checked={removalAcknowledged}
                                            onChange={(event) =>
                                                dispatch({
                                                    type: "REMOVAL_ACKNOWLEDGED",
                                                    acknowledged: event.target.checked,
                                                })
                                            }
                                            className="mt-0.5 h-5 w-5 shrink-0 accent-red-700"
                                        />
                                        <span className="warp-break-words">
                                            我已確認，將從名冊移除上述 {removeCount} 筆 CSV 未列出的風紀股長資料。
                                        </span>
                                    </label>
                                )}
                            </section>
                        )}

                        {stage === "syncing" && (
                            <div
                                role="status"
                                aria-live="polite"
                                className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-space-lg text-center font-body-md text-body-md text-on-surface-variant"
                            >
                                <span
                                    aria-hidden="true"
                                    className="material-symbols-outlined mb-space-sm block animate-spin text-3xl text-primary"
                                >
                                    progress_activity
                                </span>
                                正在同步名冊。同步完成前請勿關閉視窗或重複操作。
                            </div>
                        )}

                        {stage === "result" && (
                            <section aria-labelledby="sync-result-title">
                                {saveStatus === "success" ? (
                                    <>
                                        <h3
                                            id="sync-result-title"
                                            className="font-label-lg text-label-lg font-bold text-green-800"
                                        >
                                            名冊同步成功
                                        </h3>
                                        <p
                                            role="status"
                                            aria-live="polite"
                                            className="mt-space-sm rounded-lg border border-green-200 bg-green-50 p-space-md font-body-sm text-body-sm text-green-800"
                                        >
                                            新增 {counts.create} 筆、修改 {counts.update} 筆、移除{" "}
                                            {counts.remove} 筆；{counts.unchanged} 筆資料不變。
                                        </p>
                                        {saveError && (
                                            <p
                                                role="alert"
                                                className="mt-space-sm rounded-lg border border-amber-200 bg-amber-50 p-space-sm font-body-sm text-body-sm text-amber-900"
                                            >
                                                {saveError}
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <h3
                                            id="sync-result-title"
                                            className="font-label-lg text-label-lg font-bold text-red-800"
                                        >
                                            同步未完成
                                        </h3>
                                        {saveError && (
                                            <p
                                                role="alert"
                                                className="mt-space-sm rounded-lg border border-red-200 bg-red-50 p-space-md font-body-sm text-body-sm text-red-800"
                                            >
                                                {saveError}
                                            </p>
                                        )}
                                        <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant">
                                            預覽資料仍保留；可重新嘗試同步，伺服器會再次驗證名冊差異。
                                        </p>
                                    </>
                                )}
                            </section>
                        )}
                    </ImportStagePanel>
                </div>

                <footer className="flex shrink-0 flex-col-reverse gap-space-sm border-t border-outline-variant/30 bg-surface-container-lowest px-space-md py-space-sm pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-space-lg">
                    <div className="min-h-5 min-w-0" aria-live="polite">
                        {closeError && (
                            <p role="alert" className="break-words font-body-sm text-body-sm text-red-800">
                                {closeError}
                            </p>
                        )}
                    </div>
                    <div className="flex shrink-0 flex-col-reverse gap-space-sm sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={requestClose}
                            disabled={stage === "syncing"}
                            className="min-h-11 rounded-lg border border-outline-variant/40 bg-surface-container px-space-md font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {stage === "result" ? "關閉" : "取消"}
                        </button>

                        {stage === "select" && (
                            <button
                                type="button"
                                onClick={handlePreview}
                                disabled={!selectedFile || isBusy}
                                className="min-h-11 rounded-lg bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {previewStatus === "loading" ? "正在驗證…" : "驗證並預覽"}
                            </button>
                        )}

                        {stage === "review" && saveStatus === "idle" && (
                            <button
                                type="button"
                                onClick={() => dispatch({ type: "BACK_TO_SELECT" })}
                                className="min-h-11 rounded-lg border border-outline-variant/40 bg-surface-container px-space-md font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                重新選擇檔案
                            </button>
                        )}

                        {stage === "review" &&
                            (saveStatus === "success" || saveStatus === "error") && (
                                <button
                                    type="button"
                                    onClick={() => dispatch({ type: "RETURN_TO_RESULT" })}
                                    className="min-h-11 rounded-lg border border-outline-variant/40 bg-surface-container px-space-md font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                >
                                    返回同步結果
                                </button>
                            )}

                        {stage === "review" && saveStatus === "idle" && (
                            <button
                                type="button"
                                onClick={() => dispatch({ type: "SYNC_CONFIRMATION_REQUESTED" })}
                                disabled={!canRequestConfirmation}
                                className="min-h-11 rounded-lg bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                確認差異並繼續
                            </button>
                        )}

                        {stage === "confirm" && (
                            <button
                                type="button"
                                onClick={() => dispatch({ type: "BACK_TO_REVIEW" })}
                                className="min-h-11 rounded-lg border border-outline-variant/40 bg-surface-container px-space-md font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                返回差異預覽
                            </button>
                        )}

                        {stage === "confirm" && (
                            <button
                                type="button"
                                onClick={handleSynchronize}
                                disabled={!canSynchronize}
                                className="min-h-11 rounded-lg bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                開始同步
                            </button>
                        )}

                        {stage === "result" && saveStatus !== "success" && (
                            <button
                                type="button"
                                onClick={() => dispatch({ type: "REVIEW_FROM_RESULT" })}
                                className="min-h-11 rounded-lg border border-outline-variant/40 bg-surface-container px-space-md font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                檢視差異預覽
                            </button>
                        )}

                        {stage === "result" && saveStatus === "success" && (
                            <button
                                type="button"
                                onClick={() => dispatch({ type: "REVIEW_FROM_RESULT" })}
                                className="min-h-11 rounded-lg border border-outline-variant/40 bg-surface-container px-space-md font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                檢視差異預覽
                            </button>
                        )}

                        {stage === "result" && saveStatus === "error" && (
                            <button
                                type="button"
                                onClick={handleSynchronize}
                                disabled={!canSynchronize}
                                className="min-h-11 rounded-lg bg-primary-container px-space-md font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                重試同步
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};
