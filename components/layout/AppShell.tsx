'use client';

import React from 'react';
import { PracticeProvider, usePractice } from '@/context/PracticeContext';
import { Sidebar } from './Sidebar';
import { AddTopicModal } from '@/components/topics/AddTopicModal';
import { Menu } from 'lucide-react';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { setIsMobileNavOpen } = usePractice();

  return (
    <div className="flex h-screen bg-[#212121] text-[#ececec] overflow-hidden" suppressHydrationWarning>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Right Main Content Panel */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto min-w-0 relative" suppressHydrationWarning>
        {/* Mobile Top Header (hidden on lg+) */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-2.5 bg-[#171717] border-b border-[#2d2d2d] shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-gray-200">Speaking Practice</span>
          <div className="w-8" />
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" suppressHydrationWarning>
          {children}
        </main>
      </div>

      {/* Pop-up Modal when pressing Alt+` */}
      <AddTopicModal />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PracticeProvider>
      <AppShellContent>{children}</AppShellContent>
    </PracticeProvider>
  );
}
