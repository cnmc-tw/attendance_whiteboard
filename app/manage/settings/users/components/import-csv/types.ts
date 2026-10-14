import type { Role } from "@/src/domain/identity";

export interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onSuccess?: () => void;
}

export type PreviewProfile = {
  email: string;
  name: string | null;
  role: Role;
  class: string | null;
};

export type ChangeType = "create" | "update" | "remove" | "unchanged";
export type DiffRow = {
  id: string;
  type: ChangeType;
  before: PreviewProfile | null;
  after: PreviewProfile | null;
};
export type PreviewStatus = "idle" | "loading" | "complete" | "error";
export type SaveStatus = "idle" | "loading" | "success" | "error";
export type ImportStage = "select" | "review" | "confirm" | "syncing" | "result";
export type DiffFilter = "all" | ChangeType;

export type DiffCounts = Record<ChangeType, number>;
