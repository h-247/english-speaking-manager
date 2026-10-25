'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ORIGINAL_COACH_PROMPT } from '@/lib/coach-prompt';
import { useToast } from '@/components/ui/Toast';
import {
  Copy,
  ExternalLink,
  Sparkles,
  Check,
  BookOpen,
  FileText,
  RotateCcw,
} from 'lucide-react';

export default function CoachPromptPage() {
  const { showSuccess, showError } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'custom'>('original');
  const [customPrompt, setCustomPrompt] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('custom_coach_prompt') || ORIGINAL_COACH_PROMPT;
    }
    return ORIGINAL_COACH_PROMPT;
  });

  const currentTextToCopy = activeTab === 'original' ? ORIGINAL_COACH_PROMPT : customPrompt;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentTextToCopy);
      setCopied(true);
      showSuccess('English Speaking Coach Prompt copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showError('Failed to copy prompt to clipboard. Please copy manually.');
    }
  };

  const handleSaveCustom = () => {
    try {
      localStorage.setItem('custom_coach_prompt', customPrompt);
      showSuccess('Custom prompt version saved locally!');
    } catch {
      showError('Failed to save custom prompt version.');
    }
  };

  const handleResetToOriginal = () => {
    setCustomPrompt(ORIGINAL_COACH_PROMPT);
    localStorage.removeItem('custom_coach_prompt');
    showSuccess('Reset custom prompt to original default.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#333333]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ececec]">
            English Speaking Coach Prompt
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Authoritative 5-Minute B2 TED Talk & Echo Mode Prompt for ChatGPT.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button variant="primary" size="md" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-black" />
                Copy Prompt
              </>
            )}
          </Button>

          <a
            href="https://chatgpt.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#333333] border border-[#444444] text-white hover:bg-[#404040] transition-colors shadow-sm select-none"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Open ChatGPT
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
        <button
          onClick={() => setActiveTab('original')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'original'
              ? 'bg-[#333333] text-white border border-[#444444]'
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          Original Prompt (Read-Only Default)
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'custom'
              ? 'bg-[#333333] text-white border border-[#444444]'
              : 'text-gray-400 hover:text-white hover:bg-[#252525]'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          Custom Version (Editable)
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'original' ? (
        <div className="bg-[#262626] border border-[#383838] rounded-xl p-6 sm:p-8 shadow-md">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#383838]">
            <span className="text-xs font-mono text-gray-400">
              Preserved verbatim • Vietnamese & English
            </span>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-3.5 h-3.5 mr-1" />
              Copy All Text
            </Button>
          </div>

          <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-[#1a1a1a] p-5 sm:p-6 rounded-lg border border-[#333333] overflow-x-auto">
            {ORIGINAL_COACH_PROMPT}
          </div>
        </div>
      ) : (
        <div className="bg-[#262626] border border-[#383838] rounded-xl p-6 sm:p-8 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#383838]">
            <span className="text-xs text-gray-400">
              Customize or refine prompts for specialized speaking scenarios.
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResetToOriginal}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset to Original
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveCustom}>
                Save Custom
              </Button>
            </div>
          </div>

          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={20}
            className="w-full bg-[#1a1a1a] text-[#ececec] border border-[#383838] rounded-lg p-4 font-mono text-xs sm:text-sm focus:outline-none focus:border-gray-400 transition-all resize-y leading-relaxed"
            placeholder="Edit custom prompt..."
          />
        </div>
      )}

      {/* Practice Workflow Guidance */}
      <div className="bg-[#1c1c1c] border border-[#333333] rounded-xl p-5 sm:p-6 space-y-3">
        <h3 className="text-sm font-bold text-[#ececec] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Recommended 4-Step Practice Routine
        </h3>
        <ol className="list-decimal list-inside text-xs sm:text-sm text-gray-400 space-y-2 leading-relaxed">
          <li>
            <b className="text-gray-200">Copy the prompt:</b> Click "Copy Prompt" above.
          </li>
          <li>
            <b className="text-gray-200">Paste in ChatGPT:</b> Open `https://chatgpt.com/`, start a new chat, and paste the prompt.
          </li>
          <li>
            <b className="text-gray-200">Provide topic & practice:</b> Tell ChatGPT your speaking topic, review the 5-min TED talk, and complete Echo Mode.
          </li>
          <li>
            <b className="text-gray-200">Save link & record score:</b> Copy the ChatGPT conversation URL, return to this app, click "Add Session", and log your Pass/Fail counts!
          </li>
        </ol>
      </div>
    </div>
  );
}
