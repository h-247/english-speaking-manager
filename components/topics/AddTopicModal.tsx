'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePractice } from '@/context/PracticeContext';
import {
  Search,
  Plus,
  X,
  GripVertical,
  Sparkles,
} from 'lucide-react';

export function AddTopicModal() {
  const {
    displayTopics,
    handleInstantCreateSession,
    handleCreateTopic,
    topicCounts,
    isAddTopicModalOpen,
    setIsAddTopicModalOpen,
  } = usePractice();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const newTopicInputRef = useRef<HTMLInputElement>(null);

  // Filtered topics based on search query
  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return displayTopics;
    return displayTopics.filter((t) => t.name.toLowerCase().includes(q));
  }, [displayTopics, search]);

  const hasExactMatch = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return false;
    return displayTopics.some((t) => t.name.toLowerCase() === q);
  }, [displayTopics, search]);

  // Focus search input when pop-up opens
  useEffect(() => {
    if (isAddTopicModalOpen) {
      setSearch('');
      setSelectedIndex(0);
      setIsCreatingNew(false);
      setNewTopicName('');
      setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  }, [isAddTopicModalOpen]);

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredTopics]);

  // Focus new topic input when create mode is toggled
  useEffect(() => {
    if (isCreatingNew) {
      setTimeout(() => {
        newTopicInputRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  }, [isCreatingNew]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isAddTopicModalOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsAddTopicModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddTopicModalOpen, setIsAddTopicModalOpen]);

  if (!isAddTopicModalOpen) return null;

  const handleSelectTopic = async (topicName: string) => {
    setIsAddTopicModalOpen(false);
    await handleInstantCreateSession(topicName);
  };

  const handleCreateFromSearch = async () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    setIsAddTopicModalOpen(false);
    setSearch('');
    await handleInstantCreateSession(trimmed);
  };

  const handleCreateNewCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTopicName.trim();
    if (!trimmed) return;
    setIsAddTopicModalOpen(false);
    setIsCreatingNew(false);
    setNewTopicName('');
    await handleInstantCreateSession(trimmed);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredTopics.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : Math.max(0, filteredTopics.length - 1)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTopics.length > 0 && selectedIndex >= 0 && selectedIndex < filteredTopics.length) {
        handleSelectTopic(filteredTopics[selectedIndex].name);
      } else if (search.trim()) {
        handleCreateFromSearch();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Topic"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Semi-transparent dark backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => setIsAddTopicModalOpen(false)}
        aria-hidden="true"
      />

      {/* Pop-up Modal Card */}
      <div className="relative w-full max-w-lg bg-[#1c1d22] border border-[#2e313b] rounded-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Pop-up Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2b2e38] bg-[#17181c] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-gray-100">Add Speaking Topic</h2>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#282a32] text-gray-400 border border-[#3b3e4a]">
              Alt+`
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAddTopicModalOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#282a32] transition-colors cursor-pointer"
            aria-label="Close pop-up"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Box */}
        <div className="p-3 border-b border-[#2b2e38] flex items-center gap-2 bg-[#17181c] shrink-0">
          <Search className="w-4 h-4 text-gray-400 ml-1.5 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for an option..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-transparent text-sm text-gray-100 placeholder-gray-400 outline-none pr-2 py-1"
            aria-label="Search for an option..."
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Subheader: "Select an option or create one" & "+ New Topic" */}
        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between text-xs font-semibold text-gray-400 bg-[#1c1d22] shrink-0">
          <span>Select an option or create one</span>
          <button
            type="button"
            onClick={() => setIsCreatingNew((prev) => !prev)}
            className="text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            New Topic
          </button>
        </div>

        {/* Inline Create New Topic Section */}
        {isCreatingNew && (
          <form onSubmit={handleCreateNewCustom} className="p-3 border-b border-[#2b2e38] bg-[#17181c] flex items-center gap-2 shrink-0">
            <input
              ref={newTopicInputRef}
              type="text"
              placeholder="Enter new topic name..."
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              className="flex-1 bg-[#22242b] border border-[#383d4c] focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={!newTopicName.trim()}
              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingNew(false)}
              className="p-1.5 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Topics List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 no-scrollbar">
          {/* Create option if search does not match existing */}
          {search.trim().length > 0 && !hasExactMatch && (
            <button
              type="button"
              onClick={handleCreateFromSearch}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-[#252832] transition-colors group cursor-pointer border border-dashed border-[#383d4c]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Plus className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-xs text-gray-300">
                  Create &quot;<strong className="text-sky-300">{search.trim()}</strong>&quot; in Topics
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Enter</span>
            </button>
          )}

          {filteredTopics.length === 0 && search.trim().length === 0 && (
            <div className="py-8 text-center text-xs text-gray-500">
              No topics available yet. Click &quot;+ New Topic&quot; above to create one.
            </div>
          )}

          {filteredTopics.map((topic, index) => {
            const count = topicCounts.get(topic.name.toLowerCase()) || 0;
            const isSelected = selectedIndex === index;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleSelectTopic(topic.name)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer group ${
                  isSelected ? 'bg-[#252832] ring-1 ring-sky-500/40' : 'hover:bg-[#252832]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GripVertical className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#2a2d36] text-gray-200 border border-[#3b414f] group-hover:border-sky-500/50 transition-colors">
                    <span className="truncate max-w-[280px] sm:max-w-[340px]">{topic.name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {count > 0 ? (
                    <span className="text-[11px] font-mono text-gray-400 bg-[#252832] px-2 py-0.5 rounded-full border border-[#383d4c]/50">
                      {count} {count === 1 ? 'session' : 'sessions'}
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-500 font-mono">0</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
