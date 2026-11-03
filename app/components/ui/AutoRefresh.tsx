"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  intervalMs?: number; // 預設刷新時間（微秒）
};

export function AutoRefresh({ intervalMs = 30000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null; // 不需要渲染任何 UI
}