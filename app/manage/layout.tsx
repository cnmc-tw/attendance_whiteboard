import React from "react";

import NavWrapper from "../components/NavWrapper";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import { requireInstructor } from "@/src/dal/auth";
import { UnauthorizedError, ForbiddenError } from "@/src/errors";

import { forbidden, unauthorized } from "next/navigation";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "管理後臺 - 學務處學生出缺勤回報系統",
  description: "生活輔導組及全校班級每日出缺勤填報",
};


export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await requireInstructor();
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
      <div className="min-h-screen bg-surface">
        <NavWrapper sidebar={<Sidebar />}>
          <Header />
          <main className="pl-0 md:pl-72 pt-16 w-full min-h-screen bg-surface">
            <div className="max-w-310 mx-auto p-4 sm:p-space-md md:p-space-xl">{children}</div>
          </main>
        </NavWrapper>
      </div>
    );
}
