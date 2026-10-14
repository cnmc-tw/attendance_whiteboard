import type { Role } from "@/src/domain/identity";
import type { ChangeType } from "../types";

export const CHANGE_LABELS: Record<ChangeType, string> = {
  create: "新增",
  update: "修改",
  remove: "移除",
  unchanged: "未變更",
};

export const CHANGE_STYLES: Record<ChangeType, string> = {
  create: "border-green-200 bg-green-50 text-green-800",
  update: "border-blue-200 bg-blue-50 text-blue-800",
  remove: "border-red-200 bg-red-50 text-red-800",
  unchanged: "border-outline-variant/60 bg-surface-container text-secondary",
};

export const ROLE_LABELS: Record<Role, string> = {
  monitor: "風紀股長",
  instructor: "教官",
  supervisor: "管理者",
};
