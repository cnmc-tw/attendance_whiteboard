import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import type { MonitorImportPreview } from "@/app/actions/user";
import { ImportValidationFeedback } from "./ImportValidationFeedback";

function createPreview(
  errors: MonitorImportPreview["importResult"]["errors"],
  warnings: MonitorImportPreview["importResult"]["warnings"] = [],
): MonitorImportPreview {
  return {
    importResult: {
      rows: [],
      errors,
      warnings,
    },
    diff: {
      create: [],
      update: [],
      remove: [],
      unchanged: [],
    },
  };
}

test("lists every validation error with its available row and column context", () => {
  const markup = renderToStaticMarkup(
    <ImportValidationFeedback
      preview={createPreview([
        { row: 2, column: "name", message: "姓名不可空白" },
        { row: 5, message: "班級格式無效" },
      ])}
      previewError={null}
      previewStatus="complete"
    />,
  );

  assert.match(markup, /CSV 驗證未通過，共 2 項錯誤/);
  assert.match(markup, /姓名不可空白/);
  assert.match(markup, /第 2 列/);
  assert.match(markup, /姓名/);
  assert.match(markup, /班級格式無效/);
  assert.match(markup, /第 5 列/);
  assert.equal((markup.match(/<li/g) ?? []).length, 2);
});

test("distinguishes warnings from blocking errors and preserves long messages", () => {
  const longMessage = `資料將被略過。${"請確認欄位內容。".repeat(30)}`;
  const markup = renderToStaticMarkup(
    <ImportValidationFeedback
      preview={createPreview([], [
        { row: 9, message: longMessage },
      ])}
      previewError={null}
      previewStatus="complete"
    />,
  );

  assert.match(markup, /驗證提醒，共 1 項/);
  assert.match(markup, /role="status"/);
  assert.ok(markup.includes(longMessage));
  assert.doesNotMatch(markup, /CSV 驗證未通過/);
});

test("does not invent context when optional validation fields are missing", () => {
  const markup = renderToStaticMarkup(
    <ImportValidationFeedback
      preview={createPreview([{ row: 1, message: "無法辨識資料" }])}
      previewError={null}
      previewStatus="complete"
    />,
  );

  assert.match(markup, /無法辨識資料/);
  assert.match(markup, /第 1 列/);
  assert.doesNotMatch(markup, /欄位：/);
  assert.doesNotMatch(markup, /錯誤代碼/);
  assert.doesNotMatch(markup, /詳細資訊/);
});
