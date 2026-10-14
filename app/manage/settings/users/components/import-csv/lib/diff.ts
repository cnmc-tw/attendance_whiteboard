import type { MonitorImportPreview } from "@/app/actions/user";
import type { DiffRow } from "../types";

export function toDiffRows(preview: MonitorImportPreview): DiffRow[] {
  if (!preview.diff) return [];

  const { create, update, unchanged, remove } = preview.diff;

  return [
    ...create.map((profile) => ({
      id: `create-${profile.email}`,
      type: "create" as const,
      before: null,
      after: profile,
    })),
    ...update.map(({ current, incoming }) => ({
      id: `update-${current.email}`,
      type: "update" as const,
      before: current,
      after: {
        email: current.email,
        name: incoming.name ?? current.name,
        role: incoming.role,
        class: incoming.class,
      },
    })),
    ...remove.map((profile) => ({
      id: `remove-${profile.email}`,
      type: "remove" as const,
      before: profile,
      after: null,
    })),
    ...unchanged.map((profile) => ({
      id: `unchanged-${profile.email}`,
      type: "unchanged" as const,
      before: profile,
      after: profile,
    })),
  ];
}
