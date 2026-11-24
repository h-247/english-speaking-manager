'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { SessionItem, updateSession } from '@/lib/api-client';
import { ORIGINAL_COACH_PROMPT } from '@/lib/coach-prompt';
import {
  Link2,
  MessageSquareCheck,
  MessageSquarePlus,
  Pencil,
  Plus,
  Copy,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { EditSessionChatModal } from '@/components/sessions/EditSessionChatModal';
import { AddScoreModal } from '@/components/sessions/AddScoreModal';

export interface SessionCardProps {
  session: SessionItem;
  onEdit: (session: SessionItem) => void;
  onDelete: (session: SessionItem) => void;
  onRecordResult?: (session: SessionItem) => void;
  onStatusChange: (
    session: SessionItem,
    newStatus: 'To Do' | 'Doing' | 'Done' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | string,
  ) => void;
  onRefresh?: () => void;
}

interface StatusButtonGroupProps {
  currentStatus: 'To do' | 'Doing' | 'Done' | string;
  onChange: (status: 'To do' | 'Doing' | 'Done') => void;
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

function StatusButtonGroup({
  currentStatus,
  onChange,
  size = 'md',
  ariaLabel = 'Status',
}: StatusButtonGroupProps) {
  const normalized =
    currentStatus === 'COMPLETED' || currentStatus === 'Done'
      ? 'Done'
      : currentStatus === 'IN_PROGRESS' || currentStatus === 'Doing'
        ? 'Doing'
        : 'To do';

  const statuses: Array<{
    id: 'To do' | 'Doing' | 'Done';
    label: string;
    activeClass: string;
    inactiveTextClass: string;
  }> = [
    {
      id: 'To do',
      label: 'To do',
      activeClass: 'bg-[#142338] text-sky-300 border border-sky-500/60 shadow-sm font-semibold',
      inactiveTextClass: 'text-gray-400',
    },
    {
      id: 'Doing',
      label: 'Doing',
      activeClass: 'bg-[#2b1d0c] text-amber-400 border border-amber-500/60 shadow-sm font-semibold',
      inactiveTextClass: 'text-gray-400',
    },
    {
      id: 'Done',
      label: 'Done',
      activeClass: 'bg-[#102a1c] text-emerald-400 border border-emerald-500/60 shadow-sm font-semibold',
      inactiveTextClass: 'text-gray-400',
    },
  ];

  const padClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  return (
    <div
      className="inline-flex items-center rounded-xl bg-[#20232b] border border-[#383d4a] p-0.5 relative shrink-0 shadow-sm"
      role="group"
      aria-label={ariaLabel}
    >
      {/* Hidden select for backwards compatibility and screen readers */}
      <select
        aria-label={ariaLabel}
        value={normalized}
        onChange={(e) => onChange(e.target.value as any)}
        className="sr-only"
        tabIndex={-1}
      >
        <option value="To do">To do</option>
        <option value="Doing">Doing</option>
        <option value="Done">Done</option>
      </select>

      {statuses.map((s, index) => {
        const isActive = normalized === s.id;
        const prevActive = index > 0 && normalized === statuses[index - 1].id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-pressed={isActive}
            className={`inline-flex items-center justify-center rounded-lg transition-all cursor-pointer select-none active:scale-95 ${padClass} ${
              index > 0 && !isActive && !prevActive ? 'border-l border-[#333846]' : ''
            } ${
              isActive
                ? s.activeClass
                : `${s.inactiveTextClass} hover:text-white hover:bg-[#282d38]`
            }`}
          >
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function SessionCard({
  session,
  onEdit,
  onDelete,
  onStatusChange,
  onRefresh,
}: SessionCardProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [isEditChatOpen, setIsEditChatOpen] = React.useState(false);
  const [isAddScoreOpen, setIsAddScoreOpen] = React.useState(false);
  const [copiedTopic, setCopiedTopic] = React.useState(false);
  const [isAddingNewLink, setIsAddingNewLink] = React.useState(false);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      target.closest('button, a, select, input, textarea, [role="button"], [role="option"]')
    ) {
      return;
    }
    router.push(`/sessions/${session.id}`);
  };

  const handleCopyTopic = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let copied = false;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(session.topic);
        copied = true;
      }
    } catch {
      // clipboard API failed (e.g. document not focused), fall through to execCommand
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

  // Grouped links for this topic
  const baseLinks = React.useMemo(() => {
    if (session.groupedLinks && session.groupedLinks.length > 0) {
      return session.groupedLinks;
    }
    const branchLinks = (session.branchUrls || []).map((b: any) => ({
      url: typeof b === 'string' ? b : b?.url || '',
      status: typeof b === 'object' && b?.status ? b.status : 'To Do',
      attemptNumbers: [],
      attemptCount: 0,
      bestScore: null,
      latestPracticedAt: null,
    }));
    return [
      {
        url: session.chatgptUrl,
        status: (session as any).chatgptUrlStatus || 'To do',
        attemptNumbers: session.attempts
          ? session.attempts.map((_, i) => session.attempts!.length - i)
          : [1],
        attemptCount: session.attemptCount || (session.score !== null ? 1 : 0),
        bestScore: session.score,
        latestPracticedAt: session.practicedAt,
      },
      ...branchLinks,
    ];
  }, [session]);

  const isLinkDone = (status?: string) =>
    status === 'Done' || status === 'COMPLETED';
  const isLinkDoing = (status?: string) =>
    status === 'Doing' || status === 'IN_PROGRESS';

  // Check if all existing practices are done
  const areAllLinksDone = React.useMemo(() => {
    return baseLinks.length > 0 && baseLinks.every((l) => isLinkDone(l.status));
  }, [baseLinks]);

  // Real links only (do not automatically create a new link until user clicks 'Add ChatGPT link')
  const links = baseLinks;

  // Topic score is the highest score among all ChatGPT links of this topic
  const topicScore = React.useMemo(() => {
    const linkScores =
      links
        .map((l) => l.bestScore)
        .filter((s): s is number => s !== null && s !== undefined) || [];
    const attemptScores = session.attempts?.map((a) => a.score) || [];
    const allScores = [...linkScores, ...attemptScores];
    if (session.score !== null && session.score !== undefined) allScores.push(session.score);
    return allScores.length > 0 ? Math.max(...allScores) : null;
  }, [links, session]);

  // Determine active practice link:
  // 1. First practice with status 'Doing' / 'IN_PROGRESS'
  // 2. Or first practice that is not Done ('To do')
  // 3. Or latest practice (when all are done, stay on the completed practice without automatically editing status)
  const nextPracticeIndex = React.useMemo(() => {
    const doingIdx = links.findIndex((l) => isLinkDoing(l.status));
    if (doingIdx !== -1) return doingIdx;

    const todoIdx = links.findIndex((l) => !isLinkDone(l.status));
    if (todoIdx !== -1) return todoIdx;

    return Math.max(0, links.length - 1);
  }, [links]);

  const nextPracticeLink = links[nextPracticeIndex] || links[0];

  const nextLinkStatus =
    nextPracticeLink?.status === 'COMPLETED' || nextPracticeLink?.status === 'Done'
      ? 'Done'
      : nextPracticeLink?.status === 'IN_PROGRESS' || nextPracticeLink?.status === 'Doing'
        ? 'Doing'
        : 'To do';

  const normalizedTopicStatus =
    session.status === 'COMPLETED' || session.status === 'Done'
      ? 'Done'
      : session.status === 'IN_PROGRESS' || session.status === 'Doing'
        ? 'Doing'
        : 'To do';

  const [promptChatUrl, setPromptChatUrl] = React.useState<string>('');

  React.useEffect(() => {
    const updateUrl = () => {
      try {
        const stored = localStorage.getItem('prompt_chat_url');
        if (stored !== null) {
          setPromptChatUrl(stored);
        } else {
          const shared = localStorage.getItem('shared_prompt_url');
          setPromptChatUrl(shared || '');
        }
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

  const handlePromptClick = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      let promptText = ORIGINAL_COACH_PROMPT;
      if (typeof window !== 'undefined') {
        const customPrompt = localStorage.getItem('shared_prompt_text');
        if (customPrompt) promptText = customPrompt;
      }
      await navigator.clipboard.writeText(promptText);
      showSuccess('Opening Prompt Chat & prompt copied to clipboard.');
      if (nextLinkStatus !== 'Doing') {
        handleLinkStatusChange(nextPracticeIndex, 'Doing');
      }
    } catch {
      // navigation continues
    }
  };

  const handleDataRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('session_updated'));
    }
  };

  const handleLinkStatusChange = async (target: number | string, newStatus: string) => {
    if (!session) return;
    const normalizedStatus = newStatus === 'To do' ? 'To Do' : newStatus;

    let targetIndex = typeof target === 'number' ? target : links.findIndex((l) => l.url === target);
    if (targetIndex < 0) targetIndex = 0;

    try {
      if (targetIndex === 0) {
        const updates: any = {
          chatgptUrlStatus: normalizedStatus,
        };
        await updateSession(session.id, updates);
      } else {
        const branchIndex = targetIndex - 1;
        const currentBranches = [...(session.branchUrls || [])];
        while (currentBranches.length <= branchIndex) {
          currentBranches.push({ url: '', status: 'To Do' });
        }
        const existingB = currentBranches[branchIndex];
        const u = typeof existingB === 'string' ? existingB : (existingB?.url || '');
        currentBranches[branchIndex] = { url: u, status: normalizedStatus };

        await updateSession(session.id, { branchUrls: currentBranches as any });
      }
      showSuccess(`Updated practice status to "${newStatus}".`);
      handleDataRefresh();
    } catch (err: any) {
      showError(err.message || 'Failed to update link status.');
    }
  };

  const handleOpenChatGPT = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (nextLinkStatus !== 'Doing') {
      handleLinkStatusChange(nextPracticeIndex, 'Doing');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-[#1a1c20] border border-[#2b303c] hover:border-[#404756] rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg transition-all group cursor-pointer"
    >
      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4">
        {/* Title Header with copy topic button & score point */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
              <Link
                href={`/sessions/${session.id}`}
                className="text-base font-bold text-[#f0f2f5] hover:text-white hover:underline transition-colors line-clamp-2 leading-tight"
                title={session.topic}
              >
                {session.topic}
              </Link>
              <button
                type="button"
                onClick={handleCopyTopic}
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-[#282d38] transition-colors shrink-0 cursor-pointer"
                title="Copy topic text"
                aria-label="Copy topic text"
              >
                {copiedTopic ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              {topicScore !== null && topicScore !== undefined ? (
                <ScoreDisplay score={topicScore} size="sm" showMaxScore={false} />
              ) : (
                <span className="text-xs text-gray-500 font-mono italic">No score</span>
              )}
            </div>
          </div>
        </div>

        {/* Topic / Book Statuses under topic name */}
        <div className="flex items-center gap-2">
          <StatusButtonGroup
            currentStatus={normalizedTopicStatus}
            onChange={(newStatus) =>
              onStatusChange(session, newStatus === 'To do' ? 'To Do' : newStatus)
            }
            ariaLabel="Status"
            size="sm"
          />
        </div>

        {/* Next Practice / Active Conversation Section */}
        {isLinkDone(nextLinkStatus) ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAddingNewLink(true);
                setIsEditChatOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2c1d0c] hover:bg-[#3d2810] border border-[#4d3214] hover:border-[#6e461b] text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors shadow-sm cursor-pointer shrink-0"
              title="Add ChatGPT Link"
              aria-label="Add ChatGPT Link"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add ChatGPT link</span>
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#20232b] border border-[#2e3442] space-y-2.5">
            {/* Line 1: Link Name & Status Buttons for Next Practice Link */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#162740] text-sky-300 border border-[#214373] shrink-0 inline-flex items-center justify-center min-w-[22px]"
                title={`ChatGPT link ${nextPracticeIndex + 1}`}
                aria-label={`ChatGPT link ${nextPracticeIndex + 1}`}
              >
                <span>{nextPracticeIndex + 1}</span>
              </span>
              <StatusButtonGroup
                currentStatus={nextLinkStatus}
                onChange={(newStatus) =>
                  handleLinkStatusChange(nextPracticeIndex, newStatus)
                }
                ariaLabel="Change next practice link status"
                size="sm"
              />
            </div>

            {/* Line 2: Score Button, Prompt chat link pill & ChatGPT Link Button */}
            <div className="flex items-center justify-start gap-1.5 flex-wrap">
              {/* Score Button for Next Practice Link */}
              {nextPracticeLink?.bestScore !== null &&
              nextPracticeLink?.bestScore !== undefined ? (
                <button
                  type="button"
                  onClick={() => setIsAddScoreOpen(true)}
                  className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg bg-[#162740] hover:bg-[#1e3658] border border-[#234b7f] text-xs font-semibold text-sky-300 hover:text-white transition-colors shadow-sm shrink-0 cursor-pointer font-mono"
                  title="Edit score"
                  aria-label="Edit score"
                >
                  <span>{nextPracticeLink.bestScore.toFixed(1)}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddScoreOpen(true)}
                  className="p-1.5 rounded-lg bg-[#272c37] hover:bg-[#343b4a] border border-[#3b4354] text-xs font-semibold text-amber-300 hover:text-amber-200 transition-colors shadow-sm shrink-0 cursor-pointer flex items-center justify-center"
                  title="Add score"
                  aria-label="Add score"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                </button>
              )}

              {/* Link Prompt Chat */}
              {promptChatUrl && promptChatUrl.trim().length > 0 ? (
                <a
                  href={promptChatUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handlePromptClick}
                  className="p-1.5 rounded-lg bg-[#132c1e] hover:bg-[#1a3827] text-emerald-400 border border-[#1e5233] transition-colors flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                  title="Open Prompt Chat"
                  aria-label="Open Prompt Chat"
                >
                  <Link2 className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handlePromptClick}
                  className="p-1.5 rounded-lg bg-[#272a33] hover:bg-[#343846] text-gray-400 hover:text-gray-200 border border-[#3b4150] transition-colors flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                  title="Prompt link is empty (click to copy prompt)"
                  aria-label="Prompt link is empty"
                >
                  <Link2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* ChatGPT Link Pill (Green if set, Amber if not) */}
              <div
                className={`flex items-center rounded-lg p-0.5 shadow-sm border ${
                  nextPracticeLink?.url &&
                  nextPracticeLink.url.trim().length > 0 &&
                  nextPracticeLink.url !== 'https://chatgpt.com'
                    ? 'bg-[#132c1e] border-[#1e5233] text-emerald-400'
                    : 'bg-[#2c1d0c] border-[#4d3214] text-amber-400'
                }`}
              >
                {nextPracticeLink?.url && nextPracticeLink.url.trim().length > 0 ? (
                  <a
                    href={nextPracticeLink.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={handleOpenChatGPT}
                    title={`Open ChatGPT: ${nextPracticeLink.url}`}
                    className="p-1.5 rounded transition-colors flex items-center justify-center hover:text-emerald-300 hover:bg-[#1a3827]"
                  >
                    <MessageSquareCheck className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNewLink(false);
                      setIsEditChatOpen(true);
                    }}
                    title="Add ChatGPT Link"
                    className="p-1.5 rounded transition-colors flex items-center justify-center hover:text-amber-300 hover:bg-[#382610] cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewLink(false);
                    setIsEditChatOpen(true);
                  }}
                  title={nextPracticeLink?.url ? 'Edit ChatGPT Link' : 'Add ChatGPT Link'}
                  className={`p-1.5 rounded transition-colors cursor-pointer border-l ${
                    nextPracticeLink?.url &&
                    nextPracticeLink.url.trim().length > 0 &&
                    nextPracticeLink.url !== 'https://chatgpt.com'
                      ? 'border-[#1e5233] hover:text-emerald-300 hover:bg-[#1a3827]'
                      : 'border-[#4d3214] hover:text-amber-300 hover:bg-[#382610]'
                  }`}
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Session ChatGPT Link Modal */}
      <EditSessionChatModal
        isOpen={isEditChatOpen}
        onClose={() => {
          setIsEditChatOpen(false);
          setIsAddingNewLink(false);
        }}
        session={session}
        practiceIndex={isAddingNewLink ? baseLinks.length : nextPracticeIndex}
        initialUrl={isAddingNewLink ? '' : nextPracticeLink?.url}
        onSave={() => {
          handleDataRefresh();
        }}
      />

      {/* Add / Update Score Modal */}
      <AddScoreModal
        isOpen={isAddScoreOpen}
        onClose={() => setIsAddScoreOpen(false)}
        session={session}
        practiceIndex={nextPracticeIndex}
        selectedUrl={nextPracticeLink?.url}
        onSuccess={handleDataRefresh}
      />
    </div>
  );
}
