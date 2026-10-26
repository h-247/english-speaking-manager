'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { SessionFormDialog } from '@/components/sessions/SessionFormDialog';
import { RecordResultDialog } from '@/components/sessions/RecordResultDialog';
import { TopicLinkManager } from '@/components/sessions/TopicLinkManager';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchSessions, deleteSession, updateSession, SessionItem } from '@/lib/api-client';
import { PRESET_TOPICS, getPresetTopicByName } from '@/lib/preset-topics';
import { formatDate } from '@/lib/format-date';
import { useToast } from '@/components/ui/Toast';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  ExternalLink,
  Award,
  Sparkles,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  FolderPlus,
  Link as LinkIcon,
} from 'lucide-react';

export function TopicsPageContent({
  defaultTab = 'crud',
}: {
  defaultTab?: 'crud' | 'workspace';
} = {}) {
  const { showSuccess, showError } = useToast();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active view tab: 'crud' (Topics Management) | 'workspace' (Practice Links Workspace)
  const [activeTab, setActiveTab] = useState<'crud' | 'workspace'>(defaultTab);

  // Search and filter for the CRUD table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  // Workspace selected topic state
  const [selectedTopicForWorkspace, setSelectedTopicForWorkspace] = useState<string | undefined>(undefined);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [initialTopicForAdd, setInitialTopicForAdd] = useState<string | undefined>(undefined);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [resultSession, setResultSession] = useState<SessionItem | null>(null);
  const [selectedUrlForResult, setSelectedUrlForResult] = useState<string | undefined>(undefined);
  const [deletingSession, setDeletingSession] = useState<SessionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTopics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchSessions({ limit: 100 });
      setSessions(res.sessions);
    } catch (err: any) {
      showError(err.message || 'Failed to load topics.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const handleConfirmDelete = async () => {
    if (!deletingSession) return;
    setIsDeleting(true);
    try {
      await deleteSession(deletingSession.id);
      showSuccess(`Deleted topic "${deletingSession.topic}".`);
      setDeletingSession(null);
      loadTopics();
    } catch (err: any) {
      showError(err.message || 'Failed to delete topic.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAddWithTopic = (initialTopic?: string) => {
    setInitialTopicForAdd(initialTopic);
    setIsAddOpen(true);
  };

  const handleRecordResult = (session: SessionItem, initialUrl?: string) => {
    setResultSession(session);
    setSelectedUrlForResult(initialUrl);
  };

  const handleGoToWorkspace = (topicName: string) => {
    setSelectedTopicForWorkspace(topicName);
    setActiveTab('workspace');
  };

  // Filtered topics for the CRUD table
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        !searchQuery.trim() ||
        s.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sessions, searchQuery, statusFilter]);

  // Counts for filters
  const counts = useMemo(() => {
    return {
      all: sessions.length,
      planned: sessions.filter((s) => s.status === 'PLANNED').length,
      inProgress: sessions.filter((s) => s.status === 'IN_PROGRESS').length,
      completed: sessions.filter((s) => s.status === 'COMPLETED').length,
    };
  }, [sessions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#333333]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ececec]">
              Speaking Topics & Links
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-gray-300 border border-neutral-700 font-medium">
              {sessions.length} {sessions.length === 1 ? 'Topic' : 'Topics'}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Create, view, edit, and organize all your English conversation topics and ChatGPT links in one place.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="primary" size="sm" onClick={() => handleOpenAddWithTopic()}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Session / Topic
          </Button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('crud')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'crud'
              ? 'bg-[#2a2a2a] text-white border border-[#444444]'
              : 'text-gray-400 hover:text-white hover:bg-[#222222]'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-400" />
          Topics Overview (CRUD)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'workspace'
              ? 'bg-[#2a2a2a] text-white border border-[#444444]'
              : 'text-gray-400 hover:text-white hover:bg-[#222222]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Topic Links & Practice Workspace
        </button>
      </div>

      {activeTab === 'crud' ? (
        /* =================== TAB 1: TOPICS CRUD TABLE & CARDS =================== */
        <div className="space-y-4">
          {/* Search & Status Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#262626] p-3 rounded-xl border border-[#383838]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, notes, or tags..."
                className="w-full bg-[#1c1c1c] border border-[#383838] focus:border-white focus:ring-1 focus:ring-white rounded-lg pl-9 pr-3.5 py-2 text-sm text-[#ececec] placeholder-gray-500 outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-black font-semibold'
                    : 'bg-[#1c1c1c] text-gray-400 hover:text-white border border-[#383838]'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PLANNED')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === 'PLANNED'
                    ? 'bg-amber-400 text-black font-semibold'
                    : 'bg-[#1c1c1c] text-amber-400/80 hover:text-amber-300 border border-[#383838]'
                }`}
              >
                Planned ({counts.planned})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('IN_PROGRESS')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === 'IN_PROGRESS'
                    ? 'bg-blue-500 text-white font-semibold'
                    : 'bg-[#1c1c1c] text-blue-400/80 hover:text-blue-300 border border-[#383838]'
                }`}
              >
                In Progress ({counts.inProgress})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-emerald-500 text-white font-semibold'
                    : 'bg-[#1c1c1c] text-emerald-400/80 hover:text-emerald-300 border border-[#383838]'
                }`}
              >
                Completed ({counts.completed})
              </button>
            </div>
          </div>

          {/* Topics CRUD Table */}
          {filteredSessions.length > 0 ? (
            <div className="rounded-xl border border-[#383838] overflow-hidden bg-[#242424] shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1c1c1c] text-gray-400 font-semibold border-b border-[#383838] text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Topic & Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">ChatGPT Links</th>
                      <th className="py-3 px-4">Practice Attempts</th>
                      <th className="py-3 px-4">Best Score</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2f2f2f] text-gray-300">
                    {filteredSessions.map((session) => {
                      const preset = getPresetTopicByName(session.topic);
                      const icon = preset ? preset.icon : '💬';
                      const linkCount = session.allChatgptUrls?.length || 1;
                      const attemptCount = session.attemptCount ?? 0;

                      return (
                        <tr
                          key={session.id}
                          className="hover:bg-[#2a2a2a] transition-colors group"
                        >
                          {/* Column 1: Topic */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-start gap-2.5">
                              <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                              <div>
                                <Link
                                  href={`/sessions/${session.id}`}
                                  className="font-bold text-white hover:text-blue-300 hover:underline transition-colors block"
                                >
                                  {session.topic}
                                </Link>
                                {session.notes ? (
                                  <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 max-w-sm">
                                    {session.notes}
                                  </p>
                                ) : preset ? (
                                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 max-w-sm">
                                    {preset.description}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={session.status} size="sm" />
                          </td>

                          {/* Column 3: Links */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1a1a1a] border border-[#333333] text-xs font-medium text-gray-300">
                              <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                              <span>{linkCount} {linkCount === 1 ? 'link' : 'links'}</span>
                            </div>
                          </td>

                          {/* Column 4: Attempts */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-gray-200">
                                {attemptCount} {attemptCount === 1 ? 'attempt' : 'attempts'}
                              </span>
                              {session.practicedAt && (
                                <span className="text-[11px] text-gray-400">
                                  {formatDate(session.practicedAt)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Column 5: Best Score */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <ScoreDisplay score={session.score} size="sm" />
                          </td>

                          {/* Column 6: Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGoToWorkspace(session.topic)}
                                title="Open in practice workspace"
                                className="h-8 px-2.5 text-xs text-blue-300 border-blue-900/60 hover:bg-blue-950/30"
                              >
                                Practice
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingSession(session)}
                                title="Edit topic details"
                                className="h-8 px-2 text-xs text-gray-300 hover:text-white"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                Edit
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingSession(session)}
                                title="Delete topic"
                                className="h-8 px-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-[#262626] border border-[#383838] rounded-xl p-8 text-center space-y-3">
              <FolderPlus className="w-10 h-10 mx-auto text-gray-500" />
              <h3 className="text-base font-bold text-gray-200">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'No topics match your filters'
                  : 'No speaking topics added yet'}
              </h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try clearing the search query or changing your status filter.'
                  : 'Add your first topic with its ChatGPT conversation link to start tracking your practice attempts.'}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenAddWithTopic()}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Session / Topic
              </Button>
            </div>
          )}

          {/* Quick Preset Topics Directory */}
          <div className="bg-[#1f1f1f] border border-[#333333] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-200">
                  Quick Add From Standard Preset Speaking Topics
                </h3>
                <p className="text-xs text-gray-400">
                  Click any standard IELTS/CEFR B2 speaking topic to immediately create or practice it.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-1">
              {PRESET_TOPICS.map((preset) => {
                const existing = sessions.find(
                  (s) => s.topic.trim().toLowerCase() === preset.name.trim().toLowerCase(),
                );
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      if (existing) {
                        handleGoToWorkspace(existing.topic);
                      } else {
                        handleOpenAddWithTopic(preset.name);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-colors ${
                      existing
                        ? 'bg-[#292929] border-[#444444] text-white hover:border-gray-300'
                        : 'bg-[#181818] border-[#2e2e2e] text-gray-400 hover:text-white hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{preset.icon}</span>
                      {existing ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                          Active
                        </span>
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </div>
                    <span className="text-xs font-semibold mt-2 line-clamp-1">
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* =================== TAB 2: PRACTICE LINKS WORKSPACE =================== */
        <TopicLinkManager
          sessions={sessions}
          onRefresh={loadTopics}
          onRecordResult={handleRecordResult}
          onEditSession={(s) => setEditingSession(s)}
          onDeleteSession={(s) => setDeletingSession(s)}
          onOpenAddSession={handleOpenAddWithTopic}
          initialSelectedTopic={selectedTopicForWorkspace}
        />
      )}

      {/* Dialogs */}
      <SessionFormDialog
        isOpen={isAddOpen}
        initialTopic={initialTopicForAdd}
        onClose={() => {
          setIsAddOpen(false);
          setInitialTopicForAdd(undefined);
        }}
        onSuccess={loadTopics}
      />

      <SessionFormDialog
        isOpen={Boolean(editingSession)}
        sessionToEdit={editingSession}
        onClose={() => setEditingSession(null)}
        onSuccess={loadTopics}
      />

      <RecordResultDialog
        isOpen={Boolean(resultSession)}
        session={resultSession}
        initialUrl={selectedUrlForResult}
        onClose={() => {
          setResultSession(null);
          setSelectedUrlForResult(undefined);
        }}
        onSuccess={loadTopics}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Topic"
        message={`Are you sure you want to delete "${deletingSession?.topic}"? This removes the topic and its saved links from your manager. (Your ChatGPT conversations remain safe in ChatGPT).`}
        confirmLabel="Delete Topic"
      />
    </div>
  );
}
