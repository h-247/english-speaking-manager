'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StatsCard } from '@/components/ui/StatsCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionFormDialog } from '@/components/sessions/SessionFormDialog';
import { RecordResultDialog } from '@/components/sessions/RecordResultDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchDashboard, deleteSession, updateSession, SessionItem, DashboardData } from '@/lib/api-client';
import { ORIGINAL_COACH_PROMPT } from '@/lib/coach-prompt';
import { useToast } from '@/components/ui/Toast';
import {
  Plus,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export default function DashboardPage() {
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [resultSession, setResultSession] = useState<SessionItem | null>(null);
  const [deletingSession, setDeletingSession] = useState<SessionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchDashboard();
      setData(res);
    } catch (err: any) {
      showError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(ORIGINAL_COACH_PROMPT);
      showSuccess('English Speaking Coach Prompt copied to clipboard!');
    } catch {
      showError('Failed to copy prompt to clipboard.');
    }
  };

  const handleStatusChange = async (
    session: SessionItem,
    newStatus: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED',
  ) => {
    try {
      await updateSession(session.id, { status: newStatus });
      showSuccess(`Updated status to ${newStatus}.`);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to update status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSession) return;
    setIsDeleting(true);
    try {
      await deleteSession(deletingSession.id);
      showSuccess(`Deleted session "${deletingSession.topic}".`);
      setDeletingSession(null);
      loadData();
    } catch (err: any) {
      showError(err.message || 'Failed to delete session.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && !data) {
    return <LoadingState message="Loading speaking practice dashboard..." />;
  }

  const hasSessions = (data?.totalSessions ?? 0) > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Top Banner / Actions Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#333333]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ececec]">
            Speaking Practice Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Track and manage your 5-minute B2 TED Talk sessions with ChatGPT.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
            <Copy className="w-4 h-4 text-gray-400" />
            Copy Prompt
          </Button>

          <a
            href="https://chatgpt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#333333] border border-[#444444] text-gray-200 hover:text-white hover:bg-[#404040] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Open ChatGPT
            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
          </a>

          <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Topic
          </Button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          label="Total Topics"
          value={data?.totalSessions ?? 0}
          icon={<Layers className="w-4 h-4" />}
          accentColor="default"
        />
        <StatsCard
          label="Planned"
          value={data?.plannedSessions ?? 0}
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          accentColor="yellow"
        />
        <StatsCard
          label="In Progress"
          value={data?.inProgressSessions ?? 0}
          icon={<Sparkles className="w-4 h-4 text-blue-400" />}
          accentColor="blue"
        />
        <StatsCard
          label="Completed"
          value={data?.completedSessions ?? 0}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          accentColor="green"
        />
      </div>

      {/* Secondary Stats: Average Score & Sentence Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-[#262626] border border-[#383838] rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">
              Average Score (Completed)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {data?.averageCompletedScore !== null && data?.averageCompletedScore !== undefined
                  ? data.averageCompletedScore.toFixed(1)
                  : '—'}
              </span>
              {data?.averageCompletedScore !== null && (
                <span className="text-xs text-gray-400 font-mono">/10</span>
              )}
            </div>
          </div>
          <div className="p-3 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#262626] border border-[#383838] rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">
              Total Pass Attempts
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-300 mt-1 block">
              {data?.totalPass ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#262626] border border-[#383838] rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block">
              Total Fail Attempts
            </span>
            <span className="text-2xl font-bold font-mono text-rose-300 mt-1 block">
              {data?.totalFail ?? 0}
            </span>
          </div>
          <div className="p-3 rounded-full bg-rose-950/40 border border-rose-800/40 text-rose-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Access: Active Practice Topics */}
      {data?.unfinishedSessions && data.unfinishedSessions.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-lg font-bold text-[#ececec]">
                Quick Access: Active Topics
              </h2>
            </div>
            <Link
              href="/topics"
              className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1"
            >
              View Topics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.unfinishedSessions.map((session) => (
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
        </section>
      )}

      {/* Recent Topics or Empty State */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#ececec]">Recent Speaking Topics</h2>
          {hasSessions && (
            <Link
              href="/topics"
              className="text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5"
            >
              View All Topics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {hasSessions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.recentSessions.map((session) => (
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
        ) : (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No Speaking Topics Yet"
            description="Start practicing by copying the coach prompt, generating a 5-minute B2 presentation in ChatGPT, and saving your conversation link here."
            actionLabel="Add Your First Topic"
            onAction={() => setIsAddOpen(true)}
            actionIcon={<Plus className="w-4 h-4 mr-1.5" />}
          />
        )}
      </section>

      {/* Dialogs */}
      <SessionFormDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadData}
      />

      <SessionFormDialog
        isOpen={Boolean(editingSession)}
        sessionToEdit={editingSession}
        onClose={() => setEditingSession(null)}
        onSuccess={loadData}
      />

      <RecordResultDialog
        isOpen={Boolean(resultSession)}
        session={resultSession}
        onClose={() => setResultSession(null)}
        onSuccess={loadData}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Session Record"
        message={`Are you sure you want to delete "${deletingSession?.topic}"? This removes the saved record from your manager. (Note: Your original conversation in ChatGPT will not be affected).`}
        confirmLabel="Delete Session"
      />
    </div>
  );
}
