import { redirect, forbidden } from "next/navigation";
import { getReportConfig } from "./actions";

import { requireUser } from "@/src/dal/auth";
import { UnauthorizedError, ForbiddenError } from "@/src/application/errors";

import Card, { SignOutButton } from "./components/ui";

import { ReportCard } from "./components/ReportForms";

import { Metadata } from "next";

import { AppTime } from "@/shared/time";

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
    const date = AppTime.date();
    const day = AppTime.day();
    const time = AppTime.time();

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

    if (day === 0 || day === 6) {
      return {
        allowed: false,
        message: "今日非回報日",
      };
    }

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
    <Card>
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
    </Card>
  );
}


