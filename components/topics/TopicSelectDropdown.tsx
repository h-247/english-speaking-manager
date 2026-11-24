'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TopicItem } from '@/lib/api-client';
import { TopicModal } from '@/components/topics/TopicModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ChevronDown,
  Sparkles,
  Search,
  SquarePen,
} from 'lucide-react';

export interface TopicSelectDropdownProps {
  topics: TopicItem[];
  onSelectTopic: (topicName: string) => Promise<void> | void;
  onCreateTopic: (data: { name: string; color: string; icon: string; description?: string }) => Promise<TopicItem | void>;
  onUpdateTopic: (id: string, data: { name?: string; color?: string; icon?: string; description?: string }) => Promise<void>;
  onDeleteTopic: (id: string) => Promise<void>;
  collapsed?: boolean;
  triggerLabel?: string;
  triggerClassName?: string;
  showChevron?: boolean;
  align?: 'left' | 'center' | 'right';
  isGlobalShortcutTarget?: boolean;
}

let lastAddTopicTime = 0;

export function TopicSelectDropdown({
  topics,
  onSelectTopic,
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
  collapsed = false,
  triggerLabel,
  triggerClassName,
  showChevron = true,
  align = 'left',
  isGlobalShortcutTarget = false,
}: TopicSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<TopicItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen for global shortcut (Alt+`) to open/toggle Add Topic dropdown in sidebar only
  useEffect(() => {
    if (!isGlobalShortcutTarget) return;
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener('toggle_add_topic_dropdown', handleToggle);
    return () => window.removeEventListener('toggle_add_topic_dropdown', handleToggle);
  }, [isGlobalShortcutTarget]);



  // Close on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filtered topics based on search
  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return topics;
    return topics.filter((t) => t.name.toLowerCase().includes(query));
  }, [topics, search]);

  const hasExactMatch = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return false;
    return topics.some((t) => t.name.toLowerCase() === query);
  }, [topics, search]);

  const handleSelect = async (topicName: string) => {
    try {
      await onSelectTopic(topicName);
    } finally {
      setIsOpen(false);
      setSearch('');
    }
  };

  const handleCreateFromSearch = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    try {
      await onCreateTopic({
        name: trimmed,
        color: '',
        icon: '',
      });
      await onSelectTopic(trimmed);
    } catch {
      // error handled by caller
    } finally {
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button: Collapsed square pill in Rail, single button, or + Add topic with chevron */}
      {collapsed ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-[#262626] border border-[#333333] transition-colors cursor-pointer select-none active:scale-95"
          title="Add topic (Alt+`)"
          aria-label="Add topic"
        >
          <SquarePen className="w-4 h-4 text-gray-300" />
          <span className="sr-only">Add topic</span>
        </button>
      ) : showChevron === false ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={
            triggerClassName ||
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-gray-200 shadow-sm transition-colors cursor-pointer select-none active:scale-95'
          }
          title={triggerLabel || 'Add Topic'}
          aria-label={triggerLabel || 'Add Topic'}
        >
          <Plus className="w-4 h-4 text-black" />
          <span>{triggerLabel || 'Add Topic'}</span>
        </button>
      ) : (
        <div className="inline-flex items-center rounded-lg bg-white text-black shadow-sm select-none border border-transparent overflow-hidden">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1.5 text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer active:scale-95"
            title={`${triggerLabel || 'Add topic'} (Alt+\`)`}
            aria-label={triggerLabel || 'Add topic'}
          >
            <Plus className="w-3.5 h-3.5 text-black" />
            <span>{triggerLabel || 'Add topic'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="pl-0.5 pr-2 py-1.5 hover:bg-gray-200 transition-colors cursor-pointer text-black flex items-center justify-center active:scale-95"
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label="Open topic options"
            title="Open topic options"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 text-black transition-transform duration-150 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      )}

      {/* Notion-Style Popover Menu (Matching Photo) */}
      {isOpen && (
        <div
          className={`absolute ${
            collapsed
              ? 'left-full ml-3 top-0 w-72 sm:w-80'
              : align === 'center'
              ? 'left-1/2 -translate-x-1/2 mt-2 w-72 sm:w-80'
              : 'left-0 mt-2 w-[264px] max-w-[calc(100vw-2rem)]'
          } rounded-xl bg-[#1c1d22] border border-[#2e313b] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col`}
        >
          {/* Top Search Input Box (Matching photo: "Search for an option...") */}
          <div className="p-2 border-b border-[#2b2e38] flex items-center gap-2 bg-[#17181c]">
            <Search className="w-3.5 h-3.5 text-gray-400 ml-1.5 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for an option..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredTopics.length > 0 && hasExactMatch) {
                    handleSelect(filteredTopics[0].name);
                  } else if (search.trim()) {
                    handleCreateFromSearch();
                  }
                }
              }}
              className="w-full bg-transparent text-xs text-gray-100 placeholder-gray-400 outline-none pr-2 py-1"
              aria-label="Search for an option..."
            />
          </div>

          {/* Subheader (Matching photo: "Select an option or create one") */}
          <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-[11px] font-semibold text-gray-400">
            <span>Select an option or create one</span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsCreateModalOpen(true);
              }}
              className="text-[10px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer flex items-center gap-0.5"
            >
              <Plus className="w-3 h-3" />
              New Topic
            </button>
          </div>

          {/* Options List with 6-dot drag handles and colored pills */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
            {/* Create option if search does not match existing */}
            {search.trim().length > 0 && !hasExactMatch && (
              <button
                type="button"
                onClick={handleCreateFromSearch}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left hover:bg-[#252832] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GripVertical className="w-3.5 h-3.5 text-gray-500 opacity-60 group-hover:opacity-100 shrink-0" />
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#2563eb] text-white truncate shadow-sm">
                    <Plus className="w-3 h-3" />
                    Create &quot;{search.trim()}&quot;
                  </span>
                </div>
              </button>
            )}

            {/* List of existing topics */}
            {filteredTopics.map((topic) => {
              return (
                <div
                  key={topic.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#252832] transition-colors group cursor-pointer"
                  onClick={() => handleSelect(topic.name)}
                >
                  {/* Left: 6 dots drag handle + neutral tag */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <GripVertical className="w-3.5 h-3.5 text-gray-500 opacity-60 group-hover:opacity-100 shrink-0" />
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-[#272a33] text-gray-200 border border-[#3b4150] truncate shadow-sm select-none"
                      title={topic.name}
                    >
                      <span className="truncate">{topic.name}</span>
                    </span>
                  </div>

                  {/* Right Actions: Edit / Delete on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTopic(topic);
                        setIsOpen(false);
                      }}
                      className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#343846] transition-colors cursor-pointer"
                      title="Edit topic"
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
                      title="Delete topic"
                      aria-label="Delete topic"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTopics.length === 0 && !search.trim() && (
              <div className="py-4 text-center text-xs text-gray-500">
                No topics available.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Topic Confirmation Dialog */}
      {topicToDelete && (
        <ConfirmDialog
          isOpen={Boolean(topicToDelete)}
          onClose={() => setTopicToDelete(null)}
          onConfirm={async () => {
            const id = topicToDelete.id;
            setTopicToDelete(null);
            await onDeleteTopic(id);
          }}
          title={`Delete Topic "${topicToDelete.name}"?`}
          message="Are you sure you want to delete this topic?"
          confirmLabel="Delete Topic"
          isDestructive
        />
      )}

      {/* Edit Topic Modal */}
      {editingTopic && (
        <TopicModal
          isOpen={Boolean(editingTopic)}
          topic={editingTopic}
          onClose={() => setEditingTopic(null)}
          onSave={async (data) => {
            await onUpdateTopic(editingTopic.id, data);
            setEditingTopic(null);
          }}
          onDelete={async (id) => {
            await onDeleteTopic(id);
            setEditingTopic(null);
          }}
        />
      )}

      {/* Create New Topic Modal */}
      {isCreateModalOpen && (
        <TopicModal
          isOpen={isCreateModalOpen}
          initialName={search.trim()}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={async (data) => {
            const created = await onCreateTopic(data);
            setIsCreateModalOpen(false);
            const topicName = created && 'name' in created ? created.name : data.name;
            onSelectTopic(topicName);
          }}
        />
      )}
    </div>
  );
}
