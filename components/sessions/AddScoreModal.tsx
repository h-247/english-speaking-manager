'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Check, Loader2 } from 'lucide-react';
import { recordResult, updateSession, SessionItem } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';

interface AddScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionItem | null;
  practiceIndex?: number;
  selectedUrl?: string;
  onSuccess?: () => void;
}

const QUICK_SCORES = [5.0, 6.0, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 10.0];

export function AddScoreModal({
  isOpen,
  onClose,
  session,
  practiceIndex,
  selectedUrl,
  onSuccess,
}: AddScoreModalProps) {
  const { showSuccess, showError } = useToast();
  const [mounted, setMounted] = useState(false);
  const [scoreStr, setScoreStr] = useState<string>('');
  const [status, setStatus] = useState<'To Do' | 'Doing' | 'Done'>('Done');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session && isOpen) {
      let currentScore = session.score;
      if (selectedUrl && session.groupedLinks) {
        const matchingLink = session.groupedLinks.find((l) => l.url === selectedUrl);
        if (matchingLink && matchingLink.bestScore !== null && matchingLink.bestScore !== undefined) {
          currentScore = matchingLink.bestScore;
        }
      }
      setScoreStr(currentScore !== null && currentScore !== undefined ? String(currentScore) : '8.0');

      // Default value of practice status is 'Done' as requested
      setStatus('Done');
      setNotes(session.notes || '');
      setError(null);
    }
  }, [session, selectedUrl, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !mounted || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numScore = parseFloat(scoreStr);

    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      setError('Please enter a valid score between 0 and 10.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const finalScore = Math.round(numScore * 10) / 10;
      await recordResult(session.id, {
        score: finalScore,
        notes: notes.trim() || undefined,
        chatgptUrl: selectedUrl || (practiceIndex === 0 ? session.chatgptUrl : ''),
        practicedAt: new Date().toISOString(),
        markCompleted: false,
      });

      // Update practice link status (independent of topic status)
      try {
        const currentBranches = [...(session.branchUrls || [])];
        if (practiceIndex === undefined || practiceIndex === 0) {
          await updateSession(session.id, { chatgptUrlStatus: status as any });
        } else {
          const bIdx = practiceIndex - 1;
          while (currentBranches.length <= bIdx) {
            currentBranches.push({ url: '', status: 'To Do' });
          }
          const existingB = currentBranches[bIdx];
          const u = typeof existingB === 'string' ? existingB : (existingB?.url || '');
          currentBranches[bIdx] = { url: u, status };
          await updateSession(session.id, { branchUrls: currentBranches as any });
        }
      } catch {}

      showSuccess(`Saved score ${finalScore.toFixed(1)}/10 for "${session.topic}"!`);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save score.';
      setError(msg);
      showError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-md bg-[#1e1e1e] border border-[#333333] rounded-2xl shadow-2xl overflow-hidden text-[#ececec] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e2e] bg-[#242424]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add / Update Score</h3>
              <p className="text-xs text-[#9CA3AF] truncate max-w-xs">
                {session.topic}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 text-[#9CA3AF] hover:text-white rounded-lg hover:bg-[#333333] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Score Input */}
          <div className="space-y-2">
            <label htmlFor="score-input" className="text-xs font-semibold text-gray-300 block">
              Score (Scale of 10)
            </label>
            <div className="relative">
              <input
                id="score-input"
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={scoreStr}
                onChange={(e) => setScoreStr(e.target.value)}
                placeholder="e.g. 8.5"
                className="w-full bg-[#141414] border border-[#383838] rounded-xl pl-4 pr-14 py-3 text-lg font-bold text-amber-300 placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
              />
              <span className="absolute right-4 top-3.5 text-xs text-gray-500 font-bold select-none pointer-events-none">
                / 10
              </span>
            </div>

            {/* Quick score buttons */}
            <div className="grid grid-cols-9 gap-1 pt-1">
              {QUICK_SCORES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScoreStr(String(s))}
                  className={`py-1.5 text-xs rounded-lg font-mono font-semibold transition-colors cursor-pointer border text-center ${
                    scoreStr === String(s) || parseFloat(scoreStr) === s
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-[#252830] text-gray-300 border-[#383f4f] hover:bg-[#323947]'
                  }`}
                >
                  {s === 10 ? '10' : s.toFixed(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 block">
              Practice Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['To Do', 'Doing', 'Done'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    status === st
                      ? st === 'Done'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                        : st === 'Doing'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-[#20232a] text-gray-400 border-[#333947] hover:bg-[#282d37] hover:text-gray-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-2">
            <label htmlFor="score-notes" className="text-xs font-semibold text-gray-300 block">
              Notes / Feedback (Optional)
            </label>
            <textarea
              id="score-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Feedback on pronunciation, fluency, vocabulary..."
              className="w-full bg-[#141414] border border-[#383838] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#2e2e2e]">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-[#2c2c2c] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-950/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save Score</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
