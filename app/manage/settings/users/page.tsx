'use client'
import { Role, Profile } from "@/src/domain/identity";

import { useState } from "react";

import { UserToolbar } from "./components/UserToolbar";

import { useUsers } from "@/hooks/use-users";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { AddEditUserModal } from "./components/AddEditUserModal";

import { ImportCsvModal } from "./components/ImportCsvModal";


import Link from "next/link"


export default function UsersManagementPage()  {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState<Role | "all">("all");
    const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);


    const [currentPage, setCurrentPage] =
        useState(1);

    const [selectedIds, setSelectedIds] =
        useState<string[]>([]);

    const debouncedSearch =
        useDebouncedValue(searchQuery, 300);

    

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useUsers({
        search: debouncedSearch || undefined,
        role:
            selectedRole === "all"
                ? undefined
                : [selectedRole],
        sort: "class-asc",
        page: currentPage,
        pageSize: 10,
    });

    const currentPageIds =
        data.items.map((u) => u.auth_user_id) ?? [];

    const isAllSelected =
        currentPageIds.length > 0 &&
        currentPageIds.every((id) =>
            selectedIds.includes(id)
        );

    const totalPages = Math.ceil(
        data.total / data.pageSize
    );

    const roles = new Map([
        ["monitor", "風紀股長"],
        ["instructor", "教官"],
        ["supervisor", "管理者"]
    ]);

    const getErrorMessage = () => {
        if (!error) {
            return null;
        }

        switch (error.type) {
            case "UNAUTHORIZED":
                return "登入狀態已失效，請重新登入。";

            case "FORBIDDEN":
                return "您沒有權限檢視人員資料。";

            case "INVALID_QUERY":
                return "查詢條件無效，請重新嘗試。";

            case "RATE_LIMITED":
                return error.retryAfter > 0
                    ? `請稍後再試，約 ${error.retryAfter} 秒後可以重新載入。`
                    : "請稍後再試。";

            case "UNKNOWN":
                return "載入人員資料時發生錯誤。";
        }
    };

    const handleToggleSelectAll = () => {
        if (currentPageIds.length === 0) {
            return;
        }

        if (isAllSelected) {
            setSelectedIds((prev) =>
                prev.filter(
                    (id) => !currentPageIds.includes(id)
                )
            );
        } else {
            setSelectedIds((prev) =>
                Array.from(
                    new Set([
                        ...prev,
                        ...currentPageIds,
                    ])
                )
            );
        }
    };

    const handleToggleSelectRow = (id: string) => {
        setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleEditUser = (user: Profile) => {
        setUserToEdit(user);
        setIsAddEditModalOpen(true);
    };

    const handleAddUser = () => {
        setUserToEdit(null);
        setIsAddEditModalOpen(true);
    };

    const handleDownloadTemplate = () => {
        alert("正在下載「校園出缺勤人員匯入標準範本 (campus_users_template.csv)」");
    };

    const handleConfirmImport = (file: File | null) => {
        const fileName = file ? file.name : "模擬資料.csv";
        alert(`匯入解析作業中：已成功讀取 [${fileName}]，即將更新全校名冊。`);
    };


    return (
        <div className="w-full flex flex-col gap-space-lg">
            {/* 頂部頁面標題列 */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-sm border-b border-outline-variant/30">
                <div className="flex flex-col gap-space-xs">
                    <nav className="flex items-center gap-space-xs font-label-sm text-label-sm text-secondary tracking-wider uppercase">
                        <Link
                        href="/manage/settings" className="hover:text-primary transition-colors cursor-pointer"
                        >
                        系統管理
                        </Link>
                        <span className="material-symbols-outlined text-[14px] text-outline">
                        chevron_right
                        </span>
                        <span className="text-primary font-semibold">人員資料維護</span>
                    </nav>
                </div>

                {/* 頂部快速操作按鈕 */}
                <button
                    type="button"
                    onClick={handleAddUser}
                    className="inline-flex items-center gap-space-xs px-space-md h-10 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg transition-colors shadow-sm cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>新增人員</span>
                </button>

            </header>

            
            <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/40">
                <UserToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedRole={selectedRole}
                    onRoleChange={setSelectedRole}
                    onDownloadTemplate={handleDownloadTemplate}
                    onOpenImportModal={() => setIsImportModalOpen(true)}
                />
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-md text-body-md" id="personnelTable">
                    <thead>
                        <tr className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase select-none border-b border-outline-variant/50">
                        <th className="py-space-sm pl-space-md pr-space-xs w-10" scope="col">
                            <input
                            id="selectAllCheckbox"
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleToggleSelectAll}
                            aria-label="全選本頁人員"
                            className="rounded accent-primary w-4 h-4 cursor-pointer"
                            />
                        </th>
                        <th className="py-space-sm px-space-md" scope="col">
                            姓名
                        </th>
                        <th className="py-space-sm px-space-md" scope="col">
                            班級
                        </th>
                        <th className="py-space-sm px-space-md" scope="col">
                            身分角色
                        </th>
                        <th className="py-space-sm px-space-md" scope="col">
                            公務信箱 / 帳號
                        </th>
                        <th className="py-space-sm pr-space-md pl-space-xs text-right" scope="col">
                            操作
                        </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                        {error ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-space-xl text-center"
                                >
                                    <div className="flex flex-col items-center gap-space-sm">
                                        <span className="material-symbols-outlined text-error text-[28px]">
                                            error
                                        </span>

                                        <p className="text-on-surface">
                                            {getErrorMessage()}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={refetch}
                                            className="px-space-md py-space-sm rounded-lg bg-primary-container text-on-primary hover:opacity-90 transition-opacity"
                                        >
                                            重新載入
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : isLoading && data.items.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-space-xl text-center text-secondary"
                                >
                                    <div className="flex items-center justify-center gap-space-sm">
                                        <span className="material-symbols-outlined animate-spin text-[20px]">
                                            progress_activity
                                        </span>
                                        <span>載入人員資料中...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.items.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="py-space-xl text-center text-secondary"
                                >
                                    查無符合條件的人員帳號
                                </td>
                            </tr>
                        ) : (
                            data.items.map((user) => {
                                const isSelected =
                                    selectedIds.includes(user.auth_user_id);

                                return (
                                    <tr
                                        key={user.auth_user_id}
                                        className={`hover:bg-surface-container/60 transition-colors group`}
                                    >
                                        <td className="py-space-sm pl-space-md pr-space-xs">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleToggleSelectRow(user.auth_user_id)}
                                            aria-label={`選取 ${user.name}`}
                                            className="row-checkbox rounded accent-primary w-4 h-4 cursor-pointer"
                                        />
                                        </td>

                                        {/* 姓名 */}
                                        <td className="py-space-sm px-space-md">
                                        <span className="font-headline-sm text-label-lg text-on-surface font-semibold">
                                            {user.name}
                                        </span>
                                        </td>

                                        {/* 班級 */}
                                        <td className="py-space-sm px-space-md">
                                        <span className="font-headline-sm text-label-lg text-on-surface font-semibold">
                                            {user.class}
                                        </span>
                                        </td>

                                        {/* 身分角色 */}
                                        <td className="py-space-sm whitespace-nowrap px-space-md">{roles.get(user.role)}</td>


                                        {/* 公務信箱 / 帳號 */}
                                        <td className="py-space-sm px-space-md">
                                        <span className="font-label-md text-label-md text-on-surface">
                                            {user.email}
                                        </span>
                                        </td>

                                        {/* 操作 */}
                                        <td className="py-space-sm pr-space-md pl-space-xs text-right">
                                        <div className="inline-flex items-center gap-1">
                                            <button
                                            type="button"
                                            onClick={() => handleEditUser(user)}
                                            title="更多動作"
                                            className="p-1.5 rounded-lg hover:bg-surface-container text-secondary hover:text-error transition-colors cursor-pointer"
                                            >
                                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                            </button>
                                        </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                    </table>
                </div>

                {/* 表格底部完整分頁器 */}
                <footer className="p-space-md bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-space-md select-none border-t border-outline-variant/30">
                    <div className="flex items-center gap-1">
                    <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        title="上一頁"
                        className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-40 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>

                    {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
                        const pageNum = idx + 1;
                        const isActive = pageNum === currentPage;
                        return (
                        <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg font-label-md text-label-md cursor-pointer transition-colors ${
                            isActive
                                ? "bg-primary-container text-on-primary font-bold shadow-xs"
                                : "bg-surface-container-lowest hover:bg-surface-container text-on-surface"
                            }`}
                        >
                            {pageNum}
                        </button>
                        );
                    })}

                    {totalPages > 5 && <span className="px-1 text-secondary font-label-md">...</span>}
                    {totalPages > 5 && (
                        <button
                        type="button"
                        onClick={() => setCurrentPage(totalPages)}
                        className={`w-8 h-8 rounded-lg font-label-md text-label-md transition-colors cursor-pointer ${
                            currentPage === totalPages
                            ? "bg-primary-container text-on-primary font-bold"
                            : "bg-surface-container-lowest hover:bg-surface-container text-on-surface"
                        }`}
                        >
                        {totalPages}
                        </button>
                    )}

                    <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        title="下一頁"
                        className="w-8 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                    </div>
                </footer>

                {/* 批次匯入 Modal */}
                <ImportCsvModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onConfirmImport={handleConfirmImport}
                    onDownloadTemplate={handleDownloadTemplate}
                />

                {/* 新增/編輯人員 Modal */}
                <AddEditUserModal
                    isOpen={isAddEditModalOpen}
                    userToEdit={userToEdit}
                    onClose={() => setIsAddEditModalOpen(false)}
                />

            </div>
        </div>
    );
};
