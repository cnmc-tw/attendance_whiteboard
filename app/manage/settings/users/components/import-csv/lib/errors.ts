import type { MonitorImportErrorCode } from "@/src/application/errors";

export function getSyncErrorMessage(error: MonitorImportErrorCode): string {
  switch (error) {
    case "UNAUTHORIZED":
      return "登入狀態已失效，請重新登入後再試。";
    case "FORBIDDEN":
      return "您沒有同步風紀股長名冊的權限。";
    case "INVALID_PROFILE_SYNC_INPUT":
      return "同步前再次驗證失敗。請檢查 CSV，重新預覽後再試。";
    case "INVALID_MONITOR_PROFILE":
      return "名冊資料不符合風紀股長規則，請修正 CSV 並重新預覽。";
    case "INTERNAL_ERROR":
      return "同步時發生伺服器錯誤。請重新預覽名冊狀態後再重試。";
    default:
      return "同步失敗，請重新預覽名冊狀態後再重試。";
  }
}
