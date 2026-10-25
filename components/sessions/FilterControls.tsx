'use client';

import React from 'react';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';

export interface FilterControlsProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  sortBy: string;
  onSortByChange: (val: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function FilterControls({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  onReset,
  hasActiveFilters,
}: FilterControlsProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#262626] border border-[#383838] p-3 sm:p-4 rounded-xl shadow-sm">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by topic, notes, or tags..."
          className="w-full bg-[#1a1a1a] text-[#ececec] border border-[#383838] rounded-lg pl-9 pr-8 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status Filter & Sort Dropdown */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        {/* Status */}
        <div className="relative flex-1 sm:flex-none">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full sm:w-auto bg-[#1a1a1a] text-[#ececec] border border-[#383838] rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLANNED">Planned (Yellow)</option>
            <option value="IN_PROGRESS">In Progress (Blue)</option>
            <option value="COMPLETED">Completed (Green)</option>
          </select>
        </div>

        {/* Sort */}
        <div className="relative flex-1 sm:flex-none">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full sm:w-auto bg-[#1a1a1a] text-[#ececec] border border-[#383838] rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-gray-400 cursor-pointer"
          >
            <option value="recently_updated">Recently Updated</option>
            <option value="recently_created">Recently Created</option>
            <option value="oldest_created">Oldest Created</option>
            <option value="topic_asc">Topic A–Z</option>
            <option value="topic_desc">Topic Z–A</option>
            <option value="highest_score">Highest Score</option>
            <option value="lowest_score">Lowest Score</option>
          </select>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="px-2.5 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-[#333333] transition-colors shrink-0"
            title="Reset filters"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
