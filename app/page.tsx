import { redirect, forbidden } from "next/navigation";
import { getReportConfig } from "./actions";

import { requireUser } from "@/src/dal/auth";
import { UnauthorizedError, ForbiddenError } from "@/src/errors";

import { SignOutButton } from "./components/ui";

import { ReportCard } from "./components/ReportCard";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "每日回報 - 學務處學生出缺勤回報系統",
  description: "生活輔導組及全校班級每日出缺勤填報",
};

export default async function DailyReportPage() {

  let usr

  try {
    const user = await requireUser()
    if (user.role !== "monitor") redirect('/manage');
    usr = user
  } catch(error) {

      if (error instanceof UnauthorizedError) {
        redirect("/login");
      }

      if (error instanceof ForbiddenError) {
        forbidden();
      }
  
      throw error;
  }

  

  const config = await getReportConfig()

  type ReportAvailability = {
      allowed: boolean;
      message?: string;
  };

  function checkReportAvailability(): ReportAvailability {
    const now = new Date()
    const date = now.toLocaleDateString('en-CA')

    if (!config.data) {
      return {
        allowed: false,
        message:`系統尚未啟用`
      }
    }

    if (date < config.data!.semester_start) {
      return {
        allowed: false,
        message: `本學期尚未開始`,
      };
    }

    if (date > config.data!.semester_end) {
      return {
        allowed: false,
        message: `本學期已結束`,
      };
    }

    const day = now.getDay();

    if (day === 0 || day === 6) {
      return {
        allowed: false,
        message: "今日非回報日",
      };
    }

    const time = now.toTimeString().split(' ')[0]

    if (time < config.data!.report_start_time) {
        return {
            allowed: false,
            message: "今日回報尚未開始",
        };
    }

    if (time > config.data!.report_end_time) {
        return {
            allowed: false,
            message: "今日回報時間已結束",
        };
    }

    return {
      allowed: true,
    };
  }

  const allow = checkReportAvailability()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface font-body-md text-on-surface antialiased">
      <main className="w-full">
        <div className="flex flex-col w-full items-center justify-center p-gutter md:p-gutter-desktop relative overflow-hidden">
          {/* Decorative background geometry */}
          <div
            aria-hidden="true"
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-surface-container-high/40 blur-3xl pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary-container/30 blur-3xl pointer-events-none"
          />

          {/* Primary Authentication Container */}
          <div className="relative w-full max-w-120 bg-surface-container-lowest shadow-xl rounded-xl p-6 sm:p-10 transition-all duration-300">
            {/* Header Block */}
            <div className="text-center mb-8">
                <h1 className="font-headline-lg text-3xl font-extrabold text-primary-container mb-2">
                  學務處學生缺曠回報
                </h1>
                <p className="text-on-surface-variant text-2xl">
                  {usr.class}班  
                </p>
            </div>

            {!allow.allowed && (<h1 className="text-2xl text-center text-on-surface mb-space-sm tracking-tight font-bold">
              {allow.message}
            </h1>)}
            
            {allow.allowed && (<ReportCard cooldown_seconds={config.data!.report_cooldown_seconds} />)}
            
            <div className="flex justify-center">
              <SignOutButton />
            </div>
            {/* Footer Inside Card */}
            <div className="mt-8 pt-4 bg-surface-container-high/30 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 p-4 rounded-b-xl flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-2">
              <span className="font-label-sm text-label-sm text-secondary tracking-wider">
                國立師大附中
              </span>
              <span className="font-label-sm text-label-sm text-secondary">
                生活輔導組
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


