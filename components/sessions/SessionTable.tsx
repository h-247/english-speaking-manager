'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { SessionItem } from '@/lib/api-client';
import { formatDateShort } from '@/lib/format-date';
import { ExternalLink, Copy, Edit2, Trash2, Award, GitBranch } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export interface SessionTableProps {
  sessions: SessionItem[];
  onEdit: (session: SessionItem) => void;
  onDelete: (session: SessionItem) => void;
  onRecordResult: (session: SessionItem) => void;
  onStatusChange: (session: SessionItem, newStatus: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED') => void;
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

            return (
              <tr
                key={session.id}
                className="hover:bg-[#2c2c2c] transition-colors group"
              >
                {/* Topic */}
                <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        href={`/sessions/${session.id}`}
                        className="font-semibold text-[#ececec] hover:underline truncate block"
                        title={session.topic}
                      >
                        {session.topic}
                      </Link>
                      {session.allChatgptUrls && session.allChatgptUrls.length > 1 && (
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 shrink-0"
                          title={`${session.allChatgptUrls.length} ChatGPT conversation links grouped under this topic`}
                        >
                          <GitBranch className="w-2.5 h-2.5" />
                          {session.allChatgptUrls.length} links
                        </span>
                      )}
                    </div>
                    {session.notes && (
                      <span className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                        {session.notes}
                      </span>
                    )}
                  </div>
                </td>

                {/* Status with quick switcher */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <select
                    value={session.status}
                    onChange={(e) => onStatusChange(session, e.target.value as any)}
                    className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer rounded px-1.5 py-0.5 border border-transparent hover:border-[#444444]"
                    title="Click to change status"
                  >
                    <option value="PLANNED" className="bg-[#262626] text-amber-300">
                      Planned
                    </option>
                    <option value="IN_PROGRESS" className="bg-[#262626] text-blue-300">
                      In Progress
                    </option>
                    <option value="COMPLETED" className="bg-[#262626] text-emerald-300">
                      Completed
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

                {/* Pass / Fail counts */}
                <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs">
                  {session.passCount !== null ? (
                    <span className="text-gray-300">
                      <b className="text-emerald-400">{session.passCount}</b> /{' '}
                      <b className="text-rose-400">{session.failCount ?? 0}</b>
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

                    <button
                      onClick={() => handleCopyLink(session.chatgptUrl)}
                      className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-[#333333] transition-colors"
                      title="Copy ChatGPT link"
                      aria-label="Copy ChatGPT link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onRecordResult(session)}
                      className="p-1.5 rounded text-amber-400 hover:bg-[#333333] transition-colors"
                      title="Record Pass/Fail results"
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
