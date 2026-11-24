'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PRESET_TOPICS } from '@/lib/preset-topics';
import { ORIGINAL_COACH_PROMPT } from '@/lib/coach-prompt';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  Link as LinkIcon,
  ExternalLink,
  Copy,
  Sparkles,
  Search,
  MessageSquare,
  Plus,
  Play,
  ArrowRight,
  BookOpen,
  Edit2,
} from 'lucide-react';

interface CustomPromptLink {
  id: string;
  title: string;
  url: string;
  topic?: string;
  notes?: string;
}

export default function PromptLinksPage() {
  const { showSuccess, showError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Custom added prompt links with safe hydration loading
  const [customLinks, setCustomLinks] = useState<CustomPromptLink[]>([]);

  // Shared prompt link (used across all ChatGPT links cards)
  const [sharedPromptUrl, setSharedPromptUrl] = useState('');
  const [sharedPromptText, setSharedPromptText] = useState(ORIGINAL_COACH_PROMPT);
  const [isEditingSharedPrompt, setIsEditingSharedPrompt] = useState(false);
  const [tempSharedUrl, setTempSharedUrl] = useState('');
  const [tempSharedText, setTempSharedText] = useState(ORIGINAL_COACH_PROMPT);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('custom_prompt_links');
      if (saved) {
        setCustomLinks(JSON.parse(saved));
      }
      const storedPromptChat = localStorage.getItem('prompt_chat_url');
      if (storedPromptChat !== null) {
        setSharedPromptUrl(storedPromptChat);
        setTempSharedUrl(storedPromptChat);
      } else {
        const storedShared = localStorage.getItem('shared_prompt_url');
        if (storedShared !== null) {
          setSharedPromptUrl(storedShared);
          setTempSharedUrl(storedShared);
        }
      }
      const savedSharedText = localStorage.getItem('shared_prompt_text');
      if (savedSharedText) {
        setSharedPromptText(savedSharedText);
        setTempSharedText(savedSharedText);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveSharedPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = tempSharedUrl.trim();
    setSharedPromptUrl(trimmedUrl);
    setSharedPromptText(tempSharedText.trim());
    if (typeof window !== 'undefined') {
      localStorage.setItem('prompt_chat_url', trimmedUrl);
      localStorage.setItem('shared_prompt_url', trimmedUrl);
      localStorage.setItem('shared_prompt_text', tempSharedText.trim());
      window.dispatchEvent(new Event('prompt_chat_url_changed'));
    }
    setIsEditingSharedPrompt(false);
    showSuccess('Shared Prompt link saved and updated across all cards!');
  };

  const handleResetSharedPrompt = () => {
    setSharedPromptUrl('https://chatgpt.com/');
    setSharedPromptText(ORIGINAL_COACH_PROMPT);
    setTempSharedUrl('https://chatgpt.com/');
    setTempSharedText(ORIGINAL_COACH_PROMPT);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('prompt_chat_url');
      localStorage.removeItem('shared_prompt_url');
      localStorage.removeItem('shared_prompt_text');
      window.dispatchEvent(new Event('prompt_chat_url_changed'));
    }
    setIsEditingSharedPrompt(false);
    showSuccess('Restored default shared Prompt link.');
  };

  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Generate standard ChatGPT prompt links for preset topics
  const presetPromptLinks = useMemo(() => {
    return PRESET_TOPICS.map((topic) => {
      const promptText = `Topic: ${topic.name}\n\n${ORIGINAL_COACH_PROMPT}`;
      const chatgptPromptUrl = `https://chatgpt.com/?q=${encodeURIComponent(promptText)}`;
      return {
        id: topic.id,
        name: topic.name,
        category: topic.category || 'General',
        icon: topic.icon,
        description: topic.description,
        promptText,
        chatgptPromptUrl,
        directChatgptUrl: 'https://chatgpt.com/',
      };
    });
  }, []);

  const categories = useMemo(() => {
    const set = new Set(
      PRESET_TOPICS.map((t) => t.category).filter(Boolean) as string[],
    );
    return ['ALL', ...Array.from(set)];
  }, []);

  const filteredPresetLinks = useMemo(() => {
    return presetPromptLinks.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        item.description.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'ALL' || item.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [presetPromptLinks, searchQuery, selectedCategory]);

  const handleCopyLink = async (url: string, name: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showSuccess(`Prompt link for "${name}" copied to clipboard!`);
    } catch {
      showError('Failed to copy link.');
    }
  };

  const handleCopyPromptText = async (text: string, name: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(`Prompt text for "${name}" copied to clipboard!`);
    } catch {
      showError('Failed to copy prompt.');
    }
  };

  const handleAddCustomLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const newEntry: CustomPromptLink = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      url: newUrl.trim(),
    };

    const updated = [newEntry, ...customLinks];
    setCustomLinks(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('custom_prompt_links', JSON.stringify(updated));
    }
    setNewTitle('');
    setNewUrl('');
    setIsAdding(false);
    showSuccess('Custom prompt link added!');
  };

  const handleDeleteCustomLink = (id: string) => {
    const updated = customLinks.filter((l) => l.id !== id);
    setCustomLinks(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('custom_prompt_links', JSON.stringify(updated));
    }
    showSuccess('Prompt link removed.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150" suppressHydrationWarning>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#333333]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <LinkIcon className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ececec]">
              Prompt Links Library
            </h1>
          </div>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Topic-specific prompt links ready to open in ChatGPT. Each link is tailored with a specific topic for instant speaking practice.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAdding((prev) => !prev)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {isAdding ? 'Close Form' : 'Add Custom Link'}
          </Button>
        </div>
      </div>

      {/* Shared Prompt Link Banner / Card */}
      <div className="p-5 rounded-2xl bg-[#1b2029] border border-[#2d3545] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#2a303e]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Sparkles className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Shared Prompt Link Across ChatGPT Cards
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold uppercase tracking-wider">
                  Shared
                </span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                This prompt link and prompt text are shared across all ChatGPT speaking practice cards in the app.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleCopyPromptText(sharedPromptText, 'Shared Prompt')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#272c37] hover:bg-[#343b4a] border border-[#3b4354] text-xs font-semibold text-gray-200 hover:text-white transition-colors"
              title="Copy Shared Prompt"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>Copy Prompt</span>
            </button>
            {sharedPromptUrl ? (
              <a
                href={sharedPromptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d2e2b] border border-[#147a6c] text-[#1fd5be] hover:bg-[#12423e] hover:text-[#38efd7] text-xs font-semibold shadow-sm transition-colors"
                title="Open ChatGPT with Prompt Link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open ChatGPT Link</span>
              </a>
            ) : (
              <span className="text-xs text-gray-500 italic px-2 py-1 select-none">
                (No prompt link set)
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingSharedPrompt((prev) => !prev)}
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              {isEditingSharedPrompt ? 'Close' : 'Edit'}
            </Button>
          </div>
        </div>

        {isEditingSharedPrompt ? (
          <form onSubmit={handleSaveSharedPrompt} noValidate className="space-y-3 pt-2">
            <Input
              label="Shared Prompt Link URL"
              placeholder="https://chatgpt.com/..."
              value={tempSharedUrl}
              onChange={(e) => setTempSharedUrl(e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Shared Coach Prompt Content
              </label>
              <textarea
                value={tempSharedText}
                onChange={(e) => setTempSharedText(e.target.value)}
                rows={6}
                className="w-full bg-[#16181d] border border-[#2d3444] rounded-xl p-3 text-xs text-gray-200 font-mono focus:border-teal-400 outline-none resize-y"
              />
            </div>
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleResetSharedPrompt}
                className="text-gray-400 hover:text-rose-400"
              >
                Reset to default
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsEditingSharedPrompt(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Shared Configuration
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-[#16181e] p-3 rounded-xl border border-[#262b37]">
            <div className="flex items-center gap-2 truncate max-w-xl">
              <span className="text-gray-400 font-medium">Current URL:</span>
              <a
                href={sharedPromptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:underline font-mono truncate"
              >
                {sharedPromptUrl}
              </a>
            </div>
            <span className="text-[11px] text-gray-400 italic">
              {sharedPromptText.slice(0, 70)}...
            </span>
          </div>
        )}
      </div>

      {/* Add Custom Link Form */}
      {isAdding && (
        <form
          onSubmit={handleAddCustomLink}
          className="p-4 sm:p-5 rounded-2xl bg-[#1c1f26] border border-[#2d3444] space-y-3 animate-in fade-in duration-200"
        >
          <h3 className="text-sm font-bold text-gray-200">
            Add Custom Prompt Link
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Prompt Title / Topic"
              placeholder="e.g. AI Product Management Pitch"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <Input
              label="Prompt URL (ChatGPT URL or Custom Link)"
              placeholder="https://chatgpt.com/c/... or prompt link"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Prompt Link
            </Button>
          </div>
        </form>
      )}

      {/* Custom Prompt Links Section (if any) */}
      {customLinks.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
              Custom Prompt Links ({customLinks.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {customLinks.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#1d2027] border border-[#2e3442] flex flex-col justify-between gap-3 shadow-sm hover:border-[#3d4557] transition-all"
              >
                <div>
                  <h4 className="text-sm font-bold text-gray-200 truncate">{item.title}</h4>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-400 hover:underline truncate block mt-1"
                  >
                    {item.url}
                  </a>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#2a303e]">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-[#252830] text-gray-200 hover:text-white"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </a>
                  <button
                    onClick={() => handleDeleteCustomLink(item.id)}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1a1c22] p-3 rounded-xl border border-[#2c3240]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompt links by topic..."
            className="w-full bg-[#16181d] border border-[#2c3240] focus:border-white focus:ring-1 focus:ring-white rounded-lg pl-9 pr-3.5 py-2 text-sm text-[#ececec] placeholder-gray-500 outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={`cat-filter-${cat}`}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-teal-500 text-black'
                  : 'bg-[#16181d] text-gray-400 hover:text-white border border-[#2c3240]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Topics Prompt Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresetLinks.map((item) => (
          <div
            key={`preset-link-${item.id}`}
            className="p-4 sm:p-5 rounded-2xl bg-[#1b1d24] border border-[#2b303c] hover:border-[#3e4657] flex flex-col justify-between gap-4 shadow-md transition-all group"
          >
            {/* Topic Info Header */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#252a36] text-teal-300 border border-teal-800/40">
                  {item.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-100 group-hover:text-white transition-colors">
                {item.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {item.description}
              </p>
            </div>

            {/* Direct Links and Copy Actions */}
            <div className="space-y-2 pt-3 border-t border-[#292f3d]">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-semibold text-gray-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  ChatGPT Prompt Link
                </span>
                <span className="text-[10px] text-teal-400 font-mono">B2 TED Talk</span>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {/* Direct Launch in ChatGPT */}
                  <a
                    href={item.chatgptPromptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-200 text-black text-xs font-bold shadow-md transition-all active:scale-95"
                    title="Launch this prompt in ChatGPT"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3 h-3 text-black" />
                  </a>

                  {/* Practice on Topics page */}
                  <Link
                    href={`/topics?topic=${encodeURIComponent(item.name)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#272c38] hover:bg-[#343b4c] border border-[#3c4456] text-xs font-semibold text-gray-200 hover:text-white transition-colors"
                  >
                    <span>Practice</span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                  </Link>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Copy Prompt Link button */}
                  <button
                    type="button"
                    onClick={() => handleCopyLink(item.chatgptPromptUrl, item.name)}
                    className="inline-flex items-center justify-center p-2 rounded-lg bg-[#0d2e2b] border border-[#147a6c] text-[#1fd5be] hover:bg-[#12423e] hover:text-[#38efd7] shadow-sm transition-colors"
                    title="Copy Prompt Link"
                    aria-label="Copy Prompt Link"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>

                  {/* Copy Prompt Text button */}
                  <button
                    type="button"
                    onClick={() => handleCopyPromptText(item.promptText, item.name)}
                    className="inline-flex items-center justify-center p-2 rounded-lg bg-[#272c38] hover:bg-[#343b4c] border border-[#3c4456] text-amber-300 hover:text-amber-200 transition-colors"
                    title="Copy Prompt Text"
                    aria-label="Copy Prompt Text"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}