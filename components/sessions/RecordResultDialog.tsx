'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { calculateScore, formatScore } from '@/lib/scoring';
import { recordResult } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Trophy, CheckCircle } from 'lucide-react';

export interface RecordResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    topic: string;
    passCount?: number | null;
    failCount?: number | null;
    practicedAt?: string | null;
  } | null;
  onSuccess: () => void;
}

export function RecordResultDialog({
  isOpen,
  onClose,
  session,
  onSuccess,
}: RecordResultDialogProps) {
  const { showSuccess, showError } = useToast();
  const [passCountStr, setPassCountStr] = useState<string>('');
  const [failCountStr, setFailCountStr] = useState<string>('');
  const [practicedDate, setPracticedDate] = useState<string>('');
  const [markCompleted, setMarkCompleted] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ pass?: string; fail?: string }>({});

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
      setPracticedDate(
        session.practicedAt
          ? new Date(session.practicedAt).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
      );
      setMarkCompleted(true);
      setErrors({});
    }
  }, [session, isOpen]);

  if (!session) return null;

  const passNum = passCountStr !== '' ? parseInt(passCountStr, 10) : null;
  const failNum = failCountStr !== '' ? parseInt(failCountStr, 10) : null;
  const previewScore = calculateScore(passNum, failNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { pass?: string; fail?: string } = {};

    if (passCountStr === '' || isNaN(Number(passCountStr)) || Number(passCountStr) < 0) {
      newErrors.pass = 'Please enter a valid non-negative integer for Pass count.';
    }
    if (failCountStr === '' || isNaN(Number(failCountStr)) || Number(failCountStr) < 0) {
      newErrors.fail = 'Please enter a valid non-negative integer for Fail count.';
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
