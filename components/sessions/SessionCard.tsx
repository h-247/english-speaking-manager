'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { Button } from '@/components/ui/Button';
import { SessionItem } from '@/lib/api-client';
import { formatDateShort } from '@/lib/format-date';
import {
  ExternalLink,
  Copy,
  Edit2,
  Trash2,
  Award,
  Calendar,
  CheckCircle,
  Tag,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export interface SessionCardProps {
  session: SessionItem;
  onEdit: (session: SessionItem) => void;
  onDelete: (session: SessionItem) => void;
  onRecordResult: (session: SessionItem) => void;
  onStatusChange: (session: SessionItem, newStatus: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED') => void;
}

export function SessionCard({
  session,
  onEdit,
  onDelete,
  onRecordResult,
  onStatusChange,
}: SessionCardProps) {
  const { showSuccess, showError } = useToast();

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(session.chatgptUrl);
      showSuccess('ChatGPT conversation link copied to clipboard.');
    } catch {
      showError('Failed to copy link.');
    }
  };

  const isUnfinished = session.status === 'PLANNED' || session.status === 'IN_PROGRESS';

  return (
    <div className="bg-[#262626] border border-[#383838] rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-[#4c4c4c] transition-all">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <StatusBadge status={session.status} size="sm" />
            {session.score !== null && <ScoreDisplay score={session.score} size="sm" />}
            {session.attemptCount !== undefined && session.attemptCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1c2e42] text-sky-300 border border-sky-800/50 font-medium">
                {session.attemptCount} {session.attemptCount === 1 ? 'attempt' : 'attempts'}
              </span>
            )}
            {session.allChatgptUrls && session.allChatgptUrls.length > 1 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/40 font-medium inline-flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                {session.allChatgptUrls.length} branches
              </span>
            )}
          </div>
          <Link
            href={`/sessions/${session.id}`}
            className="text-base font-semibold text-[#ececec] hover:underline block truncate"
            title={session.topic}
          >
            {session.topic}
          </Link>
        </div>
      </div>

      {/* Details & Metadata */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 pt-2 border-t border-[#333333]">
        <div className="flex items-center gap-1.5 truncate">
          <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span>
            {session.practicedAt
              ? `Practiced: ${formatDateShort(session.practicedAt)}`
              : `Created: ${formatDateShort(session.createdAt)}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 justify-end">
          {session.passCount !== null ? (
            <span className="font-mono text-gray-300">
              Pass: <b className="text-emerald-400">{session.passCount}</b> / Fail:{' '}
              <b className="text-rose-400">{session.failCount ?? 0}</b>
            </span>
          ) : (
            <span className="text-gray-500 italic">No score yet</span>
          )}
        </div>
      </div>

      {/* Tags if any */}
      {session.tags && session.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3 h-3 text-gray-500 shrink-0" />
          {session.tags.map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded bg-[#1f1f1f] border border-[#333333] text-gray-300"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Card Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#333333] mt-auto flex-wrap">
        <div className="flex items-center gap-1.5">
          <a
            href={session.chatgptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
              isUnfinished
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-[#333333] text-gray-200 hover:bg-[#404040]'
            }`}
          >
            {isUnfinished ? 'Continue in ChatGPT' : 'Open ChatGPT'}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#333333] transition-colors"
            title="Copy ChatGPT link"
            aria-label="Copy ChatGPT link"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onRecordResult(session)}
            className="p-1.5 rounded-lg text-amber-400 hover:bg-[#333333] transition-colors"
            title="Record results (Pass/Fail)"
            aria-label="Record practice results"
          >
            <Award className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(session)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#333333] transition-colors"
            title="Edit session"
            aria-label="Edit session"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(session)}
            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
            title="Delete session"
            aria-label="Delete session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
