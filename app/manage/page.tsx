import Dashboard from "./[date]/page"
import { AppTime } from "@/shared/time";

export default async function Page() {
  // 將 params 包裹成 Promise 傳入 Dashboard
  return await Dashboard({
    params: Promise.resolve({ date: AppTime.date() })
  });
}