import { ClassHistoryTableSkeleton } from "./component";

export default function Loading() {
  return (
    <div className="flex flex-col max-w-5xl animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-md">
        <div className="flex items-center gap-space-xs">
          <div className="h-4 w-24 bg-surface-container-high rounded" />
          <span className="material-symbols-outlined text-[14px] text-outline-variant">
            chevron_right
          </span>
          <div className="h-4 w-16 bg-surface-container-high rounded" />
        </div>
      </div>

      {/* Primary Class Header & Meta Skeleton */}
      <div className="relative bg-surface-container-lowest rounded-xl p-space-lg shadow-sm overflow-hidden mb-space-lg border border-outline-variant">
        <div className="absolute top-0 left-0 bottom-0 w-2 bg-primary-container" />
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-lg pl-space-xs">
          <div className="flex flex-col gap-space-xs w-full">
            {/* Title & Status Badge Skeleton */}
            <div className="flex items-center gap-space-sm flex-wrap">
              <div className="h-7 w-48 bg-surface-container-high rounded-md" />
              <div className="h-6 w-20 bg-surface-container-high rounded" />
            </div>

            {/* Meta Stats Skeleton (Last Updated & Absent Count) */}
            <div className="flex flex-wrap items-center gap-space-sm mt-space-xs">
              <div className="h-7 w-44 bg-surface-container-high rounded" />
              <div className="h-7 w-36 bg-surface-container-high rounded" />
            </div>

            {/* Attendance Breakdown Cards Skeleton */}
            <div className="flex flex-col gap-space-sm mt-space-xs max-w-sm">
              <div className="h-7 w-full bg-surface-container-high rounded" />
              <div className="h-7 w-full bg-surface-container-high rounded" />
              <div className="h-7 w-full bg-surface-container-high rounded" />
              <div className="h-7 w-full bg-surface-container-high rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Roster & Attendance History Table Skeleton */}
      <ClassHistoryTableSkeleton />
    </div>
  );
}