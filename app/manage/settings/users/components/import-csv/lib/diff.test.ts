import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MonitorImportPreview } from "@/app/actions/user";
import { toDiffRows } from "./diff";

const preview: MonitorImportPreview = {
  importResult: { rows: [], warnings: [], errors: [] },
  diff: {
    create: [
      {
        row: 2,
        email: "new@gs.hs.ntnu.edu.tw",
        class: "701",
        role: "monitor",
        name: "新增",
      },
    ],
    update: [
      {
        current: {
          email: "updated@gs.hs.ntnu.edu.tw",
          name: "舊名",
          role: "monitor",
          class: "701",
        },
        incoming: {
          row: 3,
          email: "updated@gs.hs.ntnu.edu.tw",
          name: null,
          role: "instructor",
          class: null,
        },
      },
    ],
    unchanged: [
      {
        email: "same@gs.hs.ntnu.edu.tw",
        name: "未變更",
        role: "monitor",
        class: "702",
      },
    ],
    remove: [
      {
        email: "removed@gs.hs.ntnu.edu.tw",
        name: "移除",
        role: "monitor",
        class: "703",
      },
    ],
  },
};

describe("toDiffRows", () => {
  it("converts each diff category in the existing display order", () => {
    const rows = toDiffRows(preview);

    assert.deepEqual(
      rows.map(({ id, type }) => [id, type]),
      [
        ["create-new@gs.hs.ntnu.edu.tw", "create"],
        ["update-updated@gs.hs.ntnu.edu.tw", "update"],
        ["remove-removed@gs.hs.ntnu.edu.tw", "remove"],
        ["unchanged-same@gs.hs.ntnu.edu.tw", "unchanged"],
      ],
    );
    assert.equal(rows[0].before, null);
    assert.equal(rows[0].after?.name, "新增");
    assert.equal(rows[1].before?.name, "舊名");
    assert.equal(rows[1].after?.name, "舊名");
    assert.equal(rows[1].after?.role, "instructor");
    assert.equal(rows[1].after?.class, null);
    assert.equal(rows[2].after, null);
    assert.deepEqual(rows[3].before, rows[3].after);
  });

  it("returns an empty list when the preview has no authoritative diff", () => {
    assert.deepEqual(toDiffRows({ ...preview, diff: null }), []);
  });
});
