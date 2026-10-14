import type { MonitorImportPreview } from "@/app/actions/user";
import type { PreviewStatus } from "../types";

interface ImportValidationFeedbackProps {
  preview: MonitorImportPreview | null;
  previewError: string | null;
  previewStatus: PreviewStatus;
}

export function ImportValidationFeedback({
  preview,
  previewError,
  previewStatus,
}: ImportValidationFeedbackProps) {
  return (
    <>
      {previewStatus === "loading" && (
        <div
          role="status"
          aria-live="polite"
          className="mb-space-md rounded-lg border border-outline-variant/40 bg-surface-container-low p-space-md font-body-md text-body-md text-on-surface-variant"
        >
          正在由伺服器解析並驗證 CSV，請稍候…
        </div>
      )}

      {previewError && (
        <section
          aria-labelledby="preview-error-title"
          role="alert"
          className="mb-space-md rounded-lg border border-red-200 bg-red-50 p-space-md"
        >
          <h3
            id="preview-error-title"
            className="font-label-md text-label-md font-bold text-red-900"
          >
            無法完成預覽
          </h3>
          <p className="mt-1 break-words font-body-sm text-body-sm text-red-800">
            {previewError}
          </p>
        </section>
      )}

      {!!preview?.importResult.errors.length && (
        <section
          aria-labelledby="import-errors-title"
          role="alert"
          className="mb-space-md rounded-xl border border-red-200 bg-red-50 p-space-md"
        >
          <h3
            id="import-errors-title"
            className="font-label-md text-label-md font-bold text-red-900"
          >
            CSV 驗證未通過，共 {preview.importResult.errors.length} 項錯誤
          </h3>
          <ul className="mt-space-sm space-y-space-sm font-body-sm text-body-sm text-red-800">
            {preview.importResult.errors.map((error, index) => (
              <li
                key={`${error.row}-${error.column ?? "row"}-${index}`}
                className="break-words rounded-lg border border-red-200/70 bg-white/60 p-space-sm"
              >
                <p className="font-medium">{error.message}</p>
                <p className="mt-1 text-red-900">
                  第 {error.row} 列
                  {error.column ? `，欄位：${error.column}` : ""}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-space-sm font-body-sm text-body-sm text-red-900">
            修正 CSV 後重新選檔；驗證有錯誤時不可同步。
          </p>
        </section>
      )}

      {!!preview?.importResult.warnings.length && (
        <section
          aria-labelledby="import-warnings-title"
          role="status"
          className="mb-space-md rounded-lg border border-amber-200 bg-amber-50 p-space-md"
        >
          <h3
            id="import-warnings-title"
            className="font-label-sm text-label-sm font-semibold text-amber-900"
          >
            驗證提醒，共 {preview.importResult.warnings.length} 項
          </h3>
          <ul className="mt-space-sm space-y-space-sm font-body-sm text-body-sm text-amber-900">
            {preview.importResult.warnings.map((warning, index) => (
              <li
                key={`${warning.row}-${warning.column ?? "row"}-${index}`}
                className="break-words rounded-lg border border-amber-200/70 bg-white/60 p-space-sm"
              >
                <p className="font-medium">{warning.message}</p>
                <p className="mt-1">
                  第 {warning.row} 列
                  {warning.column ? `，欄位：${warning.column}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {previewStatus === "complete" &&
        preview &&
        preview.importResult.errors.length === 0 &&
        (!preview.diff || preview.importResult.rows.length === 0) && (
          <div
            role="alert"
            className="mb-space-md rounded-lg border border-amber-200 bg-amber-50 p-space-md font-body-sm text-body-sm text-amber-900"
          >
            沒有可安全預覽的資料差異，無法同步。請確認 CSV 至少有一筆有效資料後重新預覽。
          </div>
        )}
    </>
  );
}
