'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { validateChatGPTUrl } from '@/lib/chatgpt-url';
import { calculateScore, formatScore } from '@/lib/scoring';
import { createSession, updateSession, SessionItem, TopicItem } from '@/lib/api-client';
import { PRESET_TOPICS } from '@/lib/preset-topics';
import { useToast } from '@/components/ui/Toast';

export interface SessionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit?: SessionItem | null;
  initialTopic?: string;
  topics?: TopicItem[];
  onSuccess: () => void;
}

export function SessionFormDialog({
  isOpen,
  onClose,
  sessionToEdit,
  initialTopic,
  topics,
  onSuccess,
}: SessionFormDialogProps) {
  const { showSuccess, showError } = useToast();
  const isEditing = Boolean(sessionToEdit);

  const [topic, setTopic] = useState('');
  const [chatgptUrl, setChatgptUrl] = useState('');
  const [status, setStatus] = useState<string>('To Do');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [scoreStr, setScoreStr] = useState('');
  const [practicedDate, setPracticedDate] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const allTopicOptions = React.useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    if (topics && topics.length > 0) {
      for (const t of topics) {
        map.set(t.name.toLowerCase(), { name: t.name, icon: t.icon });
      }
    }
    for (const p of PRESET_TOPICS) {
      if (!map.has(p.name.toLowerCase())) {
        map.set(p.name.toLowerCase(), { name: p.name, icon: p.icon });
      }
    }
    return Array.from(map.values());
  }, [topics]);

  useEffect(() => {
    if (sessionToEdit) {
      setTopic(sessionToEdit.topic);
      setChatgptUrl(sessionToEdit.chatgptUrl);
      setStatus(
        sessionToEdit.status === 'COMPLETED' ? 'Done' :
        sessionToEdit.status === 'IN_PROGRESS' ? 'Doing' :
        sessionToEdit.status === 'PLANNED' ? 'To Do' :
        sessionToEdit.status || 'To Do'
      );
      setNotes(sessionToEdit.notes || '');
      setTagsInput(sessionToEdit.tags ? sessionToEdit.tags.join(', ') : '');
      setScoreStr(
        sessionToEdit.score !== null && sessionToEdit.score !== undefined
          ? String(sessionToEdit.score)
          : sessionToEdit.passCount !== null && sessionToEdit.failCount !== null
          ? String(calculateScore(sessionToEdit.passCount, sessionToEdit.failCount) ?? '')
          : '',
      );
      setPracticedDate(
        sessionToEdit.practicedAt
          ? new Date(sessionToEdit.practicedAt).toISOString().slice(0, 16)
          : '',
      );
    } else {
      setTopic(initialTopic || '');
      setChatgptUrl('');
      setStatus('To Do');
      setNotes('');
      setTagsInput('');
      setScoreStr('');
      setPracticedDate('');
    }
    setErrors({});
  }, [sessionToEdit, isOpen, initialTopic]);

  const parsedScore = scoreStr !== '' && !isNaN(Number(scoreStr)) ? Number(scoreStr) : null;

  const handleUrlBlur = () => {
    if (chatgptUrl.trim()) {
      const validation = validateChatGPTUrl(chatgptUrl);
      if (!validation.isValid) {
        setErrors((prev) => ({ ...prev, chatgptUrl: validation.error || 'Invalid ChatGPT link' }));
      } else {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy.chatgptUrl;
          return copy;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!topic.trim()) {
      newErrors.topic = 'Topic is required.';
    }

    if (chatgptUrl.trim()) {
      const urlValidation = validateChatGPTUrl(chatgptUrl);
      if (!urlValidation.isValid) {
        newErrors.chatgptUrl =
          urlValidation.error ||
          'Please enter a valid official HTTPS ChatGPT link (e.g. https://chatgpt.com/c/...)';
      }
    }

    if (scoreStr !== '') {
      const s = Number(scoreStr);
      if (isNaN(s) || s < 0 || s > 10) {
        newErrors.score = 'Score must be a number between 0 and 10.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const tagsArray = tagsInput
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean);

      const isoPracticed = practicedDate ? new Date(practicedDate).toISOString() : null;
      const finalScore = parsedScore !== null ? parsedScore : null;
      const parsedPass = finalScore !== null ? Math.round(finalScore * 10) : null;
      const parsedFail = finalScore !== null ? Math.round((10 - finalScore) * 10) : null;

      if (isEditing && sessionToEdit) {
        await updateSession(sessionToEdit.id, {
          topic: topic.trim(),
          chatgptUrl: chatgptUrl.trim(),
          status: status as any,
          notes: notes.trim() || null,
          tags: tagsArray,
          score: finalScore,
          passCount: parsedPass,
          failCount: parsedFail,
          practicedAt: isoPracticed,
        });
        showSuccess(`Updated session "${topic.trim()}".`);
      } else {
        await createSession({
          topic: topic.trim(),
          chatgptUrl: chatgptUrl.trim(),
          status: status as any,
          notes: notes.trim() || null,
          tags: tagsArray,
          score: finalScore,
          passCount: parsedPass,
          failCount: parsedFail,
          practicedAt: isoPracticed,
        });
        showSuccess(`Added new speaking topic "${topic.trim()}".`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message || 'Failed to save topic.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Speaking Session' : 'Add Speaking Session / Topic'}
      description={
        isEditing
          ? 'Update topic selection, ChatGPT link, or practice score.'
          : 'Save a ChatGPT conversation link with topic selection and practice score.'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <div>
            <label htmlFor="topic-select" className="block text-xs font-medium text-gray-300 mb-1">
              Select Preset Topic
            </label>
            <select
              id="topic-select"
              aria-label="Select Preset Topic"
              value={allTopicOptions.some((p) => p.name.toLowerCase() === topic.toLowerCase()) ? topic : 'custom'}
              onChange={(e) => {
                if (e.target.value !== 'custom') {
                  setTopic(e.target.value);
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.topic;
                    return copy;
                  });
                }
              }}
              className="w-full bg-[#1a1a1a] border border-[#383838] focus:border-white focus:ring-1 focus:ring-white rounded-lg px-3 py-2 text-sm text-[#ececec] outline-none transition-colors"
            >
              <option value="custom">-- Select topic from standard list or type custom below --</option>
              {allTopicOptions.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="topic"
            label="Topic"
            required
            placeholder="e.g. Job & Study, Accommodation & Buildings..."
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setErrors((prev) => {
                const copy = { ...prev };
                delete copy.topic;
                return copy;
              });
            }}
            error={errors.topic}
            helperText="The topic selection for this ChatGPT speaking session"
          />
        </div>

        <Input
          label="ChatGPT Conversation URL (Optional)"
          type="url"
          placeholder="https://chatgpt.com/c/your-conversation-id (Leave empty if not started yet)"
          value={chatgptUrl}
          onChange={(e) => {
            setChatgptUrl(e.target.value);
            setErrors((prev) => {
              const copy = { ...prev };
              delete copy.chatgptUrl;
              return copy;
            });
          }}
          onBlur={handleUrlBlur}
          error={errors.chatgptUrl}
          helperText="ChatGPT conversation link for this speaking practice session"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'To Do', label: 'To Do' },
              { value: 'Doing', label: 'Doing' },
              { value: 'Done', label: 'Done' },
            ]}
          />

          <Input
            label="Tags (comma-separated)"
            placeholder="e.g. TED, Leadership, Fluency"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            helperText="Separate tags with commas"
          />
        </div>

        {/* Practice Score & Results section */}
        <div className="p-3.5 rounded-xl bg-[#1c1c1c] border border-[#333333] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300">
              Practice Score (0 - 10)
            </span>
            {parsedScore !== null && (
              <span className="text-xs font-mono font-bold text-emerald-400">
                Score: {parsedScore.toFixed(1)} / 10
              </span>
            )}
          </div>

          <Input
            id="scoreInput"
            label="Score"
            type="number"
            min="0"
            max="10"
            step="0.1"
            placeholder="e.g. 8.5"
            value={scoreStr}
            onChange={(e) => {
              setScoreStr(e.target.value);
              setErrors((prev) => {
                const copy = { ...prev };
                delete copy.score;
                return copy;
              });
            }}
            error={errors.score}
            helperText="Enter a score from 0 to 10 for this practice session"
          />

          <Input
            label="Practiced Date & Time"
            type="datetime-local"
            value={practicedDate}
            onChange={(e) => setPracticedDate(e.target.value)}
          />
        </div>

        <Textarea
          label="Notes (Optional)"
          rows={3}
          placeholder="Personal reflection, tricky pronunciation words, or coach tips..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#383838]">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
            {isEditing ? 'Save Changes' : 'Create Topic / Session'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
