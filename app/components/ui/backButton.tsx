'use client';

import { useRouter } from 'next/navigation';

export function BackButton() {
  const router = useRouter();

  return (
    <button 
      type="button" 
      onClick={() => router.back()}
      className="inline-flex items-center gap-space-xs px-space-lg h-11 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary transition-colors shadow-sm"
    >
      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
      <span>返回上一頁</span>
    </button>
  );
}