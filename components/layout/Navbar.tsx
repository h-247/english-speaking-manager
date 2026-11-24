'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Settings,
  Link2,
  Pencil,
  GraduationCap,
  Menu,
  X,
  User,
} from 'lucide-react';
import { EditPromptChatModal, DEFAULT_PROMPT_CHAT_URL } from '@/components/sessions/EditPromptChatModal';

export const NAV_ITEMS = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/topics',
    label: 'Topics',
    icon: Layers,
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePromptChatUrl, setActivePromptChatUrl] = useState<string>('');
  const [isEditPromptOpen, setIsEditPromptOpen] = useState(false);

  useEffect(() => {
    const updateUrl = () => {
      try {
        const stored = localStorage.getItem('prompt_chat_url');
        if (stored !== null) {
          setActivePromptChatUrl(stored);
        } else {
          const shared = localStorage.getItem('shared_prompt_url');
          setActivePromptChatUrl(shared || '');
        }
      } catch {}
    };
    updateUrl();
    window.addEventListener('storage', updateUrl);
    window.addEventListener('prompt_chat_url_changed', updateUrl);
    return () => {
      window.removeEventListener('storage', updateUrl);
      window.removeEventListener('prompt_chat_url_changed', updateUrl);
    };
  }, []);

  // Close drawer on path change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isNavActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/topics') return pathname.startsWith('/topics') || pathname.startsWith('/sessions');
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#17191d] border-b border-[#2b303c] backdrop-blur-md select-none" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black shadow-md group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5 text-black" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-[#ececec] tracking-tight group-hover:text-white transition-colors">
                English Speaking Manager
              </span>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#252830] text-gray-400 border border-[#3b4250] font-medium">
                Personal Edition
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Main Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#272b35] text-white border border-[#3e4657] shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-[#20232a]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions & User Pills matching screenshot */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Prompt Chat Link with Edit Button (matching https://github.com/h-247/english-grammar-quiz) */}
          <div
            className={`flex items-center rounded-lg p-0.5 shadow-sm border ${
              activePromptChatUrl && activePromptChatUrl.trim().length > 0
                ? 'bg-[#132c1e] border-[#1e5233] text-emerald-400'
                : 'bg-[#232732] border-[#394050] text-gray-400'
            }`}
          >
            {activePromptChatUrl && activePromptChatUrl.trim().length > 0 ? (
              <a
                href={activePromptChatUrl}
                target="_blank"
                rel="noreferrer"
                title={`Open Prompt Chat: ${activePromptChatUrl}`}
                className="p-1.5 rounded transition-colors flex items-center justify-center hover:text-emerald-300 hover:bg-[#1a3827]"
              >
                <Link2 className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditPromptOpen(true)}
                title="Add Prompt Chat URL"
                className="p-1.5 rounded transition-colors flex items-center justify-center hover:text-gray-200 hover:bg-[#2e3342] cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Edit Prompt Chat Link Button */}
            <button
              type="button"
              onClick={() => setIsEditPromptOpen(true)}
              title="Edit Prompt Chat URL"
              aria-label="Edit Prompt Chat URL"
              className={`p-1.5 rounded transition-colors cursor-pointer border-l ${
                activePromptChatUrl && activePromptChatUrl.trim().length > 0
                  ? 'border-[#1e5233] hover:text-emerald-300 hover:bg-[#1a3827]'
                  : 'border-[#394050] hover:text-gray-200 hover:bg-[#2e3342]'
              }`}
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>

          {/* User Email Pill (matching screenshot toan.vuduc247@gmail.com) */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-gray-400 pl-2 border-l border-[#2e3340]">
            <div className="w-6 h-6 rounded-full bg-[#272b35] border border-[#394050] flex items-center justify-center text-[10px] text-gray-300 font-bold">
              <User className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <span className="font-mono text-gray-300 truncate max-w-[180px]">toan.vuduc247@gmail.com</span>
          </div>

          {/* Mobile Navigation Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg bg-[#20232a] border border-[#333947] text-gray-300 hover:text-white focus:outline-none transition-colors"
            aria-label="Toggle navigation drawer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-[#1a1c20] border-b border-[#2b303c] px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isNavActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-[#272b35] text-white border border-[#3e4657]'
                      : 'text-gray-400 hover:text-white hover:bg-[#20232a]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-[#2b303c] flex items-center justify-between gap-2">
            <div className="text-[11px] text-gray-400 font-mono truncate">
              toan.vuduc247@gmail.com
            </div>
          </div>
        </div>
      )}

      {/* Edit Prompt Chat Link Modal (matching https://github.com/h-247/english-grammar-quiz) */}
      <EditPromptChatModal
        isOpen={isEditPromptOpen}
        onClose={() => setIsEditPromptOpen(false)}
        currentUrl={activePromptChatUrl}
        onSave={(newUrl) => setActivePromptChatUrl(newUrl)}
      />
    </header>
  );
}
