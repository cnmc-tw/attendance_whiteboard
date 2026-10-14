import React from "react";
import { Role } from "@/src/domain/identity";

interface UserToolbarProps {
  searchQuery: string;
  onSearchChange: React.Dispatch<React.SetStateAction<string>>;
  selectedRole: Role | "all";
  onRoleChange: (role: Role | "all") => void;
  onOpenImportModal: () => void;
  onDownloadTemplate: () => void;
}

export const UserToolbar: React.FC<UserToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedRole,
  onRoleChange,
  onOpenImportModal,
  onDownloadTemplate,
}) => {
  const roleChips: { id: Role | "all"; label: string }[] = [
    { id: "all", label: "全部角色"},
    { id: "monitor", label: "風紀股長"},
    { id: "instructor", label: "教官"},
    { id: "supervisor", label: "管理者"},
  ];

  return (
    <section className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-outline-variant/40 flex flex-col gap-space-md">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
        {/* 搜尋列 */}
        <div className="relative flex-1 max-w-lg">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
            search
          </span>
          <input
            id="searchInput"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜尋姓名、學號/員額代號、班級或公務信箱..."
            className="w-full h-10 pl-10 pr-space-md rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/50"
          />
        </div>

        {/* 匯入 / 匯出專屬操作群組 */}
        <div className="flex items-center gap-space-xs flex-wrap justify-end">
          <button
            id="importCsvBtn"
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-space-xs px-space-md h-10 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md font-semibold transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>匯入 CSV</span>
          </button>
          <button
            id="downloadTemplateBtn"
            type="button"
            onClick={onDownloadTemplate}
            className="inline-flex items-center gap-space-xs px-space-sm h-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">download</span>
            <span>下載格式範本</span>
          </button>
        </div>
      </div>

      {/* 篩選膠囊標籤列 (Role & Status Filters) */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs border-t border-outline-variant/30">
        <div className="flex items-center gap-space-xs flex-wrap" id="roleFilterGroup">
          <span className="font-label-sm text-label-sm text-secondary font-medium mr-1">角色篩選：</span>
          {roleChips.map((chip) => {
            const isActive = selectedRole === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onRoleChange(chip.id)}
                className={`role-chip px-space-sm py-1 rounded-full text-label-sm font-label-sm font-medium cursor-pointer transition-colors ${
                  isActive
                    ? "bg-primary-container text-on-primary shadow-xs"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        
      </div>
    </section>
  );
};
