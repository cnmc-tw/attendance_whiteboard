import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MonitorImportErrorCode } from "@/src/application/errors";
import { getSyncErrorMessage } from "./errors";

describe("getSyncErrorMessage", () => {
  it("maps each known synchronization error to its user-facing message", () => {
    const cases: [MonitorImportErrorCode, string][] = [
      ["UNAUTHORIZED", "登入狀態已失效，請重新登入後再試。"],
      ["FORBIDDEN", "您沒有同步風紀股長名冊的權限。"],
      [
        "INVALID_PROFILE_SYNC_INPUT",
        "同步前再次驗證失敗。請檢查 CSV，重新預覽後再試。",
      ],
      [
        "INVALID_MONITOR_PROFILE",
        "名冊資料不符合風紀股長規則，請修正 CSV 並重新預覽。",
      ],
      [
        "INTERNAL_ERROR",
        "同步時發生伺服器錯誤。請重新預覽名冊狀態後再重試。",
      ],
    ];

    for (const [code, message] of cases) {
      assert.equal(getSyncErrorMessage(code), message);
    }
  });
});
