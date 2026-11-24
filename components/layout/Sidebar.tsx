'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePractice } from '@/context/PracticeContext';
import { TopicSelectDropdown } from '@/components/topics/TopicSelectDropdown';
import { TopicFilterDropdown } from '@/components/topics/TopicFilterDropdown';
import { TopicModal } from '@/components/topics/TopicModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditPromptChatModal } from '@/components/sessions/EditPromptChatModal';
import { ORIGINAL_COACH_PROMPT } from '@/lib/coach-prompt';
import { useToast } from '@/components/ui/Toast';
import {
  Sparkles,
  ExternalLink,
  Layers,
  Search,
  LayoutGrid,
  List,
  Pencil,
  X,
  Settings,
  User,
  PanelLeftClose,
  PanelLeft,
  Zap,
  SlidersHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
import { TopicItem } from '@/lib/api-client';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { showSuccess } = useToast();
  const {
    sessions,
    displayTopics,
    searchQuery,
    setSearchQuery,
    selectedTopicFilter,
    setSelectedTopicFilter,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    topicCounts,
    counts,
    handleInstantCreateSession,
    handleAutoAddTopic,
    handleCreateTopic,
    handleUpdateTopic,
    handleDeleteTopic,
    editingTopic,
    setEditingTopic,
    activePromptChatUrl,
    setActivePromptChatUrl,
    isEditPromptOpen,
    setIsEditPromptOpen,
    isMobileNavOpen,
    setIsMobileNavOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
  } = usePractice();

  // User Circle Menu Popover state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<TopicItem | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const collapsedUserMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close user menu on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node) &&
        collapsedUserMenuRef.current &&
        !collapsedUserMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleTopicClick = (topicName: string) => {
    setSelectedTopicFilter(topicName);
    if (pathname !== '/sessions' && pathname !== '/topics') {
      router.push('/sessions');
    }
  };

  const handleQuickCoachPrompt = async () => {
    try {
      await navigator.clipboard.writeText(ORIGINAL_COACH_PROMPT);
      showSuccess('Coach Prompt copied to clipboard!');
    } catch {
      showSuccess('Coach Prompt ready!');
    }
  };

  // User Profile Popover Content
  const userPopoverContent = (
    <div className="w-72 rounded-2xl bg-[#1e1e1e] border border-[#333333] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
      {/* User Account Info */}
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <div className="w-8 h-8 rounded-full bg-[#e05e1b] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
          T
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-white truncate">Toàn Vũ</div>
          <div className="text-[11px] text-gray-400 font-mono truncate">
            toan.vuduc247@gmail.com
          </div>
        </div>
      </div>

      <div className="h-px bg-[#2d2d2d]" />

      {/* Prompt Chat Link Section */}
      <div className="px-2 py-1 space-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">
          Prompt Chat Link
        </span>
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#141414] border border-[#2d2d2d]">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                activePromptChatUrl && activePromptChatUrl.trim().length > 0
                  ? 'bg-emerald-400'
                  : 'bg-gray-500'
              }`}
            />
            <span className="text-xs font-mono text-gray-300 truncate">
              {activePromptChatUrl && activePromptChatUrl.trim().length > 0
                ? activePromptChatUrl
                : 'No prompt link set'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {activePromptChatUrl && activePromptChatUrl.trim().length > 0 && (
              <a
                href={activePromptChatUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded text-gray-400 hover:text-emerald-400 hover:bg-[#222] transition-colors"
                title="Open Prompt Chat"
                aria-label="Open Prompt Chat"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                setIsUserMenuOpen(false);
                setIsEditPromptOpen(true);
              }}
              title="Edit Prompt Chat URL"
              aria-label="Edit Prompt Chat URL"
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#2c2c2c] transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-px bg-[#2d2d2d]" />

      {/* Settings Link */}
      <Link
        href="/settings"
        onClick={() => setIsUserMenuOpen(false)}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-[#282828] transition-colors"
      >
        <Settings className="w-4 h-4 text-gray-400" />
        <span>Settings</span>
      </Link>
    </div>
  );

  // Full Expanded Sidebar Content (Restored layout with full sections from Photo 4)
  const fullSidebarContent = (
    <div className="flex flex-col h-full bg-[#171717] text-[#ececec] select-none">
      {/* 1. Top Bar: Add topic & Sidebar Toggle Buttons */}
      <div className="p-3 border-b border-[#2d2d2d] shrink-0 bg-[#171717] flex items-center justify-between gap-2">
        <TopicSelectDropdown
          topics={displayTopics}
          onSelectTopic={(topicName) => handleInstantCreateSession(topicName)}
          onCreateTopic={handleCreateTopic}
          onUpdateTopic={handleUpdateTopic}
          onDeleteTopic={handleDeleteTopic}
          isGlobalShortcutTarget={true}
        />

        <div className="flex items-center gap-1 shrink-0">
          {/* Desktop Sidebar Toggle / Collapse Button */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(true)}
            className="hidden lg:flex p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#262626] transition-colors cursor-pointer"
            title="Close sidebar (Alt+1)"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>

          {/* Close drawer on mobile */}
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#262626] transition-colors shrink-0"
            aria-label="Close navigation drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Search & Status Filter Section (Moved from Photo 4) */}
      <div className="p-3 border-b border-[#2d2d2d] space-y-2.5 shrink-0 bg-[#141414]">
        {/* Search Input Box */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, notes, or ChatGPT link..."
            className="w-full bg-[#1e1e1e] border border-[#333333] focus:border-gray-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#ececec] placeholder-gray-500 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Status Filters & View Mode Toggle */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#222222] text-gray-400 hover:text-white border border-[#333333]'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('To Do')}
              className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'To Do' || statusFilter === 'PLANNED'
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'bg-[#222222] text-amber-400/80 hover:text-amber-300 border border-[#333333]'
              }`}
            >
              To Do ({counts.toDo})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Doing')}
              className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'Doing' || statusFilter === 'IN_PROGRESS'
                  ? 'bg-blue-500 text-white font-semibold'
                  : 'bg-[#222222] text-blue-400/80 hover:text-blue-300 border border-[#333333]'
              }`}
            >
              Doing ({counts.doing})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Done')}
              className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'Done' || statusFilter === 'COMPLETED'
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'bg-[#222222] text-emerald-400/80 hover:text-emerald-300 border border-[#333333]'
              }`}
            >
              Done ({counts.done})
            </button>
          </div>

          {/* Cards / Table View Toggle */}
          <div className="flex items-center rounded-md bg-[#222222] border border-[#333333] p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Cards view"
              aria-label="Cards view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. FILTER TOPICS Section (Moved from Photo 4 - Scrollable vertical list like ChatGPT chats) */}
      <div className="flex-1 flex flex-col min-h-0 overflow-visible relative">
        {/* Filter Topics Header & Notion Filter Dropdown */}
        <div className="p-3 pb-2 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 text-[10px]">
              <Layers className="w-3 h-3 text-blue-400" />
              Filter Topics
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsCreateTopicOpen(true)}
                className="text-[10px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5 cursor-pointer"
                title="Create New Topic"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
              {selectedTopicFilter !== 'ALL' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const t = displayTopics.find(
                        (item) => item.name.toLowerCase() === selectedTopicFilter.toLowerCase(),
                      );
                      if (t) setEditingTopic(t);
                    }}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-0.5 cursor-pointer"
                    title="Manage Topic"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                    <span>Manage</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTopicFilter('ALL')}
                    className="text-[10px] text-gray-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                    title="Show All Topics"
                  >
                    <X className="w-2.5 h-2.5" />
                    <span>All</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notion Filter Dropdown */}
          <TopicFilterDropdown
            topics={displayTopics}
            selectedTopic={selectedTopicFilter}
            onSelectTopic={(topicName) => handleTopicClick(topicName)}
            onCreateTopic={handleCreateTopic}
            onUpdateTopic={handleUpdateTopic}
            onDeleteTopic={handleDeleteTopic}
            topicCounts={topicCounts}
            totalCount={sessions.length}
          />
        </div>

        {/* Scrollable Topics List (Like ChatGPT chat history list in sidebar) */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 no-scrollbar pb-3">
          {/* All Topics Item */}
          <button
            type="button"
            onClick={() => handleTopicClick('ALL')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
              selectedTopicFilter === 'ALL'
                ? 'bg-[#282828] text-white font-semibold border-l-2 border-white'
                : 'text-gray-300 hover:text-white hover:bg-[#202020]'
            }`}
          >
            <span className="truncate">All Topics</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                selectedTopicFilter === 'ALL'
                  ? 'bg-white text-black'
                  : 'bg-[#2c2c2c] text-gray-400'
              }`}
            >
              {sessions.length}
            </span>
          </button>

          {/* Individual Topics */}
          {displayTopics.map((topic) => {
            const count = topicCounts.get(topic.name.toLowerCase()) || 0;
            const isSelected = selectedTopicFilter.toLowerCase() === topic.name.toLowerCase();

            return (
              <div
                key={topic.id}
                role="button"
                tabIndex={0}
                aria-label={topic.name}
                onClick={() => handleTopicClick(isSelected ? 'ALL' : topic.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTopicClick(isSelected ? 'ALL' : topic.name);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left group ${
                  isSelected
                    ? 'bg-[#282828] text-white font-semibold border-l-2 border-white shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-[#202020]'
                }`}
              >
                <span className="truncate flex-1 pr-1">{topic.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected
                          ? 'bg-white text-black'
                          : 'bg-[#2c2c2c] text-gray-400 group-hover:text-gray-200'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {/* Actions on hover */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTopic(topic);
                      }}
                      className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#343846] transition-colors cursor-pointer"
                      title={`Edit topic "${topic.name}"`}
                      aria-label="Edit topic"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTopicToDelete(topic);
                      }}
                      className="p-1 rounded text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title={`Delete topic "${topic.name}"`}
                      aria-label="Delete topic"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Footer: Circle Icon (Gộp sections from Photo 3: Settings + Prompt Link + Email) */}
      <div className="p-3 border-t border-[#2d2d2d] bg-[#141414] relative shrink-0" ref={userMenuRef}>
        {/* Floating Popover Menu opening upward when Circle Icon is clicked */}
        {isUserMenuOpen && (
          <div className="absolute bottom-full mb-2 left-3">
            {userPopoverContent}
          </div>
        )}

        {/* The Circle Icon Button (ChatGPT profile button) */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[#242424] transition-colors cursor-pointer group"
            title="User & Settings"
            aria-label="User & Settings"
            data-testid="user-circle-btn"
          >
            {/* The Circle Icon */}
            <div className="w-8 h-8 rounded-full bg-[#e05e1b] hover:bg-[#f06e2b] flex items-center justify-center text-white font-bold text-xs shadow-md transition-all shrink-0">
              T
            </div>

            <span className="text-xs font-semibold text-gray-300 group-hover:text-white truncate max-w-[170px]">
              toan.vuduc247@gmail.com
            </span>
          </button>

          {/* Quick Edit Prompt button directly in sidebar DOM so direct access works */}
          <button
            type="button"
            onClick={() => setIsEditPromptOpen(true)}
            title="Edit Prompt Chat URL"
            aria-label="Edit Prompt Chat URL"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#222222] transition-colors cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );

  // Collapsed Sidebar Rail (w-14) - Matches ChatGPT UI in user photo when closed
  const collapsedRailContent = (
    <div className="flex flex-col items-center justify-between h-full py-3 px-1.5 bg-[#171717] text-[#ececec] select-none">
      {/* Top Icons Group */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* 1. Open Sidebar Toggle Button */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(false)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#242424] transition-colors cursor-pointer group"
          title="Open sidebar (Alt+1)"
          aria-label="Open sidebar"
        >
          <PanelLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
        </button>

        {/* 2. New Session Pill (Rounded square box with pencil, matching photo) */}
        <div className="relative">
          <TopicSelectDropdown
            topics={displayTopics}
            onSelectTopic={(topicName) => handleInstantCreateSession(topicName)}
            onCreateTopic={handleCreateTopic}
            onUpdateTopic={handleUpdateTopic}
            onDeleteTopic={handleDeleteTopic}
            collapsed={true}
          />
        </div>

        {/* 3. Search Button (Click expands sidebar and focuses search) */}
        <button
          type="button"
          onClick={() => {
            setIsSidebarCollapsed(false);
            setTimeout(() => searchInputRef.current?.focus(), 100);
          }}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#242424] transition-colors cursor-pointer"
          title="Search (Click to expand)"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* 4. Explore / Sparkles (Open ChatGPT in new tab) */}
        <a
          href="https://chatgpt.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-300 hover:bg-[#242424] transition-colors cursor-pointer"
          title="Open ChatGPT"
          aria-label="Open ChatGPT"
        >
          <Sparkles className="w-5 h-5" />
        </a>

        {/* 5. Quick Coach Prompt (Zap) */}
        <button
          type="button"
          onClick={handleQuickCoachPrompt}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-400 hover:bg-[#242424] transition-colors cursor-pointer"
          title="Copy Coach Prompt to clipboard"
          aria-label="Copy Coach Prompt"
        >
          <Zap className="w-5 h-5" />
        </button>

        {/* 6. Filter Topics (Click expands sidebar) */}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed(false)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#242424] transition-colors cursor-pointer"
          title="Topics & Filters (Click to expand)"
          aria-label="Topics"
        >
          <Layers className="w-5 h-5" />
        </button>

        {/* 7. View Mode Switcher */}
        <button
          type="button"
          onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
            viewMode === 'table'
              ? 'text-blue-400 bg-[#1e2330]'
              : 'text-gray-400 hover:text-white hover:bg-[#242424]'
          }`}
          title={`Switch view mode (Currently ${viewMode === 'cards' ? 'Cards' : 'Table'})`}
          aria-label="View options"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom: User Circle Avatar (Orange circle with "T" matching photo at bottom left) */}
      <div className="relative" ref={collapsedUserMenuRef}>
        {isUserMenuOpen && (
          <div className="fixed bottom-3 left-16">
            {userPopoverContent}
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsUserMenuOpen((prev) => !prev)}
          className="w-9 h-9 rounded-full bg-[#e05e1b] hover:bg-[#f06e2b] flex items-center justify-center text-white font-bold text-xs shadow-md transition-all cursor-pointer ring-1 ring-white/20 active:scale-95"
          title="User & Settings (toan.vuduc247@gmail.com)"
          aria-label="User & Settings"
        >
          <span>T</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (lg+): Full w-72 when open, completely hidden (w-0 / hidden) when closed. No icons when closed. */}
      <aside
        suppressHydrationWarning
        className={`hidden lg:flex flex-col h-screen shrink-0 z-30 transition-all duration-300 ease-in-out border-r border-[#2d2d2d] bg-[#171717] ${
          isSidebarCollapsed ? 'w-0 -translate-x-full border-r-0 overflow-hidden pointer-events-none' : 'w-72'
        }`}
      >
        {!isSidebarCollapsed && fullSidebarContent}
      </aside>

      {/* Mobile Drawer (visible when isMobileNavOpen is true) */}
      {isMobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileNavOpen(false)}
          />

          {/* Drawer Sidebar */}
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {fullSidebarContent}
          </div>
        </div>
      )}

      {/* Edit Prompt Chat Link Modal */}
      <EditPromptChatModal
        isOpen={isEditPromptOpen}
        onClose={() => setIsEditPromptOpen(false)}
        currentUrl={activePromptChatUrl}
        onSave={(newUrl) => setActivePromptChatUrl(newUrl)}
      />

      {/* Edit Topic Modal */}
      {editingTopic && (
        <TopicModal
          isOpen={Boolean(editingTopic)}
          onClose={() => setEditingTopic(null)}
          topic={editingTopic}
          onSave={async (data) => {
            await handleUpdateTopic(editingTopic.id, data);
            setEditingTopic(null);
          }}
          onDelete={async (id) => {
            await handleDeleteTopic(id);
            setEditingTopic(null);
          }}
        />
      )}

      {/* Create Topic Modal */}
      {isCreateTopicOpen && (
        <TopicModal
          isOpen={isCreateTopicOpen}
          onClose={() => setIsCreateTopicOpen(false)}
          onSave={async (data) => {
            const created = await handleCreateTopic(data);
            if (created && 'name' in created) {
              handleTopicClick(created.name);
            }
            setIsCreateTopicOpen(false);
          }}
        />
      )}

      {/* Delete Topic Confirmation Dialog */}
      {topicToDelete && (
        <ConfirmDialog
          isOpen={Boolean(topicToDelete)}
          onClose={() => setTopicToDelete(null)}
          onConfirm={async () => {
            const id = topicToDelete.id;
            const name = topicToDelete.name;
            setTopicToDelete(null);
            await handleDeleteTopic(id);
            if (selectedTopicFilter.toLowerCase() === name.toLowerCase()) {
              setSelectedTopicFilter('ALL');
            }
          }}
          title={`Delete Topic "${topicToDelete.name}"?`}
          message="Are you sure you want to delete this topic?"
          confirmLabel="Delete Topic"
          isDestructive
        />
      )}
    </>
  );
}
