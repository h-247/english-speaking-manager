'use client';

import React from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';
import { SessionItem } from '@/lib/api-client';
import { formatDateShort } from '@/lib/format-date';
import { getPresetTopicByName } from '@/lib/preset-topics';
import { ORIGINAL_COACH_PROMPT } from '@/lib/coach-prompt';
import {
  ExternalLink,
  Copy,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  ArrowRight,
  Link as LinkIcon,
  Play,
  Sparkles,
  MessageSquare,
  RotateCw,
  Award,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export interface SessionCardProps {
  session: SessionItem;
  onEdit: (session: SessionItem) => void;
  onDelete: (session: SessionItem) => void;
  onRecordResult: (session: SessionItem) => void;
  onStatusChange: (session: SessionItem, newStatus: 'To Do' | 'Doing' | 'Done' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | string) => void;
}

function getTopicTheming(topicName: string) {
  const hash = topicName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const themes = [
    {
      gradient: 'from-amber-600 via-orange-600 to-red-700',
      badgeBg: 'bg-orange-500/20 text-orange-200 border-orange-400/30',
      barColor: 'bg-orange-400',
    },
    {
      gradient: 'from-cyan-700 via-blue-700 to-indigo-800',
      badgeBg: 'bg-sky-500/20 text-sky-200 border-sky-400/30',
      barColor: 'bg-blue-400',
    },
    {
      gradient: 'from-purple-700 via-fuchsia-700 to-pink-800',
      badgeBg: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
      barColor: 'bg-purple-400',
    },
    {
      gradient: 'from-emerald-700 via-teal-700 to-slate-800',
      badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
      barColor: 'bg-emerald-400',
    },
    {
      gradient: 'from-rose-700 via-pink-700 to-purple-800',
      badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
      barColor: 'bg-rose-400',
    },
    {
      gradient: 'from-slate-700 via-zinc-800 to-neutral-900',
      badgeBg: 'bg-gray-500/20 text-gray-200 border-gray-400/30',
      barColor: 'bg-amber-400',
    },
  ];
  return themes[hash % themes.length];
}

export function SessionCard({
  session,
  onEdit,
  onDelete,
  onRecordResult,
  onStatusChange,
}: SessionCardProps) {
  const { showSuccess, showError } = useToast();
  const preset = getPresetTopicByName(session.topic);
  const theme = getTopicTheming(session.topic);

  const normalizedStatus =
    session.status === 'COMPLETED' ? 'Done' :
    session.status === 'IN_PROGRESS' ? 'Doing' :
    session.status === 'PLANNED' ? 'To Do' :
    session.status || 'To Do';

  const progressPercent = session.score !== null ? Math.min(100, Math.round(session.score * 10)) : 0;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(session.chatgptUrl);
      showSuccess('ChatGPT conversation link copied.');
    } catch {
      showError('Failed to copy link.');
    }
  };

  const handleCopyPrompt = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const promptText = `Topic: ${session.topic}\n\n${ORIGINAL_COACH_PROMPT}`;
      await navigator.clipboard.writeText(promptText);
      showSuccess(`Coach prompt copied for "${session.topic}".`);
    } catch {
      showError('Failed to copy coach prompt.');
    }
  };

  return (
    <div className="bg-[#1a1c20] border border-[#2b303c] hover:border-[#404756] rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg transition-all group">
      {/* Top Illustration / Thematic Banner */}
      <div className={`relative h-36 w-full bg-gradient-to-br ${theme.gradient} p-4 flex flex-col justify-between overflow-hidden select-none`}>
        {/* Subtle decorative circles & overlay */}
        <div className="absolute -right-6 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 w-24 h-24 rounded-full bg-black/20 blur-lg pointer-events-none" />

        {/* Top bar inside banner */}
        <div className="flex items-center justify-between z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20">
            CEFR B2 TED Talk
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-amber-300 border border-amber-400/30">
              {preset?.category || 'Speaking'}
            </span>
          </div>
        </div>

        {/* Center artwork / icon showcase */}
        <div className="flex items-center justify-center gap-3 z-10 py-1">
          <div className="w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-inner">
            {preset?.icon || '💬'}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white/90 drop-shadow-sm">
              Echo Coach System
            </span>
            <span className="text-[11px] text-white/70">
              5-Min Talk • Fluency Loop
            </span>
          </div>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4">
        {/* Title Header with external link icon */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/sessions/${session.id}`}
              className="text-base font-bold text-[#f0f2f5] hover:text-white hover:underline transition-colors line-clamp-2 leading-tight"
              title={session.topic}
            >
              {session.topic}
            </Link>
            <Link
              href={`/sessions/${session.id}`}
              className="text-gray-400 hover:text-white p-1 shrink-0"
              title="View topic details"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          <span className="text-xs text-gray-400 block mt-1 font-medium">
            Coach: Echo Speaking Coach
          </span>
        </div>

        {/* Learning / Speaking Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-medium">Learning Progress</span>
            <span className="font-mono font-bold text-gray-200">
              {session.score !== null ? `${progressPercent}%` : '0%'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#272b35] rounded-full overflow-hidden">
            <div
              className={`h-full ${theme.barColor} rounded-full transition-all duration-300`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metrics Chips Row */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="px-2.5 py-1 rounded-md bg-[#232732] border border-[#333a4a] text-gray-300 font-medium">
            {session.attemptCount !== undefined && session.attemptCount > 0
              ? `${session.attemptCount} ${session.attemptCount === 1 ? 'Attempt' : 'Attempts'}`
              : '1 Attempt'}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#232732] border border-[#333a4a] text-gray-300 font-medium">
            {session.score !== null ? `Score: ${session.score.toFixed(1)}/10` : 'No score'}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#232732] border border-[#333a4a] text-gray-300 font-medium truncate max-w-[130px]">
            {session.allChatgptUrls && session.allChatgptUrls.length > 1
              ? `${session.allChatgptUrls.length} ChatGPT Links`
              : '1 ChatGPT Link'}
          </span>
        </div>

        {/* Next Practice / Active Conversation Box (matching screenshot) */}
        <div className="p-3 rounded-xl bg-[#20232b] border border-[#2e3442] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Next Practice</span>
            </div>
            <StatusBadge status={normalizedStatus} size="sm" />
          </div>

          <div>
            <span className="text-xs font-bold text-gray-200 block truncate">
              1. ChatGPT Practice Conversation
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span>
                {session.practicedAt
                  ? formatDateShort(session.practicedAt)
                  : 'Ready to practice'}
              </span>
            </div>
          </div>

          {/* Action Buttons Row (Status dropdown, ChatGPT link, Prompt button, Practice play button, Teal copy pill) */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {/* Status Dropdown */}
            <select
              value={normalizedStatus}
              onChange={(e) => onStatusChange(session, e.target.value)}
              className="bg-[#191b22] hover:bg-[#232732] border border-[#394050] text-xs font-semibold rounded-lg px-2.5 py-1.5 text-gray-200 cursor-pointer outline-none transition-colors"
              title="Change status"
              aria-label="Change status"
            >
              <option value="To Do" className="bg-[#1e2025] text-amber-300">To Do</option>
              <option value="Doing" className="bg-[#1e2025] text-blue-300">Doing</option>
              <option value="Done" className="bg-[#1e2025] text-emerald-300">Done</option>
            </select>

            {/* ChatGPT ↗ Button */}
            <a
              href={session.chatgptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#272c37] hover:bg-[#343b4a] border border-[#3b4354] text-xs font-semibold text-gray-200 hover:text-white transition-colors"
              title="Open conversation in ChatGPT"
            >
              <span>ChatGPT</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </a>

            {/* Prompt 📋 Button */}
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#272c37] hover:bg-[#343b4a] border border-[#3b4354] text-xs font-semibold text-gray-200 hover:text-white transition-colors"
              title="Copy coach prompt for this topic"
            >
              <span>Prompt</span>
              <Copy className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* ▷ Practice Play Button (Bold White Pill Button) */}
            <button
              type="button"
              onClick={() => onRecordResult(session)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-gray-200 text-black text-xs font-bold shadow-md transition-all active:scale-95"
              title="Record score / practice result"
            >
              <Play className="w-3.5 h-3.5 fill-black text-black" />
              <span>Practice</span>
            </button>

            {/* Teal Copy Link Pill Button (matching screenshot) */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#0d2e2b] border border-[#147a6c] text-[#1fd5be] hover:bg-[#12423e] hover:text-[#38efd7] shadow-sm transition-colors shrink-0"
              title="Copy ChatGPT Link"
              aria-label="Copy ChatGPT Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Edit Note & Tag Pills Row (matching small yellow icons & blue tags in screenshot) */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2a303e]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onRecordResult(session)}
                className="p-1.5 rounded-md bg-[#2b2419] border border-amber-600/40 text-amber-400 hover:bg-[#382f20] transition-colors"
                title="Record or update score"
              >
                <Award className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onEdit(session)}
                className="p-1.5 rounded-md bg-[#2b2419] border border-amber-600/40 text-amber-400 hover:bg-[#382f20] transition-colors"
                title="Edit topic and note"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1 flex-wrap justify-end">
              {session.tags && session.tags.length > 0 ? (
                session.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#162740] border border-[#214373] text-sky-300"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#162740] border border-[#214373] text-sky-300">
                  En
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer (matching screenshot) */}
      <div className="px-4 py-3 bg-[#16181c] border-t border-[#272b35] flex items-center justify-between text-[11px] text-gray-400">
        <span className="truncate">
          Synced: {session.practicedAt ? formatDateShort(session.practicedAt) : formatDateShort(session.createdAt)}
        </span>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onRecordResult(session)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Refresh score"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(session)}
            className="text-gray-400 hover:text-rose-400 transition-colors"
            title="Delete session"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/sessions/${session.id}`}
            className="inline-flex items-center gap-1 font-semibold text-gray-300 hover:text-white transition-colors ml-1"
          >
            <span>View Topic</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}