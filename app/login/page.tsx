import { SignInWithGoogleButton } from "./components";

import { requireUser } from "@/src/dal/auth";


import { redirect } from "next/navigation";

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
                <p className="text-on-surface-variant font-body-md">
                  本系統為校內行政與班級出缺勤回報專用平台。請使用學校公務信箱登入
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
                  若無法登入或，請洽{" "}
                  <span className="font-semibold text-on-surface">
                    生輔組。
                  </span>
                </span>
              </div>
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
