'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { SessionFormDialog } from '@/components/sessions/SessionFormDialog';
import { EditSessionChatModal } from '@/components/sessions/EditSessionChatModal';
import { AddScoreModal } from '@/components/sessions/AddScoreModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import {
  fetchSession,
  deleteSession,
  addTopicLink,
  removeTopicLink,
  updateSession,
  SessionItem,
} from '@/lib/api-client';
import { validateChatGPTUrl } from '@/lib/chatgpt-url';
import { formatDate } from '@/lib/format-date';
import { ORIGINAL_COACH_PROMPT } from '@/lib/coach-prompt';
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
  Link2,
  MessageSquare,
  MessageSquareCheck,
  MessageSquarePlus,
  Pencil,
  Trophy,
  History,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Check,
} from 'lucide-react';

export default function SessionDetailsPage({
  params,
}: {
  params?: Promise<{ id: string }> | { id: string };
}) {
  const router = useRouter();
  const routeParams = useParams() as { id?: string } | null;
  const id =
    routeParams?.id ||
    (params && 'id' in (params as any) ? (params as any).id : undefined) ||
    '';
  const { showSuccess, showError } = useToast();

  const [session, setSession] = useState<SessionItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Link deletion states
  const [linkToDelete, setLinkToDelete] = useState<{ url: string; index: number } | null>(null);
  const [isDeletingLink, setIsDeletingLink] = useState(false);

  // Topic link management states
  const [selectedUrlForAttempt, setSelectedUrlForAttempt] = useState<string | undefined>(undefined);
  const [selectedPracticeIndex, setSelectedPracticeIndex] = useState<number | undefined>(undefined);
  const [selectedInitialUrl, setSelectedInitialUrl] = useState<string | undefined>(undefined);
  const [isAddScoreOpen, setIsAddScoreOpen] = useState(false);
  const [isEditChatModalOpen, setIsEditChatModalOpen] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [newLinkInput, setNewLinkInput] = useState('');
  const [addLinkError, setAddLinkError] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [promptChatUrl, setPromptChatUrl] = useState<string>('https://chatgpt.com');
  const [copiedTopic, setCopiedTopic] = useState(false);

  const handleCopyTopic = async () => {
    if (!session) return;
    let copied = false;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(session.topic);
        copied = true;
      }
    } catch {
      // clipboard API failed, fall through to execCommand
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = session.topic;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {}
    }

    setCopiedTopic(true);
    showSuccess(`Copied "${session.topic}" to clipboard!`);
    setTimeout(() => setCopiedTopic(false), 2000);
  };

  useEffect(() => {
    const updateUrl = () => {
      try {
        const cached = localStorage.getItem('prompt_chat_url') || localStorage.getItem('shared_prompt_url');
        if (cached) setPromptChatUrl(cached);
      } catch {}
    };
    updateUrl();
    window.addEventListener('storage', updateUrl);
    window.addEventListener('prompt_chat_url_changed', updateUrl);
    return () => {
      window.removeEventListener('storage', updateUrl);
      window.removeEventListener('prompt_chat_url_changed', updateUrl);
    };
  }, []);

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

  const handlePromptClick = async (e: React.MouseEvent) => {
    try {
      let promptText = ORIGINAL_COACH_PROMPT;
      if (typeof window !== 'undefined') {
        const customPrompt = localStorage.getItem('shared_prompt_text');
        if (customPrompt) promptText = customPrompt;
      }
      await navigator.clipboard.writeText(promptText);
      showSuccess('Opening Prompt Chat & prompt copied to clipboard.');
    } catch {
      // navigation continues
    }
  };

  const handleLinkStatusChange = async (targetIndex: number, newStatus: string) => {
    if (!session) return;
    try {
      if (targetIndex === 0) {
        await updateSession(session.id, { chatgptUrlStatus: newStatus as any });
      } else {
        const branchIndex = targetIndex - 1;
        const currentBranches = [...(session.branchUrls || [])];
        while (currentBranches.length <= branchIndex) {
          currentBranches.push({ url: '', status: 'To Do' });
        }
        const existingB = currentBranches[branchIndex];
        const u = typeof existingB === 'string' ? existingB : (existingB?.url || '');
        currentBranches[branchIndex] = { url: u, status: newStatus };
        await updateSession(session.id, { branchUrls: currentBranches as any });
      }
      showSuccess(`Updated link status to "${newStatus}".`);
      await loadSession();
    } catch (err: any) {
      showError(err.message || 'Failed to update link status.');
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

  const handleConfirmDeleteLink = async () => {
    if (!session || !linkToDelete) return;
    setIsDeletingLink(true);
    try {
      if (linkToDelete.url && linkToDelete.url.trim().length > 0) {
        await removeTopicLink(session.id, linkToDelete.url);
      } else if (linkToDelete.index > 0) {
        const branchIdx = linkToDelete.index - 1;
        const currentBranches = [...(session.branchUrls || [])];
        if (branchIdx < currentBranches.length) {
          currentBranches.splice(branchIdx, 1);
          await updateSession(session.id, { branchUrls: currentBranches as any });
        }
      }
      showSuccess('ChatGPT conversation link removed.');
      setLinkToDelete(null);
      await loadSession();
    } catch (err: any) {
      showError(err.message || 'Failed to delete ChatGPT link.');
    } finally {
      setIsDeletingLink(false);
    }
  };

  const handleConfirmAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    const trimmed = newLinkInput.trim();
    const validation = validateChatGPTUrl(trimmed);
    if (!validation.isValid) {
      setAddLinkError(validation.error || 'Please enter a valid official HTTPS ChatGPT link.');
      return;
    }

    setIsAddingLink(true);
    try {
      await addTopicLink(session.id, trimmed);
      showSuccess('ChatGPT conversation link added to this topic.');
      setIsAddLinkOpen(false);
      setNewLinkInput('');
      setAddLinkError('');
      await loadSession();
    } catch (err: any) {
      setAddLinkError(err.message || 'Failed to add link to topic.');
    } finally {
      setIsAddingLink(false);
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
              {session.score !== null && <ScoreDisplay score={session.score} size="md" />}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#ececec] tracking-tight">
                {session.topic}
              </h1>
              <button
                type="button"
                onClick={handleCopyTopic}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#333333] transition-colors cursor-pointer"
                title="Copy topic text"
                aria-label="Copy topic text"
              >
                {copiedTopic ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex items-center gap-2">
            <a
              href={activeChatgptUrl || 'https://chatgpt.com'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                const currentStatus = (session as any).chatgptUrlStatus || 'To Do';
                if (currentStatus !== 'Doing' && currentStatus !== 'IN_PROGRESS') {
                  handleLinkStatusChange(0, 'Doing');
                }
              }}
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

        {/* Grouped ChatGPT Links for this Topic */}
        <div className="space-y-3 p-4 sm:p-5 rounded-xl bg-[#1a1a1a] border border-[#383838]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2e2e2e] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-gray-200">
                  ChatGPT Links Grouped for this Topic ({session.groupedLinks?.length || session.allChatgptUrls?.length || 1})
                </h3>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                All ChatGPT conversations associated with this topic across practice attempts
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewLinkInput('');
                setAddLinkError('');
                setIsAddLinkOpen(true);
              }}
              className="h-8 px-2.5 text-xs text-blue-300 border-blue-900/60 hover:bg-blue-950/30 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add ChatGPT Link
            </Button>
          </div>

          <div className="space-y-3 pt-1">
            {(session.groupedLinks && session.groupedLinks.length > 0
              ? session.groupedLinks
              : [{
                  url: session.chatgptUrl,
                  status: (session as any).chatgptUrlStatus || 'To Do',
                  attemptNumbers: attempts.map((_, i) => attempts.length - i),
                  attemptCount: attempts.length,
                  bestScore: session.score,
                  latestPracticedAt: session.practicedAt,
                }]
            ).map((link, idx) => {
              const linkStatus =
                link.status === 'COMPLETED' ? 'Done' :
                link.status === 'IN_PROGRESS' ? 'Doing' :
                link.status === 'PLANNED' ? 'To Do' :
                link.status || 'To Do';

              return (
                <div
                  key={link.url || idx}
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#20232b] border border-[#2e3442] hover:border-[#3d4557] transition-all"
                >
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#162740] text-sky-300 border border-[#214373] shrink-0 inline-flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
                        Link #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span>
                        {link.attemptCount > 0 ? (
                          <>
                            Used in <b>{link.attemptCount} {link.attemptCount === 1 ? 'attempt' : 'attempts'}</b>
                          </>
                        ) : (
                          <span className="text-gray-500 italic">No practice logged yet</span>
                        )}
                      </span>
                      {link.latestPracticedAt && (
                        <span>
                          Practiced: {formatDate(link.latestPracticedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar: Status & Practice, then ChatGPT, Prompt, and Delete at outermost right */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap self-end lg:self-auto pt-2 lg:pt-0 border-t border-[#2a303e] lg:border-t-0 w-full lg:w-auto justify-end">
                    {/* Status Dropdown */}
                    <select
                      value={linkStatus}
                      onChange={(e) => handleLinkStatusChange(idx, e.target.value)}
                      className="bg-[#191b22] hover:bg-[#232732] border border-[#394050] text-xs font-semibold rounded-lg px-2 py-1 text-gray-200 cursor-pointer outline-none transition-colors"
                      title="Change link status"
                    >
                      <option value="To Do" className="bg-[#1e2025] text-amber-300">To Do</option>
                      <option value="Doing" className="bg-[#1e2025] text-blue-300">Doing</option>
                      <option value="Done" className="bg-[#1e2025] text-emerald-300">Done</option>
                    </select>

                    {/* Score Button for link */}
                    {link.bestScore !== null && link.bestScore !== undefined ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUrlForAttempt(link.url);
                          setSelectedPracticeIndex(idx);
                          setIsAddScoreOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#162740] hover:bg-[#1e3658] border border-[#234b7f] text-xs font-semibold text-sky-300 hover:text-white transition-colors shadow-sm cursor-pointer"
                        title="Edit score"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>{link.bestScore.toFixed(1)}/10</span>
                        <Pencil className="w-2.5 h-2.5 text-sky-400 ml-0.5 opacity-70" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUrlForAttempt(link.url);
                          setSelectedPracticeIndex(idx);
                          setIsAddScoreOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#272c37] hover:bg-[#343b4a] border border-[#3b4354] text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors shadow-sm cursor-pointer"
                        title="Add score"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Add score</span>
                      </button>
                    )}

                    {/* ChatGPT Link Pill (Green if set, Amber if not) */}
                    <div
                      className={`flex items-center rounded-lg p-0.5 shadow-sm border ${
                        link.url && link.url.trim().length > 0 && link.url !== 'https://chatgpt.com'
                          ? 'bg-[#132c1e] border-[#1e5233] text-emerald-400'
                          : 'bg-[#2c1d0c] border-[#4d3214] text-amber-400'
                      }`}
                    >
                      {link.url && link.url.trim().length > 0 ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            if (linkStatus !== 'Doing' && linkStatus !== 'IN_PROGRESS') {
                              handleLinkStatusChange(idx, 'Doing');
                            }
                          }}
                          title={`Open ChatGPT: ${link.url}`}
                          className="p-1 rounded transition-colors flex items-center justify-center hover:text-emerald-300 hover:bg-[#1a3827]"
                        >
                          <MessageSquareCheck className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPracticeIndex(idx);
                            setSelectedInitialUrl(link.url);
                            setIsEditChatModalOpen(true);
                          }}
                          title="Add ChatGPT Link"
                          className="p-1 rounded transition-colors flex items-center justify-center hover:text-amber-300 hover:bg-[#382610] cursor-pointer"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPracticeIndex(idx);
                          setSelectedInitialUrl(link.url);
                          setIsEditChatModalOpen(true);
                        }}
                        title={link.url ? 'Edit ChatGPT Link' : 'Add ChatGPT Link'}
                        className={`p-1 rounded transition-colors cursor-pointer border-l ${
                          link.url && link.url.trim().length > 0 && link.url !== 'https://chatgpt.com'
                            ? 'border-[#1e5233] hover:text-emerald-300 hover:bg-[#1a3827]'
                            : 'border-[#4d3214] hover:text-amber-300 hover:bg-[#382610]'
                        }`}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Link Prompt Chat (matching https://github.com/h-247/english-grammar-quiz) */}
                    <a
                      href={promptChatUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={handlePromptClick}
                      className="p-1 rounded-lg bg-[#132c1e] hover:bg-[#1a3827] text-emerald-400 border border-[#1e5233] transition-colors flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                      title="Open Prompt Chat"
                      aria-label="Open Prompt Chat"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </a>

                    {/* Delete ChatGPT Link Feature */}
                    <button
                      type="button"
                      onClick={() => setLinkToDelete({ url: link.url, index: idx })}
                      className="p-1 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer border border-[#394050]/60 hover:border-rose-800/60"
                      title="Delete ChatGPT link"
                      aria-label="Delete ChatGPT link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Dialog to Add a ChatGPT Link to this Topic */}
      <Dialog
        isOpen={isAddLinkOpen}
        onClose={() => {
          setIsAddLinkOpen(false);
          setNewLinkInput('');
          setAddLinkError('');
        }}
        title="Add ChatGPT Link to Topic"
        description={`Associate an additional ChatGPT conversation link with "${session.topic}".`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmAddLink} className="space-y-4">
          <Input
            label="ChatGPT Conversation URL"
            type="url"
            required
            placeholder="https://chatgpt.com/c/..."
            value={newLinkInput}
            onChange={(e) => {
              setNewLinkInput(e.target.value);
              setAddLinkError('');
            }}
            error={addLinkError}
            helperText="Paste the link to the ChatGPT conversation you want to group under this topic."
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#383838]">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsAddLinkOpen(false)}
              disabled={isAddingLink}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isAddingLink}>
              Add Link to Topic
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Full Session Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Session Record"
        message={`Are you sure you want to delete "${session.topic}"? This removes the session from your manager. (Your ChatGPT conversation will not be affected).`}
        confirmLabel="Delete Session"
      />

      {/* Delete Single ChatGPT Link Dialog */}
      <ConfirmDialog
        isOpen={linkToDelete !== null}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleConfirmDeleteLink}
        isLoading={isDeletingLink}
        title="Delete ChatGPT Link"
        message={`Are you sure you want to delete this ChatGPT link (${linkToDelete?.url || `Link #${(linkToDelete?.index ?? 0) + 1}`})? All practice attempts associated with this link will also be deleted.`}
        confirmLabel="Delete Link"
      />

      {/* Edit ChatGPT Link Modal */}
      <EditSessionChatModal
        isOpen={isEditChatModalOpen}
        onClose={() => setIsEditChatModalOpen(false)}
        session={session}
        practiceIndex={selectedPracticeIndex}
        initialUrl={selectedInitialUrl}
        onSave={() => loadSession()}
      />

      {/* Add / Update Score Modal */}
      <AddScoreModal
        isOpen={isAddScoreOpen}
        onClose={() => setIsAddScoreOpen(false)}
        session={session}
        practiceIndex={selectedPracticeIndex}
        selectedUrl={selectedUrlForAttempt}
        onSuccess={loadSession}
      />
    </div>
  );
}
