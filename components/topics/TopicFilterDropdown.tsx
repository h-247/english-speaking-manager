'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TopicItem } from '@/lib/api-client';
import { TopicModal } from '@/components/topics/TopicModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  GripVertical,
  ChevronDown,
  Search,
  Check,
  X,
  Filter,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react';

export interface TopicFilterDropdownProps {
  topics: TopicItem[];
  selectedTopic: string; // 'ALL' or topic name
  onSelectTopic: (topicName: string) => void;
  onCreateTopic?: (data: { name: string; color: string; icon: string; description?: string }) => Promise<TopicItem | void>;
  onUpdateTopic?: (id: string, data: { name?: string; color?: string; icon?: string; description?: string }) => Promise<void>;
  onDeleteTopic?: (id: string) => Promise<void>;
  topicCounts?: Map<string, number>;
  totalCount?: number;
}

export function TopicFilterDropdown({
  topics,
  selectedTopic,
  onSelectTopic,
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
  topicCounts,
  totalCount = 0,
}: TopicFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<TopicItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const activeTopicItem = useMemo(() => {
    if (selectedTopic === 'ALL') return null;
    return topics.find((t) => t.name.toLowerCase() === selectedTopic.toLowerCase()) || null;
  }, [topics, selectedTopic]);

  const handleSelect = (topicName: string) => {
    onSelectTopic(topicName);
    setIsOpen(false);
    setSearch('');
  };

  const handleCreateFromSearch = async () => {
    const trimmed = search.trim();
    if (!trimmed || !onCreateTopic) return;
    try {
      const created = await onCreateTopic({
        name: trimmed,
        color: '',
        icon: '',
      });
      if (created && 'name' in created) {
        handleSelect(created.name);
      } else {
        handleSelect(trimmed);
      }
    } catch {
      // error handled by caller
    } finally {
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button */}
      <div className="inline-flex items-center rounded-lg bg-[#222222] border border-[#383838] hover:border-gray-500 transition-colors shadow-sm">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-200 cursor-pointer select-none"
          aria-expanded={isOpen}
          aria-haspopup="true"
          title="Filter topics"
        >
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span>Topic:</span>
          {activeTopicItem ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#2a2d36] text-gray-200 border border-[#3b414f]">
              <span className="truncate max-w-[120px]">{activeTopicItem.name}</span>
            </span>
          ) : selectedTopic !== 'ALL' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#2a2d36] text-gray-200 border border-[#3b414f]">
              <span className="truncate max-w-[120px]">{selectedTopic}</span>
            </span>
          ) : (
            <span className="text-gray-300">All Topics</span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {selectedTopic !== 'ALL' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTopic('ALL');
            }}
            className="pr-2.5 pl-1 py-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Clear topic filter"
            aria-label="Clear topic filter"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Notion-Style Popover Menu (Matching Photo) */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-[264px] max-w-[calc(100vw-2rem)] rounded-xl bg-[#1c1d22] border border-[#2e313b] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col">
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
                  } else if (search.trim() && onCreateTopic) {
                    handleCreateFromSearch();
                  }
                }
              }}
              className="w-full bg-transparent text-xs text-gray-100 placeholder-gray-400 outline-none pr-2 py-1"
              aria-label="Search for an option..."
            />
          </div>

          {/* Subheader */}
          <div className="px-3 pt-2.5 pb-1 flex items-center justify-between text-[11px] font-semibold text-gray-400 gap-1.5">
            <span className="truncate">Select or create topic</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {selectedTopic !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => handleSelect('ALL')}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                >
                  All
                </button>
              )}
              {onCreateTopic && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer flex items-center gap-0.5 shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Topic</span>
                </button>
              )}
            </div>
          </div>

          {/* Options List with 6-dot drag handles and colored pills */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
            {/* Create option if search does not match existing */}
            {search.trim().length > 0 && !hasExactMatch && onCreateTopic && (
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

            {/* "All Topics" option */}
            {(!search.trim() || 'all topics'.includes(search.trim().toLowerCase())) && (
              <div
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#252832] transition-colors cursor-pointer group ${
                  selectedTopic === 'ALL' ? 'bg-[#252832]' : ''
                }`}
                onClick={() => handleSelect('ALL')}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <GripVertical className="w-3.5 h-3.5 text-gray-500 opacity-60 group-hover:opacity-100 shrink-0" />
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#333742] text-gray-100 shadow-sm select-none">
                    <span>All Topics</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2a2e39] text-gray-300 font-semibold">
                    {totalCount}
                  </span>
                  {selectedTopic === 'ALL' && (
                    <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  )}
                </div>
              </div>
            )}

            {/* List of matching topics */}
            {filteredTopics.map((topic) => {
              const count = topicCounts?.get(topic.name.toLowerCase()) || 0;
              const isSelected = selectedTopic.toLowerCase() === topic.name.toLowerCase();

              return (
                <div
                  key={topic.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[#252832] transition-colors cursor-pointer group ${
                    isSelected ? 'bg-[#252832]' : ''
                  }`}
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

                  {/* Right: count and checkmark & actions */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {count > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#2a2e39] text-gray-300 font-semibold">
                        {count}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}

                    {/* Actions on hover */}
                    {(onUpdateTopic || onDeleteTopic) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                        {onUpdateTopic && (
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
                        )}
                        {onDeleteTopic && (
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
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredTopics.length === 0 && search.trim() && (
              <div className="py-4 text-center text-xs text-gray-500">
                No matching topics found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Topic Confirmation Dialog */}
      {topicToDelete && onDeleteTopic && (
        <ConfirmDialog
          isOpen={Boolean(topicToDelete)}
          onClose={() => setTopicToDelete(null)}
          onConfirm={async () => {
            const id = topicToDelete.id;
            setTopicToDelete(null);
            await onDeleteTopic(id);
            if (selectedTopic.toLowerCase() === topicToDelete.name.toLowerCase()) {
              onSelectTopic('ALL');
            }
          }}
          title={`Delete Topic "${topicToDelete.name}"?`}
          message="Are you sure you want to delete this topic?"
          confirmLabel="Delete Topic"
          isDestructive
        />
      )}

      {/* Edit Topic Modal */}
      {editingTopic && onUpdateTopic && (
        <TopicModal
          isOpen={Boolean(editingTopic)}
          topic={editingTopic}
          onClose={() => setEditingTopic(null)}
          onSave={async (data) => {
            await onUpdateTopic(editingTopic.id, data);
            setEditingTopic(null);
          }}
          onDelete={onDeleteTopic ? async (id) => {
            await onDeleteTopic(id);
            if (selectedTopic.toLowerCase() === editingTopic.name.toLowerCase()) {
              onSelectTopic('ALL');
            }
            setEditingTopic(null);
          } : undefined}
        />
      )}

      {/* Create Topic Modal */}
      {isCreateModalOpen && onCreateTopic && (
        <TopicModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={async (data) => {
            const created = await onCreateTopic(data);
            if (created && 'name' in created) {
              onSelectTopic(created.name);
            }
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
