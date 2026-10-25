'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { SessionFormDialog } from '@/components/sessions/SessionFormDialog';
import { RecordResultDialog } from '@/components/sessions/RecordResultDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState } from '@/components/ui/LoadingState';
import { fetchSession, deleteSession, SessionItem } from '@/lib/api-client';
import { formatDate } from '@/lib/format-date';
import { useToast } from '@/components/ui/Toast';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Edit2,
  Trash2,
  Award,
  Calendar,
  Tag,
  CheckCircle,
  Clock,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
} from 'lucide-react';

export default function SessionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const unwrappedParams = use(params as Promise<{ id: string }>);
  const id = unwrappedParams.id;
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [session, setSession] = useState<SessionItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchSession(id);
      setSession(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load session details.');
    } finally {
      setIsLoading(false);
    }
  }, [id, showError]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleCopyLink = async () => {
    if (!session) return;
    try {
      await navigator.clipboard.writeText(session.chatgptUrl);
      showSuccess('ChatGPT conversation link copied to clipboard.');
    } catch {
      showError('Failed to copy link.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!session) return;
    setIsDeleting(true);
    try {
      await deleteSession(session.id);
      showSuccess(`Deleted session "${session.topic}".`);
      router.push('/sessions');
    } catch (err: any) {
      showError(err.message || 'Failed to delete session.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading speaking session details..." />;
  }

  if (!session) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-xl font-bold text-gray-200">Session Not Found</h2>
        <p className="text-sm text-gray-400">
          The requested practice session does not exist or you do not have permission to view it.
        </p>
        <Link href="/sessions">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Sessions
          </Button>
        </Link>
      </div>
    );
  }

  const isUnfinished = session.status === 'PLANNED' || session.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Back Link */}
      <div>
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sessions Library
        </Link>
      </div>

      {/* Main Detail Header Card */}
      <div className="bg-[#262626] border border-[#383838] rounded-xl p-6 sm:p-8 shadow-md flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <StatusBadge status={session.status} size="md" />
              {session.score !== null && <ScoreDisplay score={session.score} size="md" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#ececec] tracking-tight">
              {session.topic}
            </h1>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2">
            <a
              href={session.chatgptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md select-none ${
                isUnfinished
                  ? 'bg-white text-black hover:bg-gray-200 ring-2 ring-white/20'
                  : 'bg-[#333333] text-white hover:bg-[#404040]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              {isUnfinished ? 'Continue in ChatGPT' : 'Open in ChatGPT'}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* ChatGPT Link Bar */}
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-[#1a1a1a] border border-[#383838]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <LinkIcon className="w-4 h-4 text-gray-500 shrink-0" />
            <a
              href={session.chatgptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-gray-300 hover:underline truncate"
              title={session.chatgptUrl}
            >
              {session.chatgptUrl}
            </a>
          </div>

          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="w-3.5 h-3.5 mr-1" />
            Copy Link
          </Button>
        </div>

        {/* Practice Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#333333]">
          <div className="p-3.5 rounded-lg bg-[#1e1e1e] border border-[#333333]">
            <span className="text-xs text-gray-400 block font-medium">Practice Score</span>
            <div className="mt-1">
              <ScoreDisplay score={session.score} size="lg" />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#1e1e1e] border border-[#333333]">
            <span className="text-xs text-gray-400 block font-medium">Pass Count</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              {session.passCount !== null ? session.passCount : '—'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#1e1e1e] border border-[#333333]">
            <span className="text-xs text-gray-400 block font-medium">Fail Count</span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
              {session.failCount !== null ? session.failCount : '—'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#1e1e1e] border border-[#333333]">
            <span className="text-xs text-gray-400 block font-medium">Accuracy</span>
            <span className="text-xl font-bold font-mono text-gray-200 mt-1 block">
              {session.score !== null ? `${(session.score * 10).toFixed(0)}%` : '—'}
            </span>
          </div>
        </div>

        {/* Notes & Tags */}
        <div className="space-y-4 pt-4 border-t border-[#333333]">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Notes & Feedback
            </h3>
            {session.notes ? (
              <div className="p-4 rounded-lg bg-[#1a1a1a] border border-[#333333] text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {session.notes}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No notes recorded yet for this session.</p>
            )}
          </div>

          {session.tags && session.tags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Tags
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {session.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-[#1a1a1a] border border-[#383838] text-gray-300 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-400 pt-4 border-t border-[#333333]">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>Created: {formatDate(session.createdAt)}</span>
            </div>
            {session.practicedAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span>Practiced: {formatDate(session.practicedAt)}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResultOpen(true)}
              className="text-amber-400 border-amber-900/60 hover:bg-amber-950/20"
            >
              <Award className="w-3.5 h-3.5 mr-1" />
              Record Results
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SessionFormDialog
        isOpen={isEditOpen}
        sessionToEdit={session}
        onClose={() => setIsEditOpen(false)}
        onSuccess={loadSession}
      />

      <RecordResultDialog
        isOpen={isResultOpen}
        session={session}
        onClose={() => setIsResultOpen(false)}
        onSuccess={loadSession}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Session Record"
        message={`Are you sure you want to delete "${session.topic}"? This removes the record from your manager. (Your ChatGPT conversation will not be affected).`}
        confirmLabel="Delete Session"
      />
    </div>
  );
}
