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
  const [passCountStr, setPassCountStr] = useState<string>('');
  const [failCountStr, setFailCountStr] = useState<string>('');
  const [practicedDate, setPracticedDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [chatgptUrl, setChatgptUrl] = useState<string>('');
  const [markCompleted, setMarkCompleted] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ pass?: string; fail?: string; chatgptUrl?: string }>({});

  useEffect(() => {
    if (session) {
      setPassCountStr(
        session.passCount !== null && session.passCount !== undefined
          ? String(session.passCount)
          : '',
      );
      setFailCountStr(
        session.failCount !== null && session.failCount !== undefined
          ? String(session.failCount)
          : '',
      );
      setPracticedDate(toLocalDatetimeInputValue(new Date()));
      setNotes('');
      setChatgptUrl(initialUrl || '');
      setMarkCompleted(true);
      setErrors({});
    }
  }, [session, isOpen, initialUrl]);

  if (!session) return null;

  const passNum = passCountStr !== '' ? parseInt(passCountStr, 10) : null;
  const failNum = failCountStr !== '' ? parseInt(failCountStr, 10) : null;
  const previewScore = calculateScore(passNum, failNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { pass?: string; fail?: string; chatgptUrl?: string } = {};

    if (passCountStr === '' || isNaN(Number(passCountStr)) || Number(passCountStr) < 0) {
      newErrors.pass = 'Please enter a valid non-negative integer for Pass count.';
    }
    if (failCountStr === '' || isNaN(Number(failCountStr)) || Number(failCountStr) < 0) {
      newErrors.fail = 'Please enter a valid non-negative integer for Fail count.';
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

      await recordResult(session.id, {
        passCount: Number(passCountStr),
        failCount: Number(failCountStr),
        practicedAt: isoPracticed,
        notes: notes.trim() || undefined,
        chatgptUrl: chatgptUrl.trim() || undefined,
        markCompleted,
      });

      showSuccess(`Recorded practice results for "${session.topic}". Score: ${formatScore(previewScore)}`);
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
      title="Record Practice Results"
      description={`Enter sentence counters from ChatGPT for "${session.topic}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Pass Count"
            id="passCount"
            type="number"
            min="0"
            step="1"
            required
            placeholder="e.g. 48"
            value={passCountStr}
            onChange={(e) => {
              setPassCountStr(e.target.value);
              setErrors((prev) => ({ ...prev, pass: undefined }));
            }}
            error={errors.pass}
            helperText="Number of correct Echo Mode repetitions"
          />

          <Input
            label="Fail Count (inc. 'h' skips)"
            id="failCount"
            type="number"
            min="0"
            step="1"
            required
            placeholder="e.g. 12"
            value={failCountStr}
            onChange={(e) => {
              setFailCountStr(e.target.value);
              setErrors((prev) => ({ ...prev, fail: undefined }));
            }}
            error={errors.fail}
            helperText="Incorrect attempts and skipped ('h') sentences"
          />
        </div>

        {/* Live Score Preview Card */}
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#383838] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-gray-300">
                Calculated Score Preview
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                10 × Pass / (Pass + Fail)
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold font-mono text-[#ececec]">
              {formatScore(previewScore)}
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

        <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#202020] cursor-pointer text-sm text-gray-300 select-none">
          <input
            type="checkbox"
            checked={markCompleted}
            onChange={(e) => setMarkCompleted(e.target.checked)}
            className="w-4 h-4 rounded bg-[#1a1a1a] border-[#383838] text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Mark session status as Completed</span>
        </label>

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
