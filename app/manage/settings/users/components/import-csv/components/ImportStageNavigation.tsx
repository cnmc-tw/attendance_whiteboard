import type { Ref, ReactNode } from "react";
import type { ImportStage } from "../types";

const stages: { id: ImportStage; label: string }[] = [
  { id: "select", label: "選擇檔案" },
  { id: "review", label: "檢視預覽" },
  { id: "confirm", label: "確認同步" },
  { id: "syncing", label: "同步中" },
  { id: "result", label: "結果" },
];

export function ImportStageNavigation({ stage }: { stage: ImportStage }) {
  const currentIndex = stages.findIndex((item) => item.id === stage);

  return (
    <nav aria-label="匯入步驟" className="mb-space-lg">
      <ol className="grid grid-cols-5 gap-1 sm:gap-space-sm">
        {stages.map((item, index) => {
          const isCurrent = item.id === stage;
          const isComplete = index < currentIndex;

          return (
            <li
              key={item.id}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 text-center ${
                isCurrent
                  ? "font-label-sm text-label-sm font-semibold text-primary"
                  : isComplete
                    ? "font-label-sm text-label-sm font-medium text-on-surface"
                    : "font-label-sm text-label-sm text-secondary"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  isCurrent
                    ? "border-primary bg-primary text-on-primary"
                    : isComplete
                      ? "border-primary/40 bg-primary-fixed text-primary"
                      : "border-outline-variant bg-surface-container text-secondary"
                }`}
              >
                {isComplete ? (
                  <span className="material-symbols-outlined text-[17px]">
                    check
                  </span>
                ) : (
                  index + 1
                )}
              </span>
              <span className="break-words">{item.label}</span>
              <span className="sr-only">
                {isCurrent ? "目前步驟" : isComplete ? "已完成" : "尚未完成"}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function ImportStagePanel({
  stage,
  panelRef,
  children,
}: {
  stage: ImportStage;
  panelRef: Ref<HTMLElement>;
  children: ReactNode;
}) {
  const label = stages.find((item) => item.id === stage)?.label ?? "匯入";

  return (
    <section
      ref={panelRef}
      role="region"
      aria-label={label}
      tabIndex={-1}
      className="rounded-lg focus-visible:outline-none"
    >
      {children}
    </section>
  );
}
