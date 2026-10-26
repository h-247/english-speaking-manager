'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { calculateScore, formatScore } from '@/lib/scoring';
import { updateAttempt, PracticeAttemptItem } from '@/lib/api-client';
import { validateChatGPTUrl } from '@/lib/chatgpt-url';
import { useToast } from '@/components/ui/Toast';
import { Trophy, Link as LinkIcon, ExternalLink } from 'lucide-react';

export interface EditAttemptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessionId: string;
  attempt: PracticeAttemptItem | null;
  availableUrls?: string[];
  topicName?: string;
}

function toLocalDatetimeInputValue(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function EditAttemptDialog({
  isOpen,
  onClose,
  onSuccess,
  sessionId,
  attempt,
  availableUrls = [],
  topicName,
}: EditAttemptDialogProps) {
  const { showSuccess, showError } = useToast();
  const [passCountStr, setPassCountStr] = useState<string>('');
  const [failCountStr, setFailCountStr] = useState<string>('');
  const [practicedDate, setPracticedDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [chatgptUrl, setChatgptUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ pass?: string; fail?: string; chatgptUrl?: string }>({});

  useEffect(() => {
    if (attempt) {
      setPassCountStr(String(attempt.passCount));
      setFailCountStr(String(attempt.failCount));
      setPracticedDate(toLocalDatetimeInputValue(attempt.practicedAt));
      setNotes(attempt.notes || '');
      setChatgptUrl(attempt.chatgptUrl || '');
      setErrors({});
    }
  }, [attempt, isOpen]);

  if (!attempt) return null;

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
      const isoPracticed = practicedDate
        ? new Date(practicedDate).toISOString()
        : new Date().toISOString();

      await updateAttempt(sessionId, attempt.id, {
        passCount: Number(passCountStr),
        failCount: Number(failCountStr),
        practicedAt: isoPracticed,
        notes: notes.trim() || null,
        chatgptUrl: chatgptUrl.trim() || null,
      });

      showSuccess(`Practice attempt updated. New score: ${formatScore(previewScore)}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message || 'Failed to update practice attempt.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Practice Attempt & ChatGPT Link"
      description={`Update counters, ChatGPT link, or practice notes${topicName ? ` for "${topicName}"` : ''}.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Pass and Fail Counters */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Pass Count"
            id="editPassCount"
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
            helperText="Number of correct repetitions"
          />

          <Input
            label="Fail Count (inc. 'h' skips)"
            id="editFailCount"
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
            helperText="Incorrect & skipped repetitions"
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
                Updated Score Preview
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

        {/* Edit ChatGPT Link for this Attempt */}
        <div className="space-y-2 p-3.5 rounded-lg bg-[#1a1a1a] border border-[#383838]">
          <div className="flex items-center justify-between">
            <label
              htmlFor="editChatgptUrl"
              className="text-xs font-semibold text-gray-300 flex items-center gap-1.5"
            >
              <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
              ChatGPT Link for this Attempt
            </label>
            {chatgptUrl && (
              <a
                href={chatgptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
              >
                Open in ChatGPT <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {availableUrls.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pb-1">
              <span className="text-[11px] text-gray-500">Pick saved link:</span>
              {availableUrls.map((url, idx) => (
                <button
                  type="button"
                  key={url}
                  onClick={() => {
                    setChatgptUrl(url);
                    setErrors((prev) => ({ ...prev, chatgptUrl: undefined }));
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
                    chatgptUrl === url
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
            id="editChatgptUrl"
            type="url"
            placeholder="Paste or change ChatGPT link (https://chatgpt.com/c/...)"
            value={chatgptUrl}
            onChange={(e) => {
              setChatgptUrl(e.target.value);
              setErrors((prev) => ({ ...prev, chatgptUrl: undefined }));
            }}
            error={errors.chatgptUrl}
            helperText="Assign or update the ChatGPT conversation link used for this attempt."
          />
        </div>

        {/* Practice Date */}
        <Input
          label="Practice Date & Time"
          type="datetime-local"
          value={practicedDate}
          onChange={(e) => setPracticedDate(e.target.value)}
        />

        {/* Notes */}
        <div>
          <label
            htmlFor="editAttemptNotes"
            className="block text-xs font-medium text-gray-300 mb-1"
          >
            Practice Notes (Optional)
          </label>
          <textarea
            id="editAttemptNotes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Feedback, difficult words, pronunciation notes..."
            className="w-full bg-[#1a1a1a] border border-[#383838] focus:border-white focus:ring-1 focus:ring-white rounded-lg px-3 py-2 text-sm text-[#ececec] placeholder-gray-500 outline-none transition-colors resize-none"
          />
        </div>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#333333]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
