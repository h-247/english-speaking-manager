'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Link2, ExternalLink, RotateCcw, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export const DEFAULT_PROMPT_CHAT_URL = '';

interface EditPromptChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl?: string;
  onSave?: (newUrl: string) => void;
}

export function EditPromptChatModal({
  isOpen,
  onClose,
  currentUrl,
  onSave,
}: EditPromptChatModalProps) {
  const { showSuccess, showError } = useToast();
  const [mounted, setMounted] = useState(false);
  const [url, setUrl] = useState(currentUrl !== undefined ? currentUrl : '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (currentUrl !== undefined) {
        setUrl(currentUrl);
      } else if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('prompt_chat_url');
        setUrl(stored !== null ? stored : '');
      } else {
        setUrl('');
      }
      setError(null);
    }
  }, [isOpen, currentUrl]);

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

  if (!isOpen || !mounted) return null;

  const handleReset = () => {
    setUrl('https://chatgpt.com');
    setError(null);
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();

    const formattedUrl = trimmed
      ? (trimmed.startsWith('http://') || trimmed.startsWith('https://')
          ? trimmed
          : `https://${trimmed}`)
      : '';

    setIsSaving(true);
    setError(null);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('prompt_chat_url', formattedUrl);
        window.dispatchEvent(new Event('prompt_chat_url_changed'));
      }
      onSave?.(formattedUrl);
      showSuccess(formattedUrl ? 'Prompt Chat link updated successfully!' : 'Prompt Chat link cleared.');
      onClose();
    } catch {
      setError('Failed to update Prompt Chat URL.');
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
        className="relative w-full max-w-lg bg-[#1e1e1e] border border-[#333333] rounded-2xl shadow-2xl overflow-hidden text-[#ececec] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e2e] bg-[#242424]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit "Prompt Chat" Link</h3>
              <p className="text-xs text-[#9CA3AF]">
                Set the AI/ChatGPT URL used across all speaking topics and cards
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
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="prompt-chat-input" className="text-xs font-semibold text-gray-300">
                Prompt Chat URL
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] text-gray-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Clear URL to empty"
                >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Reset to default https://chatgpt.com"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to default</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                id="prompt-chat-input"
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://chatgpt.com"
                className={`w-full bg-[#141414] border ${
                  error ? 'border-rose-500 focus:border-rose-400' : 'border-[#383838] focus:border-emerald-500'
                } rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-colors font-mono`}
              />
            </div>

            <p className="text-[11px] text-[#888888] leading-relaxed">
              You can paste a custom ChatGPT chat URL, custom GPT URL, or reset it as{' '}
              <button
                type="button"
                onClick={handleReset}
                className="text-emerald-400 hover:underline bg-black/40 px-1 py-0.5 rounded cursor-pointer font-mono"
              >
                https://chatgpt.com
              </button>
              .
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Test Link Button */}
          {url && (
            <div className="pt-1">
              <a
                href={url.startsWith('http') ? url : `https://${url}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Test open link in new tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2e2e2e]">
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
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-950/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save Link</span>
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
