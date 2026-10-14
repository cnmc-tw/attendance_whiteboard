import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ChangeType } from "../types";
import { CHANGE_LABELS, CHANGE_STYLES, ROLE_LABELS } from "./labels";

describe("import labels", () => {
  it("provides labels and styles for every diff category and role", () => {
    const changeTypes: ChangeType[] = [
      "create",
      "update",
      "remove",
      "unchanged",
    ];

    for (const type of changeTypes) {
      assert.ok(CHANGE_LABELS[type]);
      assert.ok(CHANGE_STYLES[type]);
    }

    assert.equal(ROLE_LABELS.monitor, "風紀股長");
    assert.equal(ROLE_LABELS.instructor, "教官");
    assert.equal(ROLE_LABELS.supervisor, "管理者");
  });
});
