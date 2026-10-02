import React, { useState } from "react";

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (file: File | null) => void;
  onDownloadTemplate: () => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport,
  onDownloadTemplate,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleConfirm = () => {
    onConfirmImport(selectedFile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs">
      <div className="bg-surface-container-lowest rounded-xl shadow-xl max-w-xl w-full p-space-lg flex flex-col gap-space-md border border-outline-variant/60 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-space-xs border-b border-outline-variant/30">
          <div className="flex items-center gap-space-sm">
            <span className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
            </span>
            <h2 className="font-headline-md text-headline-md text-primary font-bold">
              批次匯入人員資料 (CSV)
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

        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          請使用標準 CSV 格式進行批次匯入。若帳號已存在，系統將自動比對學號/員額代號更新其負責班級與職務權限。
        </p>

        {/* 拖曳與選檔區 */}
        <label className="p-space-xl rounded-xl bg-surface-container-low border-2 border-dashed border-outline-variant/60 flex flex-col items-center justify-center gap-space-sm cursor-pointer hover:bg-surface-container transition-all text-center">
          <input
            type="file"
            accept=".csv, .xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="material-symbols-outlined text-[48px] text-primary">cloud_upload</span>
          <div className="flex flex-col items-center">
            <span className="font-label-lg text-label-lg text-on-surface font-semibold">
              {selectedFile ? `已選取：${selectedFile.name}` : "點擊或拖曳 CSV 檔案至此"}
            </span>
            <span className="font-body-sm text-body-sm text-secondary mt-1">
              支援 .csv, .xlsx 編碼為 UTF-8 之試算表 (檔案大小 &lt; 5MB)
            </span>
          </div>
          <span className="mt-space-xs px-space-md py-1.5 rounded-lg bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold shadow-xs border border-outline-variant/30">
            瀏覽本機檔案
          </span>
        </label>

        {/* 注意事項提醒 */}
        <div className="p-space-sm rounded-lg bg-surface-container flex items-start gap-space-xs text-secondary font-body-sm text-body-sm border border-outline-variant/30">
          <span className="material-symbols-outlined text-[18px] text-outline shrink-0 mt-0.5">
            info
          </span>
          <span>
            提示：欄位需包含 [姓名], [身分], [班級代碼], [電子信箱], [學號/識別碼]。可點選{" "}
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="text-primary font-semibold underline cursor-pointer"
            >
              「下載格式範本」
            </button>{" "}
            取得空白表格。
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-space-md h-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer border border-outline-variant/40"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-space-md h-10 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md font-semibold transition-colors shadow-sm cursor-pointer"
          >
            開始驗證並匯入
          </button>
        </div>
      </div>
    </div>
  );
};
