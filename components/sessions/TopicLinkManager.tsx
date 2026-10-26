'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  PRESET_TOPICS,
  PresetTopic,
  getPresetTopicByName,
} from '@/lib/preset-topics';
import {
  SessionItem,
  createSession,
  addTopicLink,
  removeTopicLink,
  fetchSession,
  deleteAttempt,
} from '@/lib/api-client';
import { validateChatGPTUrl } from '@/lib/chatgpt-url';
import { formatDate } from '@/lib/format-date';
import { useToast } from '@/components/ui/Toast';
import {
  ExternalLink,
  Copy,
  Check,
  Plus,
  Trash2,
  GitBranch,
  Link as LinkIcon,
  MessageSquare,
  Award,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  FolderPlus,
} from 'lucide-react';

export interface TopicLinkManagerProps {
  sessions: SessionItem[];
  onRefresh: () => Promise<void> | void;
  onRecordResult: (session: SessionItem, initialUrl?: string) => void;
  onEditSession: (session: SessionItem) => void;
  onDeleteSession: (session: SessionItem) => void;
  onOpenAddSession: (initialTopic?: string) => void;
  initialSelectedTopic?: string;
}

interface CombinedTopic {
  name: string;
  icon: string;
  description: string;
  isPreset: boolean;
  session?: SessionItem;
}

export function TopicLinkManager({
  sessions,
  onRefresh,
  onRecordResult,
  onEditSession,
  onDeleteSession,
  onOpenAddSession,
  initialSelectedTopic,
}: TopicLinkManagerProps) {
  const { showSuccess, showError } = useToast();

  // Map existing sessions by lowercase topic name
  const sessionByTopicMap = useMemo(() => {
    const map = new Map<string, SessionItem>();
    for (const s of sessions) {
      map.set(s.topic.trim().toLowerCase(), s);
    }
    return map;
  }, [sessions]);

  // Combine preset topics with any custom user topics
  const combinedTopics = useMemo<CombinedTopic[]>(() => {
    const list: CombinedTopic[] = [];
    const seenTopics = new Set<string>();

    // 1. Add preset topics
    for (const preset of PRESET_TOPICS) {
      const lower = preset.name.trim().toLowerCase();
      seenTopics.add(lower);
      list.push({
        name: preset.name,
        icon: preset.icon,
        description: preset.description,
        isPreset: true,
        session: sessionByTopicMap.get(lower),
      });
    }

    // 2. Add custom user topics that are not in presets
    for (const s of sessions) {
      const lower = s.topic.trim().toLowerCase();
      if (!seenTopics.has(lower)) {
        seenTopics.add(lower);
        list.push({
          name: s.topic,
          icon: '💬',
          description: s.notes || 'Custom speaking practice topic.',
          isPreset: false,
          session: s,
        });
      }
    }

    return list;
  }, [sessions, sessionByTopicMap]);

  // Selected topic name state
  const [selectedTopicName, setSelectedTopicName] = useState<string>(() => {
    if (initialSelectedTopic) {
      const found = combinedTopics.find(
        (t) => t.name.toLowerCase() === initialSelectedTopic.toLowerCase(),
      );
      if (found) return found.name;
    }
    return combinedTopics[0]?.name || 'Job & Study';
  });

  // Detailed selected session state (with attempts and groupedLinks)
  const [detailedSession, setDetailedSession] = useState<SessionItem | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Add Link inline form states
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [urlError, setUrlError] = useState('');

  // Link deletion confirm states
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const [isDeletingLink, setIsDeletingLink] = useState(false);

  // Attempt deletion confirm states
  const [attemptToDelete, setAttemptToDelete] = useState<string | null>(null);
  const [isDeletingAttempt, setIsDeletingAttempt] = useState(false);

  // Copied link feedback
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Active topic object
  const activeTopic = useMemo(() => {
    return (
      combinedTopics.find(
        (t) => t.name.toLowerCase() === selectedTopicName.toLowerCase(),
      ) || combinedTopics[0]
    );
  }, [combinedTopics, selectedTopicName]);

  const activeSession = activeTopic?.session;

  // Load full session details (groupedLinks, attempts) when activeSession changes
  const loadActiveDetails = useCallback(async () => {
    if (!activeSession) {
      setDetailedSession(null);
      return;
    }
    setIsLoadingDetails(true);
    try {
      const full = await fetchSession(activeSession.id);
      setDetailedSession(full);
    } catch {
      // Fallback to basic session if detail fetch fails
      setDetailedSession(activeSession);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [activeSession]);

  useEffect(() => {
    loadActiveDetails();
  }, [loadActiveDetails]);

  // Handle URL copy
  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      showSuccess('ChatGPT conversation link copied to clipboard.');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      showError('Failed to copy link.');
    }
  };

  // Handle adding a ChatGPT link to the currently selected topic
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError('');

    const trimmedUrl = newLinkUrl.trim();
    if (!trimmedUrl) {
      setUrlError('Please enter a ChatGPT conversation URL.');
      return;
    }

    const validation = validateChatGPTUrl(trimmedUrl);
    if (!validation.isValid) {
      setUrlError(validation.error || 'Please enter a valid HTTPS ChatGPT link.');
      return;
    }

    const normalizedUrl = validation.normalizedUrl || trimmedUrl;

    setIsAddingLink(true);
    try {
      if (activeSession) {
        // Topic already exists in DB -> check duplicates then add to topic
        const allUrls = activeSession.allChatgptUrls || [
          activeSession.chatgptUrl,
          ...(activeSession.branchUrls || []),
        ];
        if (allUrls.some((u) => u.toLowerCase() === normalizedUrl.toLowerCase())) {
          setUrlError('This ChatGPT link is already saved under this topic.');
          setIsAddingLink(false);
          return;
        }

        await addTopicLink(activeSession.id, normalizedUrl);
        showSuccess(`Added ChatGPT link to "${activeTopic.name}".`);
      } else {
        // Topic does not exist in DB yet -> automatically create session with this topic!
        await createSession({
          topic: activeTopic.name,
          chatgptUrl: normalizedUrl,
          status: 'IN_PROGRESS',
          notes: activeTopic.description,
          tags: [activeTopic.name],
        });
        showSuccess(`Created topic "${activeTopic.name}" with ChatGPT link.`);
      }

      setNewLinkUrl('');
      await onRefresh();
    } catch (err: any) {
      showError(err.message || 'Failed to add ChatGPT link.');
    } finally {
      setIsAddingLink(false);
    }
  };

  // Handle removing a branch link
  const handleConfirmRemoveLink = async () => {
    if (!activeSession || !linkToDelete) return;
    setIsDeletingLink(true);
    try {
      await removeTopicLink(activeSession.id, linkToDelete);
      showSuccess('Removed ChatGPT link from topic.');
      setLinkToDelete(null);
      await onRefresh();
    } catch (err: any) {
      showError(err.message || 'Failed to remove link.');
    } finally {
      setIsDeletingLink(false);
    }
  };

  // Handle deleting a practice attempt
  const handleConfirmDeleteAttempt = async () => {
    if (!activeSession || !attemptToDelete) return;
    setIsDeletingAttempt(true);
    try {
      await deleteAttempt(activeSession.id, attemptToDelete);
      showSuccess('Practice attempt deleted.');
      setAttemptToDelete(null);
      await onRefresh();
    } catch (err: any) {
      showError(err.message || 'Failed to delete practice attempt.');
    } finally {
      setIsDeletingAttempt(false);
    }
  };

  // Grouped links to display
  const linksToDisplay = useMemo(() => {
    if (detailedSession?.groupedLinks && detailedSession.groupedLinks.length > 0) {
      return detailedSession.groupedLinks;
    }
    if (activeSession?.chatgptUrl) {
      const links = [
        {
          url: activeSession.chatgptUrl,
          isPrimary: true,
          attemptNumbers: [],
          attemptCount: activeSession.attemptCount || 0,
          bestScore: activeSession.score,
          latestPracticedAt: activeSession.practicedAt,
        },
      ];
      if (activeSession.branchUrls) {
        for (const b of activeSession.branchUrls) {
          links.push({
            url: b,
            isPrimary: false,
            attemptNumbers: [],
            attemptCount: 0,
            bestScore: null,
            latestPracticedAt: null,
          });
        }
      }
      return links;
    }
    return [];
  }, [detailedSession, activeSession]);

  const attemptsToDisplay = detailedSession?.attempts || [];

  return (
    <div className="space-y-6">
      {/* Topics Header & Category Selector */}
      <div className="bg-[#262626] border border-[#333333] rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#333333]/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <h2 className="text-base sm:text-lg font-bold text-[#ececec]">
                Speaking Practice Topics
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Select a speaking topic below to manage and practice with its ChatGPT conversation links.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenAddSession()}
            className="text-xs font-semibold shrink-0"
          >
            <FolderPlus className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            + Custom Topic
          </Button>
        </div>

        {/* Horizontal Scrollable / Wrapping Topic Pills */}
        <div className="pt-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-700">
            {combinedTopics.map((topic) => {
              const isSelected =
                topic.name.toLowerCase() === selectedTopicName.toLowerCase();
              const hasSession = Boolean(topic.session);
              const linkCount = topic.session
                ? (topic.session.branchUrls?.length || 0) + 1
                : 0;
              const score = topic.session?.score;

              return (
                <button
                  key={topic.name}
                  onClick={() => {
                    setSelectedTopicName(topic.name);
                    setUrlError('');
                    setNewLinkUrl('');
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all shrink-0 border select-none ${
                    isSelected
                      ? 'bg-[#333333] text-white border-white/40 shadow-sm ring-1 ring-white/20'
                      : 'bg-[#1e1e1e] text-gray-300 border-[#333333] hover:bg-[#2a2a2a] hover:text-white hover:border-[#444444]'
                  }`}
                >
                  <span className="text-sm">{topic.icon}</span>
                  <span className="font-semibold">{topic.name}</span>

                  {hasSession ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                        score !== null && score !== undefined
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          : 'bg-[#2a2a2a] text-gray-300'
                      }`}
                    >
                      {score !== null && score !== undefined
                        ? `${score.toFixed(1)}/10`
                        : `${linkCount} link${linkCount > 1 ? 's' : ''}`}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-normal">
                      + Add
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Topic Workspace Panel */}
      <div className="bg-[#262626] border border-[#333333] rounded-xl overflow-hidden shadow-sm">
        {/* Topic Banner & Meta */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-[#2a2a2a] to-[#262626] border-b border-[#333333]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-2xl p-2 bg-[#1f1f1f] border border-[#333333] rounded-lg">
                  {activeTopic.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {activeTopic.name}
                    </h3>
                    {activeSession ? (
                      <StatusBadge status={activeSession.status} />
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-800 text-gray-400 border border-neutral-700">
                        Ready to Start
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                    {activeTopic.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Stats */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {activeSession && (
                <>
                  <div className="flex items-center gap-2 bg-[#1f1f1f] px-3 py-1.5 rounded-lg border border-[#333333] text-xs">
                    <Award className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-gray-400">Best Score:</span>
                    <ScoreDisplay score={activeSession.score} size="sm" />
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#1f1f1f] px-3 py-1.5 rounded-lg border border-[#333333] text-xs text-gray-300">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      {detailedSession?.attempts?.length ?? activeSession.attemptCount ?? 0} attempt(s)
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onRecordResult(activeSession)}
                    className="text-xs"
                  >
                    <Award className="w-3.5 h-3.5 mr-1.5 text-yellow-500" />
                    Record Results
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditSession(activeSession)}
                    title="Edit topic details"
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Edit
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteSession(activeSession)}
                    title="Delete session"
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Step 1: Add ChatGPT Link Form for Selected Topic */}
        <div className="p-5 sm:p-6 border-b border-[#333333] bg-[#222222]/80">
          <form onSubmit={handleAddLink} className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="chatgpt-link-input"
                className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5"
              >
                <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                Add ChatGPT Link to {activeTopic.name}
              </label>
              <a
                href="https://chatgpt.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1"
              >
                Open ChatGPT
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 relative">
                <input
                  id="chatgpt-link-input"
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => {
                    setNewLinkUrl(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  placeholder="Paste ChatGPT conversation link (e.g. https://chatgpt.com/c/...)"
                  className="w-full bg-[#171717] border border-[#333333] focus:border-white focus:ring-1 focus:ring-white rounded-lg px-3.5 py-2.5 text-sm text-[#ececec] placeholder-gray-500 outline-none transition-colors"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isAddingLink}
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Link to Topic
              </Button>
            </div>

            {urlError && (
              <p className="text-xs text-red-400 font-medium animate-in fade-in">
                {urlError}
              </p>
            )}

            <p className="text-[11px] text-gray-500">
              Paste the URL of your 5-minute B2 practice chat with the English Speaking Coach prompt. You can save multiple chat branches or repeat sessions for this topic.
            </p>
          </form>
        </div>

        {/* Step 2: Saved ChatGPT Links Grouped Under this Topic */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              ChatGPT Practice Links for this Topic ({linksToDisplay.length})
            </h4>
          </div>

          {linksToDisplay.length === 0 ? (
            <div className="bg-[#1e1e1e] border border-dashed border-[#333333] rounded-xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center mx-auto text-xl text-gray-400">
                {activeTopic.icon}
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <p className="text-sm font-semibold text-gray-300">
                  No ChatGPT links saved for {activeTopic.name} yet
                </p>
                <p className="text-xs text-gray-500">
                  Copy the speaking coach prompt, start practicing this topic on ChatGPT, then paste the conversation link above!
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="https://chatgpt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-gray-200 transition-colors"
                >
                  Start Speaking on ChatGPT
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {linksToDisplay.map((link, idx) => {
                const isCopied = copiedUrl === link.url;

                return (
                  <div
                    key={link.url}
                    className="bg-[#1e1e1e] border border-[#333333] hover:border-[#444444] rounded-lg p-3.5 sm:p-4 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {link.isPrimary ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60 shrink-0">
                            <Sparkles className="w-3 h-3 text-blue-400" />
                            Primary Chat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-gray-300 border border-neutral-700 shrink-0">
                            <GitBranch className="w-3 h-3 text-purple-400" />
                            Branch Chat
                          </span>
                        )}

                        <span className="text-xs font-mono text-gray-300 truncate max-w-sm sm:max-w-md lg:max-w-lg select-all">
                          {link.url}
                        </span>
                      </div>

                      {/* Performance indicators */}
                      <div className="flex items-center gap-2 shrink-0">
                        {link.attemptCount > 0 ? (
                          <span className="text-xs text-gray-400">
                            <b className="text-gray-200">{link.attemptCount}</b> attempt(s)
                            {link.bestScore !== null && (
                              <span className="ml-1.5 text-emerald-400 font-bold">
                                · Best: {link.bestScore.toFixed(1)}/10
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            No score recorded yet
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions for this specific link */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#2a2a2a] gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#292929] hover:bg-[#333333] text-gray-200 text-xs font-medium border border-[#3a3a3a] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          Open in ChatGPT
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(link.url)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#292929] hover:bg-[#333333] text-gray-300 text-xs font-medium border border-[#3a3a3a] transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-gray-400" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeSession && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => onRecordResult(activeSession, link.url)}
                            className="text-xs"
                          >
                            <Award className="w-3.5 h-3.5 mr-1 text-yellow-500" />
                            Practice Here
                          </Button>
                        )}

                        {!link.isPrimary && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLinkToDelete(link.url)}
                            title="Remove this branch link"
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 3: Practice Attempts History for this Selected Topic */}
        {attemptsToDisplay.length > 0 && (
          <div className="p-5 sm:p-6 border-t border-[#333333] space-y-3 bg-[#242424]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Practice History ({attemptsToDisplay.length} attempt{attemptsToDisplay.length > 1 ? 's' : ''})
              </h4>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#333333]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1c1c1c] text-gray-400 font-semibold border-b border-[#333333]">
                  <tr>
                    <th className="py-2.5 px-3">Attempt</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Pass / Fail</th>
                    <th className="py-2.5 px-3">Score</th>
                    <th className="py-2.5 px-3">ChatGPT Link Used</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a] text-gray-300">
                  {attemptsToDisplay.map((att, i) => {
                    const attemptNumber = attemptsToDisplay.length - i;
                    return (
                      <tr key={att.id} className="hover:bg-[#282828] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          Attempt #{attemptNumber}
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">
                          {formatDate(att.practicedAt)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-emerald-400 font-medium">{att.passCount} Pass</span>
                          <span className="text-gray-500 mx-1">/</span>
                          <span className="text-rose-400 font-medium">{att.failCount} Fail</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <ScoreDisplay score={att.score} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate font-mono text-[11px] text-gray-400">
                          {att.chatgptUrl ? (
                            <a
                              href={att.chatgptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{att.chatgptUrl}</span>
                            </a>
                          ) : (
                            <span className="text-gray-500">Primary Link</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setAttemptToDelete(att.id)}
                            title="Delete this practice attempt"
                            className="text-gray-500 hover:text-red-400 p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={Boolean(linkToDelete)}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleConfirmRemoveLink}
        isLoading={isDeletingLink}
        title="Remove ChatGPT Link"
        message="Are you sure you want to remove this ChatGPT conversation link from this topic? Practice history will be preserved."
        confirmLabel="Remove Link"
      />

      <ConfirmDialog
        isOpen={Boolean(attemptToDelete)}
        onClose={() => setAttemptToDelete(null)}
        onConfirm={handleConfirmDeleteAttempt}
        isLoading={isDeletingAttempt}
        title="Delete Practice Attempt"
        message="Are you sure you want to delete this practice attempt? The topic score will be updated to reflect the remaining attempts."
        confirmLabel="Delete Attempt"
      />
    </div>
  );
}
