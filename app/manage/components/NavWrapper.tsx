'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// 1. 建立開關選單的 Context
const MenuContext = createContext<{
  isOpen: boolean;
  toggleMenu: () => void;
  closeMenu: () => void;
}>({
  isOpen: false,
  toggleMenu: () => {},
  closeMenu: () => {},
});

export const useMenu = () => useContext(MenuContext);

export default function NavWrapper({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <MenuContext.Provider value={{ isOpen, toggleMenu, closeMenu }}>
      {/* 背景遮罩 (手機版專用) */}
      <div
        onClick={closeMenu}
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 側邊欄容器：根據 isOpen 切換滑出滑入 */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-40  bg-surface-container-low border-r border-outline-variant flex flex-col justify-between select-none transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        
        {sidebar}
      </div>

      {/* 頁面的其餘部分 (包含 Header 與 Main) */}
      {children}
    </MenuContext.Provider>
  );
}