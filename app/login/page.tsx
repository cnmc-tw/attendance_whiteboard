import { SignInWithGoogleButton } from "./components";

import { requireUser } from "@/src/dal/auth";

import { redirect } from "next/navigation";

import Card from "../components/ui"

export const metadata = {
    title: "登入 - 學務處學生缺曠回報",
    description: "登入學生缺曠記錄",
};

type PageProps = {
  searchParams: Promise<{
    redirect_to?: string;
  }>
}

export default async function LoginPage({ searchParams }: PageProps) {

  const { redirect_to } = await searchParams;

  try {
    const user = await requireUser();

    if (user.role === "instructor" || user.role === "supervisor") {
      redirect("/manage");
    } else {
      redirect("/");
    }
  } catch {}


  return (
    <Card>
        {/* Header Block */}
        <div className="text-center mb-8">
            <h1 className="font-headline-lg text-3xl font-extrabold text-primary-container mb-2">
                學務處學生缺曠回報
            </h1>
            <p className="text-on-surface-variant font-body-md">
                本系統為班級出缺勤回報專用平台。<br/>請使用學校信箱登入
            </p>
        </div>
                
        <div className="mt-8 space-y-4">
            <SignInWithGoogleButton redirectUrl={redirect_to || "/"} />
        </div>

        {/* Administrative Contact Section */}
        <div className="mt-6 pt-4 flex items-center justify-between text-secondary border-t border-outline-variant/40">
        <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-primary">
                contact_support
            </span>
            <span className="font-body-sm text-body-sm">
                若無法登入，請洽{" "}
                <span className="font-semibold text-on-surface">
                    生輔組。
                </span>
            </span>
        </div>
        </div>
    </Card>
  );
}
