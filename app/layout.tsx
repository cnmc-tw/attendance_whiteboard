import type { Metadata } from "next";
import { ibmPlexSans, inter, notoSansTC } from "@/lib/font";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: "學務處學生出缺勤回報系統",
  description: "生活輔導組及全校班級每日出缺勤填報",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${ibmPlexSans.variable} ${inter.variable} ${notoSansTC.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <SpeedInsights />
      <Analytics />
      <body className="min-h-full flex flex-col bg-surface font-body-md text-on-surface antialiased">
        {children}
      </body>
    </html>
  );
}
