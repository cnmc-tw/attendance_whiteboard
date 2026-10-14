import type { MonitorImportPreview } from "@/app/actions/user";
import type { ChangeType, DiffCounts, DiffFilter, DiffRow } from "../types";
import { CHANGE_LABELS, CHANGE_STYLES, ROLE_LABELS } from "../lib/labels";

function getDisplayValue(value: string | null): string {
  return value?.trim() || "（空白）";
}

function ChangeBadge({ type }: { type: ChangeType }) {
  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1 rounded-full border px-2.5 py-1 font-label-sm text-label-sm font-semibold ${CHANGE_STYLES[type]}`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
        {type === "create"
          ? "add_circle"
          : type === "update"
            ? "edit"
            : type === "remove"
              ? "delete"
              : "check_circle"}
      </span>
      {CHANGE_LABELS[type]}
    </span>
  );
}

function ProfileField({
  label,
  before,
  after,
  changed,
}: {
  label: string;
  before: string | null;
  after: string | null;
  changed: boolean;
}) {
  if (!changed) {
    return (
      <span className="block min-w-0 break-words text-on-surface">
        {getDisplayValue(after)}
      </span>
    );
  }

  return (
    <span className="flex min-w-0 flex-col gap-1 break-words">
      <span className="text-secondary">
        <span className="font-label-sm text-label-sm">原值：</span>
        {getDisplayValue(before)}
      </span>
      <span className="text-blue-800">
        <span className="font-label-sm text-label-sm">新值：</span>
        {getDisplayValue(after)}
      </span>
      <span className="sr-only">{label}已修改</span>
    </span>
  );
}

function getChangedFields(row: DiffRow) {
  if (row.type !== "update" || !row.before || !row.after) {
    return { name: false, role: false, class: false };
  }

  return {
    name: row.before.name !== row.after.name,
    role: row.before.role !== row.after.role,
    class: row.before.class !== row.after.class,
  };
}

interface ImportDiffPreviewProps {
  hasSafeDiff: boolean;
  preview: MonitorImportPreview | null;
  counts: DiffCounts;
  removeCount: number;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  diffFilter: DiffFilter;
  onDiffFilterChange: (filter: DiffFilter) => void;
  filteredRows: DiffRow[];
  pageRows: DiffRow[];
  firstVisibleRow: number;
  lastVisibleRow: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function ImportDiffPreview({
  hasSafeDiff,
  preview,
  counts,
  removeCount,
  searchQuery,
  onSearchQueryChange,
  diffFilter,
  onDiffFilterChange,
  filteredRows,
  pageRows,
  firstVisibleRow,
  lastVisibleRow,
  totalPages,
  currentPage,
  onPageChange,
}: ImportDiffPreviewProps) {
  return (
    <>
          {hasSafeDiff && preview && (
            <section aria-labelledby="diff-title" className="space-y-space-md">
              <div className="flex flex-col gap-space-sm border-b border-outline-variant/30 pb-space-md sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h3
                    id="diff-title"
                    className="font-headline-sm text-headline-sm font-bold text-on-surface"
                  >
                    名冊差異預覽
                  </h3>
                  <p className="mt-1 break-words font-body-sm text-body-sm text-secondary">
                    共 {preview.importResult.rows.length} 筆 CSV 資料；同步時伺服器會再次驗證並重算差異。
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label="差異筆數">
                  {(Object.keys(CHANGE_LABELS) as ChangeType[]).map((type) => (
                    <span
                      key={type}
                      className={`rounded-full border px-2 py-1 font-label-sm text-label-sm ${CHANGE_STYLES[type]}`}
                    >
                      {CHANGE_LABELS[type]} {counts[type]}
                    </span>
                  ))}
                </div>
              </div>

              {removeCount > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-300 bg-red-50 p-space-md text-red-900"
                >
                  <p className="font-label-md text-label-md font-bold">
                    注意：將從目前名冊移除 {removeCount} 筆風紀股長資料
                  </p>
                  <p className="mt-1 break-words font-body-sm text-body-sm leading-relaxed">
                    這些 Email 不在本次 CSV 中；同步會刪除其風紀股長名冊資料，不只是一般更新。請確認 CSV 已包含所有應保留的風紀股長。
                  </p>
                </div>
              )}

              <div className="grid gap-space-sm sm:grid-cols-[minmax(0,1fr)_14rem]">
                <label className="flex min-w-0 flex-col gap-1 font-label-sm text-label-sm font-medium text-secondary">
                  篩選姓名、Email、班級或身分
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) =>
                      onSearchQueryChange(event.target.value)
                    }
                    placeholder="輸入關鍵字"
                    className="h-11 min-w-0 rounded-lg border border-outline-variant/60 bg-surface-container-low px-space-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                </label>
                <label className="flex min-w-0 flex-col gap-1 font-label-sm text-label-sm font-medium text-secondary">
                  差異類型
                  <select
                    value={diffFilter}
                    onChange={(event) =>
                      onDiffFilterChange(event.target.value as DiffFilter)
                    }
                    className="h-11 min-w-0 rounded-lg border border-outline-variant/60 bg-surface-container-low px-space-sm font-body-md text-body-md text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <option value="all">全部類型</option>
                    <option value="create">新增</option>
                    <option value="update">修改</option>
                    <option value="remove">移除</option>
                    <option value="unchanged">未變更</option>
                  </select>
                </label>
              </div>

              {filteredRows.length === 0 ? (
                <p
                  role="status"
                  className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-space-lg text-center font-body-md text-body-md text-secondary"
                >
                  沒有符合篩選條件的資料。
                </p>
              ) : (
                <>
                  <div className="hidden overflow-x-auto rounded-xl border border-outline-variant/40 md:block">
                    <table className="w-full min-w-[760px] table-fixed text-left font-body-sm text-body-sm">
                      <caption className="sr-only">
                        CSV 匯入前的新增、修改、移除及未變更資料
                      </caption>
                      <thead>
                        <tr className="border-b border-outline-variant/50 bg-surface-container text-label-sm text-label-sm font-semibold text-on-surface-variant">
                          <th scope="col" className="w-28 px-space-sm py-space-sm">
                            狀態
                          </th>
                          <th scope="col" className="w-[27%] px-space-sm py-space-sm">
                            姓名 / Email
                          </th>
                          <th scope="col" className="w-[22%] px-space-sm py-space-sm">
                            身分
                          </th>
                          <th scope="col" className="w-[22%] px-space-sm py-space-sm">
                            班級
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((row) => {
                          const profile = row.after ?? row.before;
                          if (!profile) return null;
                          const changed = getChangedFields(row);
                          return (
                            <tr
                              key={row.id}
                              className="border-b border-outline-variant/30 last:border-b-0"
                            >
                              <td className="px-space-sm py-space-sm align-top">
                                <ChangeBadge type={row.type} />
                              </td>
                              <td className="min-w-0 px-space-sm py-space-sm align-top">
                                <div className="break-words font-semibold text-on-surface">
                                  <ProfileField
                                    label="姓名"
                                    before={row.before?.name ?? null}
                                    after={row.after?.name ?? null}
                                    changed={changed.name}
                                  />
                                </div>
                                <div className="mt-1 break-all text-secondary">
                                  {profile.email}
                                </div>
                              </td>
                              <td className="px-space-sm py-space-sm align-top">
                                <ProfileField
                                  label="身分"
                                  before={
                                    row.before ? ROLE_LABELS[row.before.role] : null
                                  }
                                  after={
                                    row.after ? ROLE_LABELS[row.after.role] : null
                                  }
                                  changed={changed.role}
                                />
                              </td>
                              <td className="px-space-sm py-space-sm align-top">
                                <ProfileField
                                  label="班級"
                                  before={row.before?.class ?? null}
                                  after={row.after?.class ?? null}
                                  changed={changed.class}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <ol
                    aria-label="名冊差異資料"
                    className="space-y-space-sm md:hidden"
                  >
                    {pageRows.map((row) => {
                      const profile = row.after ?? row.before;
                      if (!profile) return null;
                      const changed = getChangedFields(row);
                      return (
                        <li
                          key={row.id}
                          className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-space-sm shadow-xs"
                        >
                          <div className="flex min-w-0 flex-wrap items-start justify-between gap-space-xs">
                            <div className="min-w-0 flex-1">
                              <p className="break-words font-label-md text-label-md font-semibold text-on-surface">
                                <ProfileField
                                  label="姓名"
                                  before={row.before?.name ?? null}
                                  after={row.after?.name ?? null}
                                  changed={changed.name}
                                />
                              </p>
                              <p className="mt-1 break-all font-body-sm text-body-sm text-secondary">
                                {profile.email}
                              </p>
                            </div>
                            <ChangeBadge type={row.type} />
                          </div>
                          <dl className="mt-space-sm grid min-w-0 grid-cols-2 gap-space-sm border-t border-outline-variant/30 pt-space-sm">
                            <div className="min-w-0">
                              <dt className="font-label-sm text-label-sm text-secondary">
                                身分
                              </dt>
                              <dd className="mt-1 break-words">
                                <ProfileField
                                  label="身分"
                                  before={
                                    row.before
                                      ? ROLE_LABELS[row.before.role]
                                      : null
                                  }
                                  after={
                                    row.after
                                      ? ROLE_LABELS[row.after.role]
                                      : null
                                  }
                                  changed={changed.role}
                                />
                              </dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="font-label-sm text-label-sm text-secondary">
                                班級
                              </dt>
                              <dd className="mt-1 break-words">
                                <ProfileField
                                  label="班級"
                                  before={row.before?.class ?? null}
                                  after={row.after?.class ?? null}
                                  changed={changed.class}
                                />
                              </dd>
                            </div>
                          </dl>
                        </li>
                      );
                    })}
                  </ol>

                  <nav
                    aria-label="差異清單分頁"
                    className="flex flex-wrap items-center justify-between gap-space-sm"
                  >
                    <p
                      aria-live="polite"
                      className="font-body-sm text-body-sm text-secondary"
                    >
                      顯示 {firstVisibleRow}–{lastVisibleRow} 筆，共{" "}
                      {filteredRows.length} 筆
                    </p>
                    <div className="flex items-center gap-space-xs">
                      <button
                        type="button"
                        onClick={() =>
                          onPageChange(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage <= 1}
                        className="min-h-11 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-space-sm font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        上一頁
                      </button>
                      <span
                        aria-current="page"
                        className="min-w-16 text-center font-label-sm text-label-sm text-secondary"
                      >
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onPageChange(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage >= totalPages}
                        className="min-h-11 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-space-sm font-label-sm text-label-sm text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        下一頁
                      </button>
                    </div>
                  </nav>
                </>
              )}
            </section>
          )}


    </>
  );
}
