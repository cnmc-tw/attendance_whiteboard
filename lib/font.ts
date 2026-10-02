import {
  IBM_Plex_Sans,
  Inter,
  Noto_Sans_TC,
} from "next/font/google";

export const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
  preload: true,
});

export const notoSansTC = Noto_Sans_TC({
  // 注意：移除 subsets 參數以避免 Turbopack 建置失敗
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-tc", // 避免與 inter 的 --font-heading 撞名
  display: "swap",
  preload: true,
});