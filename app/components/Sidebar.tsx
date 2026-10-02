"use client";

import Link from "next/link";

import { SignOutButton } from "./ui";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { name: "首頁", href: "/manage", icon: "home", exact: true },
  { name: "系統設定", href: "/manage/settings", icon: "settings" },
  { name: "人員管理", href: "/manage/settings/users", icon: "manage_accounts" },
];

export default function Sidebar() {

  return (
    <div className="flex flex-col">
      {/* Brand Header */}
      <div className="h-32 px-space-lg flex items-center gap-space-sm border-b border-outline-variant bg-surface-container-lowest">
        <img
          src="/logo.png"
          className="w-16 h-16 rounded-lg"
        />
        <div className="flex flex-col">
          <span className="font-bold text-2xl text-primary leading-tight">
            學務處生輔組
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            學生缺曠回報系統
          </span>
        </div>
      </div>

      {/* Menu Title */}
      <div className="px-space-md py-space-sm">
        <div className="px-space-sm py-space-xs text-label-sm font-label-sm text-outline tracking-wider uppercase">
          系統主選單
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col px-space-sm gap-space-xs">
        {navItems.map((item) => {
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors bg-surface-container-highest text-primary border-l-[3px] border-primary-container font-headline-sm`}
            >
                <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
        );
        })}
      </nav>
      <div className="flex justify-center">
        <SignOutButton />
      </div>
    </div>
  );
}
