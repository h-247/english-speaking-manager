'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { calculateScore, formatScore } from '@/lib/scoring';
import { recordResult } from '@/lib/api-client';
import { validateChatGPTUrl } from '@/lib/chatgpt-url';
import { useToast } from '@/components/ui/Toast';
import { Trophy, CheckCircle, Link as LinkIcon } from 'lucide-react';

export interface RecordResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    topic: string;
    chatgptUrl?: string;
    allChatgptUrls?: string[];
    score?: number | null;
    status?: string;
    passCount?: number | null;
    failCount?: number | null;
    practicedAt?: string | null;
  } | null;
  initialUrl?: string;
  onSuccess: () => void;
}

function toLocalDatetimeInputValue(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function RecordResultDialog({
  isOpen,
  onClose,
  session,
  initialUrl,
  onSuccess,
}: RecordResultDialogProps) {
  const { showSuccess, showError } = useToast();
  const [scoreStr, setScoreStr] = useState<string>('');
  const [status, setStatus] = useState<'To Do' | 'Doing' | 'Done'>('Done');
  const [practicedDate, setPracticedDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [chatgptUrl, setChatgptUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ score?: string; chatgptUrl?: string }>({});

  useEffect(() => {
    if (session) {
      setScoreStr(
        session.score !== null && session.score !== undefined
          ? String(session.score)
          : '',
      );
      setStatus('Done');
      setPracticedDate(toLocalDatetimeInputValue(new Date()));
      setNotes('');
      setChatgptUrl(initialUrl || '');
      setErrors({});
    }
  }, [session, isOpen, initialUrl]);

  if (!session) return null;

  const scoreNum = scoreStr !== '' && !isNaN(Number(scoreStr)) ? Number(scoreStr) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { score?: string; chatgptUrl?: string } = {};

    if (scoreStr === '' || isNaN(Number(scoreStr)) || Number(scoreStr) < 0 || Number(scoreStr) > 10) {
      newErrors.score = 'Please enter a valid score between 0 and 10.';
    }
    if (chatgptUrl.trim()) {
      const validation = validateChatGPTUrl(chatgptUrl.trim());
      if (!validation.isValid) {
        newErrors.chatgptUrl = validation.error || 'Please enter a valid HTTPS ChatGPT link.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const isoPracticed = practicedDate ? new Date(practicedDate).toISOString() : new Date().toISOString();
      const finalScore = Number(scoreStr);
      const autoPass = Math.round(finalScore * 10);
      const autoFail = Math.round((10 - finalScore) * 10);

      await recordResult(session.id, {
        score: finalScore,
        passCount: autoPass,
        failCount: autoFail,
        status,
        practicedAt: isoPracticed,
        notes: notes.trim() || undefined,
        chatgptUrl: chatgptUrl.trim() || undefined,
        markCompleted: status === 'Done',
      });

      showSuccess(`Recorded practice results for "${session.topic}". Score: ${finalScore}/10`);
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message || 'Failed to record results.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Record Practice Score"
      description={`Enter score (0 - 10) and status for "${session.topic}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Score & Status Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Score (0 - 10)"
            id="score"
            type="number"
            min="0"
            max="10"
            step="0.1"
            required
            autoFocus
            placeholder="e.g. 8.5"
            value={scoreStr}
            onChange={(e) => {
              setScoreStr(e.target.value);
              setErrors((prev) => ({ ...prev, score: undefined }));
            }}
            error={errors.score}
            helperText="Enter score from 0.0 to 10.0"
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="sessionStatusSelect" className="text-xs font-semibold text-gray-300">
              Status
            </label>
            <select
              id="sessionStatusSelect"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'To Do' | 'Doing' | 'Done')}
              className="w-full bg-[#1a1a1a] border border-[#383838] focus:border-white focus:ring-1 focus:ring-white rounded-lg px-3 py-2 text-sm text-[#ececec] outline-none transition-colors"
            >
              <option value="To Do">To Do</option>
              <option value="Doing">Doing</option>
              <option value="Done">Done</option>
            </select>
            <span className="text-[11px] text-gray-400">Status after this practice session</span>
          </div>
        </div>

        {/* Live Score Preview Card */}
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#383838] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-300">
                Speaking Score
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                Scale of 10
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-mono text-[#ececec]">
              {scoreNum !== null ? `${scoreNum.toFixed(1)} / 10` : '-- / 10'}
            </span>
          </div>
        </div>

        <Input
          label="Practice Date & Time"
          type="datetime-local"
          value={practicedDate}
          onChange={(e) => setPracticedDate(e.target.value)}
          helperText="Timezone: Asia/Ho_Chi_Minh"
        />

        {/* Corresponding ChatGPT Link for this practice attempt */}
        <div className="space-y-2 p-3 rounded-lg bg-[#1a1a1a] border border-[#383838]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
              ChatGPT Link for this Attempt
            </span>
            {chatgptUrl && (
              <span className="text-[11px] text-gray-400 font-mono truncate max-w-[200px]">
                {chatgptUrl}
              </span>
            )}
          </div>

          {session.allChatgptUrls && session.allChatgptUrls.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap pb-1">
              <span className="text-[11px] text-gray-500">Quick select:</span>
              {session.allChatgptUrls.map((url, idx) => (
                <button
                  type="button"
                  key={url}
                  onClick={() => {
                    setChatgptUrl(url);
                    setErrors((prev) => ({ ...prev, chatgptUrl: undefined }));
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                    chatgptUrl === url || (!chatgptUrl && url === session.chatgptUrl)
                      ? 'bg-blue-950 text-blue-300 border-blue-700/60 font-semibold'
                      : 'bg-[#222222] text-gray-400 border-[#383838] hover:text-white'
                  }`}
                >
                  Link #{idx + 1}
                </button>
              ))}
            </div>
          )}

          <Input
            id="chatgptBranchUrl"
            label="ChatGPT Conversation URL"
            type="url"
            placeholder={session.chatgptUrl ? `${session.chatgptUrl} (leave empty to use this)` : 'https://chatgpt.com/c/...'}
            value={chatgptUrl}
            onChange={(e) => {
              setChatgptUrl(e.target.value);
              setErrors((prev) => ({ ...prev, chatgptUrl: undefined }));
            }}
            error={errors.chatgptUrl}
            helperText="The ChatGPT conversation link where this practice attempt was conducted."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="attemptNotes" className="text-xs font-semibold text-gray-300">
            Attempt Notes & Feedback (Optional)
          </label>
          <textarea
            id="attemptNotes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Pronunciation was better, struggled with faster sentence chunks in point 2..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-[#1a1a1a] border border-[#383838] text-[#ececec] placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white transition-colors resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#383838] mt-2">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            Save Results
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
