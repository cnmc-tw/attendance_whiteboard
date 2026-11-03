export function ClassTableSkeleton() {
  const skeletonRows = Array.from({ length: 10 });

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden animate-pulse">
      {/* Header & Filter Controls Skeleton */}
      <div className="px-space-lg py-space-md bg-surface-container-low border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title Skeleton */}
        <div className="flex items-center gap-space-sm">
          <div className="w-5 h-5 bg-surface-container-high rounded" />
          <div className="h-6 w-40 bg-surface-container-high rounded-md" />
        </div>

        {/* Grade Filter Segmented Control Skeleton */}
        <div className="flex p-1 rounded-xl w-full md:w-auto justify-between bg-surface-container-high self-start md:self-auto shadow-sm gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="px-space-md py-1.5 h-8 w-16 bg-surface-container-lowest/50 rounded-lg"
            />
          ))}
        </div>

        {/* Count Label Skeleton */}
        <div className="h-4 w-24 bg-surface-container-high rounded self-start md:self-auto" />
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container border-b border-outline-variant">
              <th className="py-3 px-space-lg w-1/4">
                <div className="h-4 w-16 bg-surface-container-high rounded" />
              </th>
              <th className="py-3 px-space-md w-1/5">
                <div className="h-4 w-16 bg-surface-container-high rounded" />
              </th>
              <th className="py-3 px-space-md w-1/4">
                <div className="h-4 w-20 bg-surface-container-high rounded" />
              </th>
              <th className="py-3 px-space-md w-1/4">
                <div className="h-4 w-28 bg-surface-container-high rounded" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {skeletonRows.map((_, index) => (
              <tr key={index}>
                {/* 班級名稱 */}
                <td className="py-3.5 px-3 md:px-space-lg">
                  <div className="h-5 w-16 bg-surface-container-high rounded" />
                </td>

                {/* 回報狀態 Badge */}
                <td className="py-3.5 px-3 md:px-space-md">
                  <div className="h-6 w-16 bg-surface-container-high rounded" />
                </td>

                {/* 缺席人數 */}
                <td className="py-3.5 px-space-md">
                  <div className="h-5 w-32 bg-surface-container-high rounded" />
                </td>

                {/* 送出時間 / 人員 */}
                <td className="py-3.5 px-space-md">
                  <div className="h-4 w-36 bg-surface-container-high rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}