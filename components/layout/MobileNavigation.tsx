'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  LayoutDashboard,
  Layers,
  Sparkles,
  Settings,
  ExternalLink,
  MessageSquareQuote,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sessions', label: 'Topics', icon: Layers },
  { href: '/coach-prompt', label: 'Coach Prompt', icon: MessageSquareQuote },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-[#1c1c1c] border-b border-[#333333] px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-black font-extrabold text-sm">
          S
        </div>
        <span className="text-sm font-bold text-[#ececec]">Speaking Coach</span>
      </Link>

      <div className="flex items-center gap-2">
        <a
          href="https://chatgpt.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-[#262626] border border-[#383838] text-gray-300 hover:text-white"
          title="Open ChatGPT"
          aria-label="Open ChatGPT"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
        </a>

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="p-2 rounded-lg bg-[#262626] border border-[#383838] text-gray-300 hover:text-white focus:outline-none"
          aria-label="Toggle navigation drawer"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-0 top-[53px] z-50 flex flex-col bg-[#1c1c1c] border-b border-[#333333] p-4 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-[#2a2a2a] text-white border border-[#444444]'
                      : 'text-gray-400 hover:text-white hover:bg-[#242424]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[#333333] mt-auto">
            <a
              href="https://chatgpt.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-black font-semibold text-sm shadow-md"
            >
              <Sparkles className="w-4 h-4 text-black" />
              Open ChatGPT in New Tab
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
