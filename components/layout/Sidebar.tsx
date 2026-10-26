'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Settings,
  ExternalLink,
  MessageSquareQuote,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/sessions',
    label: 'Topics',
    icon: Layers,
  },
  {
    href: '/coach-prompt',
    label: 'Coach Prompt',
    icon: MessageSquareQuote,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-[#1c1c1c] border-r border-[#333333] z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-[#333333]">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-extrabold text-base shadow-sm">
          S
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#ececec] tracking-tight">
            Speaking Coach
          </span>
          <span className="text-[10px] text-gray-400 font-medium">Link Manager</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          Practice Menu
        </div>
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
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#2a2a2a] text-white border border-[#444444]'
                  : 'text-gray-400 hover:text-white hover:bg-[#242424]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info & External Quick Link */}
      <div className="p-3 border-t border-[#333333] space-y-2">
        <a
          href="https://chatgpt.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-[#262626] border border-[#383838] text-xs font-medium text-gray-300 hover:text-white hover:border-gray-500 transition-all"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Open ChatGPT
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
        </a>

        <div className="px-3 py-1 flex items-center justify-between text-[11px] text-gray-500">
          <span>Dark Mode (Fixed)</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2a2a] text-gray-400">
            v1.0
          </span>
        </div>
      </div>
    </aside>
  );
}
