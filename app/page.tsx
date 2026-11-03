// app/daily-report/page.tsx
import { Suspense } from "react";
import { redirect, forbidden } from "next/navigation";
import { requireUser } from "@/src/dal/auth";
import { UnauthorizedError, ForbiddenError } from "@/src/application/errors";
import Card, { SignOutButton } from "./components/ui";
import { ReportSection } from "./components/ReportSection";

function ReportSkeleton() {
    return (
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse my-4 flex items-center justify-center">
            <span className="text-gray-400">載入中...</span>
        </div>
    );
}

export default async function DailyReportPage() {
    let usr;
    try {
        usr = await requireUser();
    } catch (error) {
        if (error instanceof UnauthorizedError) redirect("/login");
        if (error instanceof ForbiddenError) forbidden();
        throw error;
    }

    if (usr.role !== "monitor") redirect("/manage");

    return (
        <Card>
            {/* 1. 外頁與標題：秒開直接渲染 */}
            <div className="text-center mb-8">
                <h1 className="font-headline-lg text-3xl font-extrabold text-primary-container mb-2">
                    學務處學生缺曠回報
                </h1>
                <p className="text-on-surface-variant text-2xl">
                    {usr.class}班
                </p>
            </div>

            {/* 2. 資料密集區塊：使用 Suspense 達成獨立 Streaming */}
            <Suspense fallback={<ReportSkeleton />}>
                <ReportSection userClass={usr.class} />
            </Suspense>

            {/* 3. 靜態操作按鈕：秒開直接渲染 */}
            <div className="flex justify-center mt-6">
                <SignOutButton />
            </div>
        </Card>
    );
}