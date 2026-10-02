import React from "react";




import { requireSupervisor } from "@/src/dal/auth";
import { UnauthorizedError, ForbiddenError } from "@/src/errors";

import { forbidden, unauthorized } from "next/navigation";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "系統設定 - 學務處學生出缺勤回報系統",
  description: "生活輔導組及全校班級每日出缺勤填報",
};

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await requireSupervisor();
  } catch(error) {

      if (error instanceof UnauthorizedError) {
        unauthorized();
      }

      if (error instanceof ForbiddenError) {
        forbidden();
      }

      throw error;
  }
  
  return (
      <>
        {children}
      </>
    );
}
