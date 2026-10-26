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
import {
  fetchSession,
  deleteSession,
  deleteAttempt,
  SessionItem,
} from '@/lib/api-client';
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
  History,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  GitBranch,
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

  // Attempt deletion states
  const [attemptToDelete, setAttemptToDelete] = useState<string | null>(null);
  const [isDeletingAttempt, setIsDeletingAttempt] = useState(false);

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

  const handleCopyLink = async (urlToCopy?: string) => {
    const url = urlToCopy || session?.chatgptUrl;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
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

  const handleConfirmDeleteAttempt = async () => {
    if (!session || !attemptToDelete) return;
    setIsDeletingAttempt(true);
    try {
      await deleteAttempt(session.id, attemptToDelete);
      showSuccess('Practice attempt deleted.');
      setAttemptToDelete(null);
      await loadSession();
    } catch (err: any) {
      showError(err.message || 'Failed to delete practice attempt.');
    } finally {
      setIsDeletingAttempt(false);
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
  const attempts = session.attempts || [];
  const latestAttempt = attempts[0];
  const activeChatgptUrl = latestAttempt?.chatgptUrl || session.chatgptUrl;
  const firstAttempt = attempts[attempts.length - 1];
  const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a) => a.score)) : null;
  const scoreDiff =
    latestAttempt && firstAttempt && attempts.length > 1
      ? Math.round((latestAttempt.score - firstAttempt.score) * 10) / 10
      : null;

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
              {attempts.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1c2e42] text-sky-300 border border-sky-800/50 font-medium">
                  {attempts.length} {attempts.length === 1 ? 'practice attempt' : 'practice attempts'}
                </span>
              )}
              {session.allChatgptUrls && session.allChatgptUrls.length > 1 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950/70 text-purple-300 border border-purple-800/50 font-medium inline-flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {session.allChatgptUrls.length} ChatGPT chats (branches)
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#ececec] tracking-tight">
              {session.topic}
            </h1>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2">
            <a
              href={activeChatgptUrl}
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

        {/* ChatGPT Conversation Links (Supports Multiple Branches) */}
        {session.allChatgptUrls && session.allChatgptUrls.length > 1 ? (
          <div className="space-y-2.5 p-4 rounded-xl bg-[#1a1a1a] border border-[#383838]">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                <GitBranch className="w-3.5 h-3.5" />
                ChatGPT Links & Conversation Branches ({session.allChatgptUrls.length})
              </span>
              <span className="text-[11px] text-gray-500 lowercase">
                branched via ChatGPT &quot;Branch in new chat&quot;
              </span>
            </div>
            <div className="space-y-2 pt-1">
              {session.allChatgptUrls.map((url, idx) => {
                const isOriginal = url === session.chatgptUrl;
                return (
                  <div
                    key={url}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-lg bg-[#222222] border border-[#333333]"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isOriginal ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 shrink-0">
                          Main Chat
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 shrink-0 inline-flex items-center gap-1">
                          <GitBranch className="w-2.5 h-2.5" />
                          Branch #{idx}
                        </span>
                      )}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-300 hover:underline truncate"
                        title={url}
                      >
                        {url}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#2e2e2e] hover:bg-[#3d3d3d] text-xs font-medium text-gray-200 transition-colors"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(url)}
                        className="h-7 px-2 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
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

            <Button variant="outline" size="sm" onClick={() => handleCopyLink(session.chatgptUrl)}>
              <Copy className="w-3.5 h-3.5 mr-1" />
              Copy Link
            </Button>
          </div>
        )}

        {/* Latest Practice Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#333333]">
          <div className="p-3.5 rounded-lg bg-[#1e1e1e] border border-[#333333]">
            <span className="text-xs text-gray-400 block font-medium">Latest Score</span>
            <div className="mt-1">
              <ScoreDisplay score={session.score} size="lg" />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#1e1e1e] border border-[#333333]">
            <span className="text-xs text-gray-400 block font-medium">Latest Pass Count</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
              {session.passCount !== null ? session.passCount : '—'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#1e1e1e] border border-[#333333]">
            <span className="text-xs text-gray-400 block font-medium">Latest Fail Count</span>
            <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
              {session.failCount !== null ? session.failCount : '—'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#1e1e1e] border border-[#333333]">
            <span className="text-xs text-gray-400 block font-medium">Latest Accuracy</span>
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
              Session Notes & Overview
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
                <span>Last Practiced: {formatDate(session.practicedAt)}</span>
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

      {/* Practice History & Score Progression Section */}
      <div className="bg-[#262626] border border-[#383838] rounded-xl p-6 sm:p-8 shadow-md flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-950/40 text-sky-400 border border-sky-800/40">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#ececec]">
                  Practice History & Scores
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1c2e42] text-sky-300 border border-sky-800/50 font-medium">
                  {attempts.length} {attempts.length === 1 ? 'attempt' : 'attempts'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Chronological log of speaking attempts and scores for this ChatGPT link
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsResultOpen(true)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log Practice Attempt
          </Button>
        </div>

        {/* Score Progression Overview Card (if > 1 attempt) */}
        {attempts.length > 1 && scoreDiff !== null && firstAttempt && latestAttempt && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#1e1e1e] border border-[#383838]">
            <div>
              <span className="text-[11px] font-medium text-gray-400 block uppercase tracking-wider">
                Initial Score
              </span>
              <div className="mt-1">
                <ScoreDisplay score={firstAttempt.score} size="md" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-gray-400 block uppercase tracking-wider">
                Latest Score
              </span>
              <div className="mt-1">
                <ScoreDisplay score={latestAttempt.score} size="md" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-gray-400 block uppercase tracking-wider">
                Best Score
              </span>
              <div className="mt-1">
                <ScoreDisplay score={bestScore} size="md" />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-gray-400 block uppercase tracking-wider">
                Progression
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                {scoreDiff > 0 ? (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                    +{scoreDiff.toFixed(1)}
                  </span>
                ) : scoreDiff < 0 ? (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-rose-400">
                    <TrendingDown className="w-4 h-4" />
                    {scoreDiff.toFixed(1)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-gray-400">
                    <Minus className="w-4 h-4" />
                    0.0
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Attempts List */}
        {attempts.length > 0 ? (
          <div className="space-y-3">
            {attempts.map((attempt, index) => {
              const attemptNumber = attempts.length - index;
              const isLatest = index === 0 && attempts.length > 1;
              const totalAttemptsForSentences = attempt.passCount + attempt.failCount;
              const accuracy =
                totalAttemptsForSentences > 0
                  ? Math.round((attempt.passCount / totalAttemptsForSentences) * 100)
                  : 0;

              return (
                <div
                  key={attempt.id}
                  className="p-4 sm:p-5 rounded-xl bg-[#1c1c1c] border border-[#333333] hover:border-[#444444] transition-all flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#2b2b2b] text-gray-200 border border-[#3d3d3d]">
                        Attempt #{attemptNumber}
                      </span>
                      {isLatest && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          Latest Attempt
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {formatDate(attempt.practicedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <ScoreDisplay score={attempt.score} size="md" />
                      <button
                        onClick={() => setAttemptToDelete(attempt.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Delete this practice attempt"
                        aria-label="Delete this practice attempt"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-[#161616] border border-[#2b2b2b] text-xs">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Pass Count</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {attempt.passCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Fail Count</span>
                      <span className="font-mono font-bold text-rose-400">
                        {attempt.failCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[11px]">Accuracy</span>
                      <span className="font-mono font-bold text-gray-200">{accuracy}%</span>
                    </div>
                  </div>

                  {/* Attempt's ChatGPT Link / Branch */}
                  {attempt.chatgptUrl && (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#141414] border border-[#2b2b2b] text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {attempt.chatgptUrl !== session.chatgptUrl ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-950/70 text-purple-300 border border-purple-800/50 shrink-0">
                            <GitBranch className="w-3 h-3" />
                            Branched Chat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#262626] text-gray-400 border border-[#333] shrink-0">
                            <LinkIcon className="w-3 h-3" />
                            Main Chat
                          </span>
                        )}
                        <a
                          href={attempt.chatgptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-300 hover:text-white truncate hover:underline"
                          title={attempt.chatgptUrl}
                        >
                          {attempt.chatgptUrl}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={attempt.chatgptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#242424] hover:bg-[#333] text-gray-200 text-[11px] font-medium transition-colors"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => handleCopyLink(attempt.chatgptUrl!)}
                          className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#2b2b2b] transition-colors"
                          title="Copy conversation link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {attempt.notes && (
                    <div className="text-xs text-gray-300 bg-[#171717] p-3 rounded-lg border border-[#2b2b2b] whitespace-pre-wrap">
                      <span className="text-[10px] uppercase font-semibold text-gray-500 block mb-1">
                        Attempt Feedback / Notes:
                      </span>
                      {attempt.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-[#383838] bg-[#1a1a1a]/60 space-y-3">
            <p className="text-sm text-gray-400">
              No practice attempts recorded yet for this ChatGPT conversation.
            </p>
            <Button variant="outline" size="sm" onClick={() => setIsResultOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Record First Practice Attempt
            </Button>
          </div>
        )}
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

      {/* Delete Full Session Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Session Record"
        message={`Are you sure you want to delete "${session.topic}"? This removes the session and all practice attempt history from your manager. (Your ChatGPT conversation will not be affected).`}
        confirmLabel="Delete Session"
      />

      {/* Delete Single Attempt Dialog */}
      <ConfirmDialog
        isOpen={attemptToDelete !== null}
        onClose={() => setAttemptToDelete(null)}
        onConfirm={handleConfirmDeleteAttempt}
        isLoading={isDeletingAttempt}
        title="Delete Practice Attempt"
        message="Are you sure you want to delete this practice attempt? The session's latest score and stats will automatically adjust to the remaining attempts."
        confirmLabel="Delete Attempt"
      />
    </div>
  );
}
