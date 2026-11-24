'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, ExternalLink, RotateCcw, Check, Loader2, Trash2 } from 'lucide-react';
import { updateSession, SessionItem } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';

interface EditSessionChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionItem | null;
  practiceIndex?: number;
  initialUrl?: string;
  onSave?: (sessionId: string, newUrl: string | null) => void;
}

export function EditSessionChatModal({
  isOpen,
  onClose,
  session,
  practiceIndex,
  initialUrl,
  onSave,
}: EditSessionChatModalProps) {
  const { showSuccess, showError } = useToast();
  const [mounted, setMounted] = useState(false);
  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session && isOpen) {
      if (initialUrl !== undefined) {
        setUrl(initialUrl);
      } else {
        setUrl(session.chatgptUrl || '');
      }
      setError(null);
    }
  }, [session, initialUrl, isOpen]);

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

  const hasExistingLink = Boolean(session.chatgptUrl && session.chatgptUrl.trim().length > 0);

  const handleSave = async (urlToSave: string | null) => {
    setIsSaving(true);
    setError(null);

    try {
      const finalUrl = urlToSave ? urlToSave.trim() : '';
      if (practiceIndex === undefined || practiceIndex === 0) {
        await updateSession(session.id, { chatgptUrl: finalUrl });
      } else {
        const branchIndex = practiceIndex - 1;
        const currentBranches = [...(session.branchUrls || [])];
        while (currentBranches.length <= branchIndex) {
          currentBranches.push({ url: '', status: 'To Do' });
        }
        const existingB = currentBranches[branchIndex];
        const st = typeof existingB === 'object' && existingB?.status ? existingB.status : 'To Do';
        currentBranches[branchIndex] = { url: finalUrl, status: st };
        await updateSession(session.id, { branchUrls: currentBranches as any });
      }

      onSave?.(session.id, finalUrl || null);
      showSuccess(
        finalUrl
          ? `ChatGPT link saved for "${session.topic}"!`
          : `ChatGPT link cleared for "${session.topic}".`,
      );
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save ChatGPT URL.';
      setError(msg);
      showError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();

    if (!trimmed) {
      handleSave(null);
      return;
    }

    const formattedUrl =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;

    handleSave(formattedUrl);
  };

  const handleRemove = () => {
    handleSave(null);
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
        className="relative w-full max-w-lg bg-[#1e1e1e] border border-[#333333] rounded-2xl shadow-2xl overflow-hidden text-[#ececec] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e2e] bg-[#242424]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {hasExistingLink ? 'Edit ChatGPT Link' : 'Add ChatGPT Link'}
              </h3>
              <p className="text-xs text-[#9CA3AF] truncate max-w-sm">
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
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="session-chat-url" className="text-xs font-semibold text-gray-300">
                ChatGPT URL for this topic
              </label>
              <button
                type="button"
                onClick={() => setUrl('')}
                className="text-[11px] text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear link</span>
              </button>
            </div>

            <input
              id="session-chat-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://chatgpt.com/c/... or custom GPT"
              className="w-full bg-[#141414] border border-[#383838] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />

            <p className="text-[11px] text-[#888888] leading-relaxed">
              Add a dedicated ChatGPT conversation, custom GPT link, or prompt chat specifically for this speaking topic.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Test Link Button */}
          {url.trim() && (
            <div>
              <a
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>Test open link in new tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#2e2e2e]">
            <div>
              {hasExistingLink && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleRemove}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/40 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Link</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
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
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-950/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{hasExistingLink ? 'Save Changes' : 'Add Link'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
