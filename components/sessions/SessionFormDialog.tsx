'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { validateChatGPTUrl } from '@/lib/chatgpt-url';
import { calculateScore, formatScore } from '@/lib/scoring';
import { createSession, updateSession, SessionItem } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';

export interface SessionFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit?: SessionItem | null;
  initialTopic?: string;
  onSuccess: () => void;
}

export function SessionFormDialog({
  isOpen,
  onClose,
  sessionToEdit,
  initialTopic,
  onSuccess,
}: SessionFormDialogProps) {
  const { showSuccess, showError } = useToast();
  const isEditing = Boolean(sessionToEdit);

  const [topic, setTopic] = useState('');
  const [chatgptUrl, setChatgptUrl] = useState('');
  const [status, setStatus] = useState<'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'>('PLANNED');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [passCountStr, setPassCountStr] = useState('');
  const [failCountStr, setFailCountStr] = useState('');
  const [practicedDate, setPracticedDate] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sessionToEdit) {
      setTopic(sessionToEdit.topic);
      setChatgptUrl(sessionToEdit.chatgptUrl);
      setStatus(sessionToEdit.status);
      setNotes(sessionToEdit.notes || '');
      setTagsInput(sessionToEdit.tags ? sessionToEdit.tags.join(', ') : '');
      setPassCountStr(
        sessionToEdit.passCount !== null && sessionToEdit.passCount !== undefined
          ? String(sessionToEdit.passCount)
          : '',
      );
      setFailCountStr(
        sessionToEdit.failCount !== null && sessionToEdit.failCount !== undefined
          ? String(sessionToEdit.failCount)
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
      setStatus('PLANNED');
      setNotes('');
      setTagsInput('');
      setPassCountStr('');
      setFailCountStr('');
      setPracticedDate('');
    }
    setErrors({});
  }, [sessionToEdit, isOpen, initialTopic]);

  const passNum = passCountStr !== '' ? parseInt(passCountStr, 10) : null;
  const failNum = failCountStr !== '' ? parseInt(failCountStr, 10) : null;
  const scorePreview = calculateScore(passNum, failNum);

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

    const urlValidation = validateChatGPTUrl(chatgptUrl);
    if (!urlValidation.isValid) {
      newErrors.chatgptUrl =
        urlValidation.error ||
        'Please enter a valid official HTTPS ChatGPT link (e.g. https://chatgpt.com/c/...)';
    }

    if (passCountStr !== '') {
      const p = Number(passCountStr);
      if (!Number.isInteger(p) || p < 0) {
        newErrors.passCount = 'Pass count must be a non-negative whole integer.';
      }
    }

    if (failCountStr !== '') {
      const f = Number(failCountStr);
      if (!Number.isInteger(f) || f < 0) {
        newErrors.failCount = 'Fail count must be a non-negative whole integer.';
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

      const parsedPass = passCountStr !== '' ? parseInt(passCountStr, 10) : null;
      const parsedFail = failCountStr !== '' ? parseInt(failCountStr, 10) : null;
      const isoPracticed = practicedDate ? new Date(practicedDate).toISOString() : null;

      if (isEditing && sessionToEdit) {
        await updateSession(sessionToEdit.id, {
          topic: topic.trim(),
          chatgptUrl: chatgptUrl.trim(),
          status,
          notes: notes.trim() || null,
          tags: tagsArray,
          passCount: parsedPass,
          failCount: parsedFail,
          practicedAt: isoPracticed,
        });
        showSuccess(`Updated session "${topic.trim()}".`);
      } else {
        await createSession({
          topic: topic.trim(),
          chatgptUrl: chatgptUrl.trim(),
          status,
          notes: notes.trim() || null,
          tags: tagsArray,
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
      title={isEditing ? 'Edit Speaking Session / Topic' : 'Add Speaking Session / Topic'}
      description={
        isEditing
          ? 'Update topic details, ChatGPT link, or practice notes.'
          : 'Save a new ChatGPT conversation link to practice speaking and group attempts by topic.'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Topic"
          required
          placeholder="e.g. Overcoming Fear of Public Speaking"
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
          helperText="The subject or presentation title for your speaking practice"
        />

        <Input
          label="ChatGPT Conversation URL"
          required
          type="url"
          placeholder="https://chatgpt.com/c/your-conversation-id"
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
          helperText="ChatGPT conversation link for this topic (branches & other links can be added per practice attempt)"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            options={[
              { value: 'PLANNED', label: 'Planned (Yellow)' },
              { value: 'IN_PROGRESS', label: 'In Progress (Blue)' },
              { value: 'COMPLETED', label: 'Completed (Green)' },
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

        {/* Optional Practice Results section */}
        <div className="p-3.5 rounded-xl bg-[#1c1c1c] border border-[#333333] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300">
              Practice Results (Optional)
            </span>
            {scorePreview !== null && (
              <span className="text-xs font-mono font-bold text-emerald-400">
                Score: {formatScore(scorePreview)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pass Count"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 50"
              value={passCountStr}
              onChange={(e) => setPassCountStr(e.target.value)}
              error={errors.passCount}
            />
            <Input
              label="Fail Count"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 5"
              value={failCountStr}
              onChange={(e) => setFailCountStr(e.target.value)}
              error={errors.failCount}
            />
          </div>

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
