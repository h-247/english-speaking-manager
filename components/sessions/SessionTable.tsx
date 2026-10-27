'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { SessionItem } from '@/lib/api-client';
import { formatDateShort } from '@/lib/format-date';
import { getPresetTopicByName } from '@/lib/preset-topics';
import { ExternalLink, Copy, Edit2, Trash2, Award, Link as LinkIcon, FileText } from 'lucide-react';
import { ORIGINAL_COACH_PROMPT } from '@/lib/coach-prompt';
import { useToast } from '@/components/ui/Toast';

export interface SessionTableProps {
  sessions: SessionItem[];
  onEdit: (session: SessionItem) => void;
  onDelete: (session: SessionItem) => void;
  onRecordResult: (session: SessionItem) => void;
  onStatusChange: (session: SessionItem, newStatus: 'To Do' | 'Doing' | 'Done' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | string) => void;
}

export function SessionTable({
  sessions,
  onEdit,
  onDelete,
  onRecordResult,
  onStatusChange,
}: SessionTableProps) {
  const { showSuccess, showError } = useToast();

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess('ChatGPT conversation link copied.');
    } catch {
      showError('Failed to copy link.');
    }
  };

  const handleCopyPrompt = async (topic: string) => {
    try {
      const text = `Topic: ${topic}\n\n${ORIGINAL_COACH_PROMPT}`;
      await navigator.clipboard.writeText(text);
      showSuccess(`Copied coach prompt for "${topic}".`);
    } catch {
      showError('Failed to copy prompt.');
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
            const isUnfinished = session.status === 'PLANNED' || session.status === 'IN_PROGRESS';
            const preset = getPresetTopicByName(session.topic);
            const icon = preset ? preset.icon : '💬';

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

                {/* Score Column */}
                <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                  {session.score !== null ? (
                    <span className="text-gray-200 font-bold">
                      <b className="text-emerald-400">{session.score.toFixed(1)}</b> / 10
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">—</span>
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
                    {/* Open / Continue in ChatGPT */}
                    <a
                      href={session.chatgptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        isUnfinished
                          ? 'bg-white text-black hover:bg-gray-200'
                          : 'bg-[#333333] text-gray-200 hover:bg-[#404040]'
                      }`}
                      title="Open conversation in ChatGPT"
                    >
                      <span>{isUnfinished ? 'Continue' : 'Open'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* Prompt button */}
                    <button
                      onClick={() => handleCopyPrompt(session.topic)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-[#2a2a2a] text-amber-300 hover:bg-[#383838] border border-[#3e3e3e] transition-colors"
                      title="Copy coach prompt"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Prompt</span>
                    </button>

                    <button
                      onClick={() => handleCopyLink(session.chatgptUrl)}
                      className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#333333] transition-colors"
                      title="Copy ChatGPT link"
                      aria-label="Copy ChatGPT link"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onRecordResult(session)}
                      className="p-1.5 rounded text-amber-400 hover:bg-[#333333] transition-colors"
                      title="Record score"
                      aria-label="Record results"
                    >
                      <Award className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onEdit(session)}
                      className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#333333] transition-colors"
                      title="Edit session"
                      aria-label="Edit session"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDelete(session)}
                      className="p-1.5 rounded text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Delete session"
                      aria-label="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
