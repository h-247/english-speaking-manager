'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { SessionFormDialog } from '@/components/sessions/SessionFormDialog';
import { RecordResultDialog } from '@/components/sessions/RecordResultDialog';
import { SessionTable } from '@/components/sessions/SessionTable';
import { SessionCard } from '@/components/sessions/SessionCard';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchSessions, deleteSession, updateSession, SessionItem } from '@/lib/api-client';
import { PRESET_TOPICS, getPresetTopicByName } from '@/lib/preset-topics';
import { formatDateShort } from '@/lib/format-date';
import { useToast } from '@/components/ui/Toast';
import {
  Plus,
  Search,
  Sparkles,
  ExternalLink,
  Layers,
  Award,
  Clock,
  LayoutGrid,
  List,
  CheckCircle2,
  FolderPlus,
  X,
  TrendingUp,
} from 'lucide-react';

export function TopicsPageContent({
  defaultTab,
}: {
  defaultTab?: 'crud' | 'workspace';
} = {}) {
  const { showSuccess, showError } = useToast();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & view options
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'To Do' | 'Doing' | 'Done' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [initialTopicForAdd, setInitialTopicForAdd] = useState<string | undefined>(undefined);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [resultSession, setResultSession] = useState<SessionItem | null>(null);
  const [deletingSession, setDeletingSession] = useState<SessionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchSessions({ limit: 100 });
      setSessions(res.sessions);
    } catch (err: any) {
      showError(err.message || 'Failed to load practice sessions.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleConfirmDelete = async () => {
    if (!deletingSession) return;
    setIsDeleting(true);
    try {
      await deleteSession(deletingSession.id);
      showSuccess(`Deleted session "${deletingSession.topic}".`);
      setDeletingSession(null);
      loadSessions();
    } catch (err: any) {
      showError(err.message || 'Failed to delete session.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (
    session: SessionItem,
    newStatus: 'To Do' | 'Doing' | 'Done' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | string,
  ) => {
    try {
      await updateSession(session.id, { status: newStatus as any });
      showSuccess(`Updated status to ${newStatus}.`);
      loadSessions();
    } catch (err: any) {
      showError(err.message || 'Failed to update status.');
    }
  };

  const handleOpenAddWithTopic = (topicName?: string) => {
    setInitialTopicForAdd(topicName);
    setIsAddOpen(true);
  };

  // Filter sessions by topic selection, search, and status
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesTopic =
        selectedTopicFilter === 'ALL' ||
        s.topic.trim().toLowerCase() === selectedTopicFilter.trim().toLowerCase();

      const matchesSearch =
        !searchQuery.trim() ||
        s.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.chatgptUrl.toLowerCase().includes(searchQuery.toLowerCase());

      const normStatus =
        s.status === 'COMPLETED' ? 'Done' :
        s.status === 'IN_PROGRESS' ? 'Doing' :
        s.status === 'PLANNED' ? 'To Do' :
        s.status;

      const matchesStatus =
        statusFilter === 'ALL' ||
        s.status === statusFilter ||
        normStatus === statusFilter;

      return matchesTopic && matchesSearch && matchesStatus;
    });
  }, [sessions, selectedTopicFilter, searchQuery, statusFilter]);

  // Counts by status
  const counts = useMemo(() => {
    return {
      all: sessions.length,
      toDo: sessions.filter((s) => s.status === 'To Do' || s.status === 'PLANNED').length,
      doing: sessions.filter((s) => s.status === 'Doing' || s.status === 'IN_PROGRESS').length,
      done: sessions.filter((s) => s.status === 'Done' || s.status === 'COMPLETED').length,
    };
  }, [sessions]);

  // Count sessions per preset topic selection
  const topicCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      const lower = s.topic.trim().toLowerCase();
      map.set(lower, (map.get(lower) || 0) + 1);
    }
    return map;
  }, [sessions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150" suppressHydrationWarning>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#333333]" suppressHydrationWarning>
        <div suppressHydrationWarning>
          <div className="flex items-center gap-2" suppressHydrationWarning>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ececec]" suppressHydrationWarning>
              Speaking Practice Sessions
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-gray-300 border border-neutral-700 font-medium" suppressHydrationWarning>
              {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1" suppressHydrationWarning>
            Quản lý các lần luyện nói với ChatGPT: chọn chủ đề, lưu ChatGPT links kèm theo điểm số.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="https://chatgpt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2a2a2a] border border-[#3e3e3e] text-gray-200 hover:text-white hover:border-gray-400 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Open ChatGPT
            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
          </a>

          <Button variant="primary" size="sm" onClick={() => handleOpenAddWithTopic()}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Session / Topic
          </Button>
        </div>
      </div>

      {/* Topic Selections Filter Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            Topic Selections (Chủ đề luyện nói)
          </span>
          {selectedTopicFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedTopicFilter('ALL')}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Show All Topics
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedTopicFilter('ALL')}
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedTopicFilter === 'ALL'
                ? 'bg-white text-black'
                : 'bg-[#222222] text-gray-400 hover:text-white border border-[#333333]'
            }`}
          >
            <span>All Topics</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedTopicFilter === 'ALL'
                  ? 'bg-black text-white'
                  : 'bg-[#333333] text-gray-400'
              }`}
            >
              {sessions.length}
            </span>
          </button>

          {PRESET_TOPICS.map((topic) => {
            const count = topicCounts.get(topic.name.toLowerCase()) || 0;
            const isSelected = selectedTopicFilter.toLowerCase() === topic.name.toLowerCase();

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => setSelectedTopicFilter(isSelected ? 'ALL' : topic.name)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white font-semibold border border-blue-500'
                    : 'bg-[#222222] text-gray-300 hover:text-white hover:bg-[#2a2a2a] border border-[#333333]'
                }`}
              >
                <span>{topic.icon}</span>
                <span>{topic.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-blue-800 text-white'
                        : 'bg-[#333333] text-gray-300'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search, Status Filter & View Mode Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#262626] p-3 rounded-xl border border-[#383838]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by topic, notes, or ChatGPT link..."
            className="w-full bg-[#1c1c1c] border border-[#383838] focus:border-white focus:ring-1 focus:ring-white rounded-lg pl-9 pr-3.5 py-2 text-sm text-[#ececec] placeholder-gray-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#1c1c1c] text-gray-400 hover:text-white border border-[#383838]'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('To Do')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'To Do' || statusFilter === 'PLANNED'
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'bg-[#1c1c1c] text-amber-400/80 hover:text-amber-300 border border-[#383838]'
              }`}
            >
              To Do ({counts.toDo})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Doing')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'Doing' || statusFilter === 'IN_PROGRESS'
                  ? 'bg-blue-500 text-white font-semibold'
                  : 'bg-[#1c1c1c] text-blue-400/80 hover:text-blue-300 border border-[#383838]'
              }`}
            >
              Doing ({counts.doing})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('Done')}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === 'Done' || statusFilter === 'COMPLETED'
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'bg-[#1c1c1c] text-emerald-400/80 hover:text-emerald-300 border border-[#383838]'
              }`}
            >
              Done ({counts.done})
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 border-l border-[#3a3a3a] pl-2">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#333333] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-[#333333] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Cards view"
              aria-label="Cards view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Practice Sessions Content */}
      {filteredSessions.length > 0 ? (
        viewMode === 'table' ? (
          <SessionTable
            sessions={filteredSessions}
            onEdit={(s) => setEditingSession(s)}
            onDelete={(s) => setDeletingSession(s)}
            onRecordResult={(s) => setResultSession(s)}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEdit={(s) => setEditingSession(s)}
                onDelete={(s) => setDeletingSession(s)}
                onRecordResult={(s) => setResultSession(s)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )
      ) : sessions.length > 0 ? (
        /* Filter matched 0 results */
        <div className="bg-[#262626] border border-[#383838] rounded-xl p-8 text-center space-y-3">
          <FolderPlus className="w-10 h-10 mx-auto text-gray-500" />
          <h3 className="text-base font-bold text-gray-200">
            No sessions match your filter
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {selectedTopicFilter !== 'ALL'
              ? `Chưa có lần luyện nói nào cho chủ đề "${selectedTopicFilter}". Bấm nút bên dưới để bắt đầu luyện nói với chủ đề này.`
              : 'Try clearing your search query or changing your status filter.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {selectedTopicFilter !== 'ALL' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenAddWithTopic(selectedTopicFilter)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Luyện nói chủ đề &quot;{selectedTopicFilter}&quot;
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTopicFilter('ALL');
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      ) : (
        /* Empty State: 0 sessions in library */
        <div className="space-y-6">
          <div className="bg-[#262626] border border-[#383838] rounded-xl p-8 sm:p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-800/40 text-blue-400 mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-100">
                Chưa có lần luyện nói nào với ChatGPT
              </h3>
              <p className="text-sm text-gray-400 max-w-lg mx-auto">
                Bắt đầu đơn giản bằng cách chọn một chủ đề bên dưới hoặc bấm &quot;Thêm lần luyện nói&quot; để lưu link ChatGPT kèm điểm số của bạn.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenAddWithTopic()}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Thêm lần luyện nói mới
            </Button>
          </div>

          {/* Quick Select Preset Topic Grid */}
          <div className="bg-[#1f1f1f] border border-[#333333] rounded-xl p-5 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-gray-200">
                Chọn chủ đề để bắt đầu luyện nói (Topic Selections)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Bấm vào một chủ đề để mở form thêm lần luyện nói với ChatGPT:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
              {PRESET_TOPICS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleOpenAddWithTopic(preset.name)}
                  className="p-3 rounded-lg border bg-[#181818] border-[#2e2e2e] text-left flex flex-col justify-between hover:bg-[#242424] hover:border-gray-500 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{preset.icon}</span>
                    <Plus className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-gray-200 group-hover:text-blue-300 block truncate">
                      {preset.name}
                    </span>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                      {preset.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SessionFormDialog
        isOpen={isAddOpen}
        initialTopic={initialTopicForAdd}
        onClose={() => {
          setIsAddOpen(false);
          setInitialTopicForAdd(undefined);
        }}
        onSuccess={loadSessions}
      />

      <SessionFormDialog
        isOpen={Boolean(editingSession)}
        sessionToEdit={editingSession}
        onClose={() => setEditingSession(null)}
        onSuccess={loadSessions}
      />

      <RecordResultDialog
        isOpen={Boolean(resultSession)}
        session={resultSession}
        onClose={() => setResultSession(null)}
        onSuccess={loadSessions}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Session"
        message={`Are you sure you want to delete session "${deletingSession?.topic}"? This removes the session link and score from your manager. (Your ChatGPT conversations remain safe in ChatGPT).`}
        confirmLabel="Delete Session"
      />
    </div>
  );
}