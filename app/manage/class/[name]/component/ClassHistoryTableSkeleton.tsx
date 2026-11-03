export function ClassHistoryTableSkeleton() {
    return (
        <div className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-sm ring-1 ring-outline-variant/70 animate-pulse">
            {/* Header Skeleton */}
            <div className="px-space-lg py-space-md bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                    <div className="w-5 h-5 bg-surface-container-high rounded" />
                    <div className="h-6 w-52 bg-surface-container-high rounded-md" />
                </div>
                <div className="h-4 w-28 bg-surface-container-high rounded" />
            </div>

            {/* Table Skeleton */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-170 border-collapse">
                    <thead>
                        <tr className="bg-surface-container">
                            <th scope="col" className="px-6 py-3 text-left w-1/4">
                                <div className="h-4 w-12 bg-surface-container-high rounded" />
                            </th>
                            <th scope="col" className="px-6 py-3 text-left w-1/3">
                                <div className="h-4 w-20 bg-surface-container-high rounded" />
                            </th>
                            <th scope="col" className="px-6 py-3 text-left w-1/5">
                                <div className="h-4 w-16 bg-surface-container-high rounded" />
                            </th>
                            <th scope="col" className="px-6 py-3 text-left w-1/5">
                                <div className="h-4 w-16 bg-surface-container-high rounded" />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/60">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <tr key={index}>
                                {/* 日期 */}
                                <td className="whitespace-nowrap px-6 py-4">
                                    <div className="h-5 w-24 bg-surface-container-high rounded" />
                                </td>

                                {/* 回報內容 */}
                                <td className="px-6 py-4">
                                    <div className="h-5 w-36 bg-surface-container-high rounded" />
                                </td>

                                {/* 回報人員 */}
                                <td className="whitespace-nowrap px-6 py-4">
                                    <div className="h-5 w-20 bg-surface-container-high rounded" />
                                </td>

                                {/* 回報時間 */}
                                <td className="whitespace-nowrap px-6 py-4">
                                    <div className="h-5 w-16 bg-surface-container-high rounded" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bottom Button Skeleton */}
            <div className="flex justify-center border-t border-outline-variant/60 bg-surface-container-lowest px-6 py-5">
                <div className="h-10 w-28 rounded-full bg-surface-container-high" />
            </div>
        </div>
    );
}