'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { SessionItem, updateSession } from '@/lib/api-client';
import { formatDateShort } from '@/lib/format-date';
import { getPresetTopicByName } from '@/lib/preset-topics';
import {
  Edit2,
  Trash2,
  Link2,
  MessageSquareCheck,
  MessageSquarePlus,
  Pencil,
  Trophy,
  Plus,
} from 'lucide-react';
import { ORIGINAL_COACH_PROMPT } from '@/lib/coach-prompt';
import { useToast } from '@/components/ui/Toast';
import { EditSessionChatModal } from '@/components/sessions/EditSessionChatModal';
import { AddScoreModal } from '@/components/sessions/AddScoreModal';

export interface SessionTableProps {
  sessions: SessionItem[];
  onEdit: (session: SessionItem) => void;
  onDelete: (session: SessionItem) => void;
  onRecordResult?: (session: SessionItem) => void;
  onStatusChange: (session: SessionItem, newStatus: 'To Do' | 'Doing' | 'Done' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | string) => void;
  onRefresh?: () => void;
}

export function SessionTable({
  sessions,
  onEdit,
  onDelete,
  onRecordResult,
  onStatusChange,
  onRefresh,
}: SessionTableProps) {
  const { showSuccess } = useToast();
  const [promptChatUrl, setPromptChatUrl] = useState<string>('https://chatgpt.com');
  const [chatModalSession, setChatModalSession] = useState<SessionItem | null>(null);
  const [scoreModalSession, setScoreModalSession] = useState<SessionItem | null>(null);

  React.useEffect(() => {
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

  const handlePromptClick = async () => {
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

  const handleDataRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('session_updated'));
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#383838] bg-[#262626]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#383838] bg-[#1f1f1f] text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <th className="py-3.5 px-4">Topic</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Score</th>
            <th className="py-3.5 px-4">Pass / Fail</th>
            <th className="py-3.5 px-4">Tags</th>
            <th className="py-3.5 px-4">Practiced / Created</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#333333] text-sm">
          {sessions.map((session) => {
            const preset = getPresetTopicByName(session.topic);
            const icon = preset ? preset.icon : '💬';
            const chatUrl = session.chatgptUrl;

            return (
              <tr
                key={session.id}
                className="hover:bg-[#2c2c2c] transition-colors group"
              >
                {/* Topic Selection */}
                <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl shrink-0 mt-0.5" title={preset ? preset.name : session.topic}>
                      {icon}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/sessions/${session.id}`}
                          className="font-semibold text-[#ececec] hover:underline truncate block"
                          title={session.topic}
                        >
                          {session.topic}
                        </Link>
                      </div>
                      {session.notes && (
                        <span className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                          {session.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Status with quick switcher */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <select
                    value={
                      session.status === 'COMPLETED' ? 'Done' :
                      session.status === 'IN_PROGRESS' ? 'Doing' :
                      session.status === 'PLANNED' ? 'To Do' :
                      session.status || 'To Do'
                    }
                    onChange={(e) => onStatusChange(session, e.target.value)}
                    className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer rounded px-2 py-1 border border-[#3e3e3e] hover:border-gray-400 text-gray-200 transition-colors"
                    title="Click to change status"
                  >
                    <option value="To Do" className="bg-[#262626] text-amber-300">
                      To Do
                    </option>
                    <option value="Doing" className="bg-[#262626] text-blue-300">
                      Doing
                    </option>
                    <option value="Done" className="bg-[#262626] text-emerald-300">
                      Done
                    </option>
                  </select>
                </td>

                {/* Score */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <ScoreDisplay score={session.score} size="md" />
                    {session.attemptCount !== undefined && session.attemptCount > 0 && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 font-mono rounded bg-[#1c2e42] text-sky-300 border border-sky-800/50"
                        title={`${session.attemptCount} practice ${session.attemptCount === 1 ? 'attempt' : 'attempts'} recorded`}
                      >
                        {session.attemptCount}x
                      </span>
                    )}
                  </div>
                </td>

                {/* Score Column with Feature Add Score */}
                <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                  {session.score !== null && session.score !== undefined ? (
                    <button
                      type="button"
                      onClick={() => setScoreModalSession(session)}
                      className="inline-flex items-center gap-1 text-gray-200 font-bold hover:text-white transition-colors cursor-pointer"
                      title="Edit score"
                    >
                      <b className="text-emerald-400">{session.score.toFixed(1)}</b> / 10
                      <Pencil className="w-2.5 h-2.5 text-gray-500 opacity-70" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setScoreModalSession(session)}
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                      title="Add score"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add score</span>
                    </button>
                  )}
                </td>

                {/* Tags */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1 flex-wrap max-w-xs">
                    {session.tags && session.tags.length > 0 ? (
                      session.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#333333] text-gray-300"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </div>
                </td>

                {/* Dates */}
                <td className="py-3.5 px-4 whitespace-nowrap text-xs text-gray-400">
                  {session.practicedAt ? (
                    <div>
                      <span className="text-gray-300 font-medium">
                        {formatDateShort(session.practicedAt)}
                      </span>
                      <span className="block text-[11px] text-gray-500">Practiced</span>
                    </div>
                  ) : (
                    <div>
                      <span>{formatDateShort(session.createdAt)}</span>
                      <span className="block text-[11px] text-gray-500">Created</span>
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Add / Update score */}
                    <button
                      type="button"
                      onClick={() => setScoreModalSession(session)}
                      className="p-1.5 rounded text-amber-400 hover:bg-[#333333] transition-colors"
                      title="Add or update score"
                      aria-label="Add or update score"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(session)}
                      className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#333333] transition-colors"
                      title="Edit session"
                      aria-label="Edit session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(session)}
                      className="p-1.5 rounded text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Delete session"
                      aria-label="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Outermost Right: ChatGPT link pill and Prompt link (matching https://github.com/h-247/english-grammar-quiz) */}
                    <div
                      className={`flex items-center rounded-lg p-0.5 shadow-sm border ${
                        chatUrl && chatUrl.trim().length > 0 && chatUrl !== 'https://chatgpt.com'
                          ? 'bg-[#132c1e] border-[#1e5233] text-emerald-400'
                          : 'bg-[#2c1d0c] border-[#4d3214] text-amber-400'
                      }`}
                    >
                      {chatUrl && chatUrl.trim().length > 0 ? (
                        <a
                          href={chatUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const currentStatus = session.chatgptUrlStatus || 'To Do';
                              if (currentStatus !== 'Doing' && currentStatus !== 'IN_PROGRESS') {
                                await updateSession(session.id, { chatgptUrlStatus: 'Doing' });
                                showSuccess('Updated practice status to "Doing".');
                                onRefresh?.();
                              }
                            } catch {}
                          }}
                          title={`Open ChatGPT: ${chatUrl}`}
                          className="p-1 rounded transition-colors flex items-center justify-center hover:text-emerald-300 hover:bg-[#1a3827]"
                        >
                          <MessageSquareCheck className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setChatModalSession(session)}
                          title="Add ChatGPT Link"
                          className="p-1 rounded transition-colors flex items-center justify-center hover:text-amber-300 hover:bg-[#382610] cursor-pointer"
                        >
                          <MessageSquarePlus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setChatModalSession(session)}
                        title={chatUrl ? 'Edit ChatGPT Link' : 'Add ChatGPT Link'}
                        className={`p-1 rounded transition-colors cursor-pointer border-l ${
                          chatUrl && chatUrl.trim().length > 0 && chatUrl !== 'https://chatgpt.com'
                            ? 'border-[#1e5233] hover:text-emerald-300 hover:bg-[#1a3827]'
                            : 'border-[#4d3214] hover:text-amber-300 hover:bg-[#382610]'
                        }`}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Link Prompt Chat */}
                    <a
                      href={promptChatUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={handlePromptClick}
                      className="p-1 rounded bg-[#132c1e] hover:bg-[#1a3827] text-emerald-400 border border-[#1e5233] transition-colors flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                      title="Open Prompt Chat"
                      aria-label="Open Prompt Chat"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Edit ChatGPT Link Modal */}
      <EditSessionChatModal
        isOpen={Boolean(chatModalSession)}
        onClose={() => setChatModalSession(null)}
        session={chatModalSession}
        onSave={() => handleDataRefresh()}
      />

      {/* Add / Update Score Modal */}
      <AddScoreModal
        isOpen={Boolean(scoreModalSession)}
        onClose={() => setScoreModalSession(null)}
        session={scoreModalSession}
        onSuccess={() => handleDataRefresh()}
      />
    </div>
  );
}
