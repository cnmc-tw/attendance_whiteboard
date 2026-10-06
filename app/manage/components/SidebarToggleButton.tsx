'use client';

import { useMenu } from './NavWrapper';

export default function SidebarToggleButton() {
  const { toggleMenu } = useMenu();

  return (
    <button
      onClick={toggleMenu}
      className="md:hidden p-2 text-on-surface hover:bg-surface-container-high rounded-lg transition-colors focus:outline-none"
      aria-label="開啟選單"
    >
      <span className="material-symbols-outlined">menu</span>
    </button>
  );
}