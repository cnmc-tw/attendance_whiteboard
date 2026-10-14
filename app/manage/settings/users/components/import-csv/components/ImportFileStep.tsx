import type { ChangeEventHandler, DragEventHandler, Dispatch, SetStateAction } from "react";
import type { PreviewStatus } from "../types";

interface ImportFileStepProps {
  selectedFile: File | null;
  isBusy: boolean;
  isDraggingFile: boolean;
  previewStatus: PreviewStatus;
  setIsDraggingFile: Dispatch<SetStateAction<boolean>>;
  handleFileDrop: DragEventHandler<HTMLDivElement>;
  handleFileChange: ChangeEventHandler<HTMLInputElement>;
  handlePreview: () => void;
  onDownloadTemplate: () => void;
}

export function ImportFileStep(props: ImportFileStepProps) {
  const { selectedFile, isBusy, isDraggingFile, previewStatus, setIsDraggingFile, handleFileDrop, handleFileChange, handlePreview, onDownloadTemplate } = props;

  return (
    <>
          <div className="mb-space-md grid gap-space-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div
              onDragOver={(event) => {
                event.preventDefault();
                if (!isBusy) setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleFileDrop}
              className={`min-w-0 rounded-xl border-2 border-dashed p-space-md transition-colors sm:p-space-lg ${
                isDraggingFile
                  ? "border-primary bg-primary-fixed/40"
                  : "border-outline-variant/60 bg-surface-container-low hover:bg-surface-container"
              }`}
            >
              <label
                htmlFor="monitor-import-file"
                className="flex cursor-pointer flex-col items-center justify-center gap-space-xs text-center focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              >
                <input
                  id="monitor-import-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isBusy}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[38px] text-primary"
                >
                  cloud_upload
                </span>
                <span className="max-w-full break-all font-label-lg text-label-lg font-semibold text-on-surface">
                  {selectedFile
                    ? `已選取：${selectedFile.name}`
                    : "點擊選取或拖曳 CSV 檔案至此"}
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  僅支援 .csv，UTF-8 編碼，檔案大小上限 5MB
                </span>
                <span className="mt-space-xs inline-flex min-h-10 items-center rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-space-md font-label-sm text-label-sm font-semibold text-primary shadow-xs">
                  瀏覽本機檔案
                </span>
              </label>
            </div>
          </div>

          <section
            aria-label="CSV 格式說明"
            className="mb-space-lg flex items-start gap-space-sm rounded-lg border border-outline-variant/30 bg-surface-container p-space-sm text-secondary"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined mt-0.5 shrink-0 text-[18px] text-outline"
            >
              info
            </span>
            <div className="min-w-0 font-body-sm text-body-sm leading-relaxed">
              <p>
                標題列需包含{" "}
                <code className="break-all rounded bg-surface-container-lowest px-1 font-mono text-on-surface">
                  email, class, role, name
                </code>
                （順序可調）。                                角色與班級欄位由伺服器依匯入規則驗證；風紀股長需填三位數班級代碼，其他角色班級欄位留白。
              </p>
              <button
                type="button"
                onClick={onDownloadTemplate}
                className="mt-1 min-h-10 text-left font-label-sm text-label-sm font-semibold text-primary underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                下載 CSV 格式範本
              </button>
            </div>
          </section>
    </>
  );
}
