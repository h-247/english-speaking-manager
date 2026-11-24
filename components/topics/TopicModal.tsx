'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TopicItem } from '@/lib/api-client';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: TopicItem | null; // if null, Create mode; if provided, Edit mode
  initialName?: string;
  onSave: (data: { name: string; color: string; icon: string; description?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function TopicModal({
  isOpen,
  onClose,
  topic,
  initialName = '',
  onSave,
  onDelete,
}: TopicModalProps) {
  const { showError, showSuccess } = useToast();
  const isEditing = Boolean(topic);

  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (topic) {
      setName(topic.name);
    } else {
      setName(initialName);
    }
    setError('');
  }, [topic, initialName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Topic name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave({
        name: trimmed,
        color: '',
        icon: '',
        description: topic?.description || undefined,
      });
      showSuccess(isEditing ? `Topic "${trimmed}" updated.` : `Topic "${trimmed}" created.`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save topic.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!topic || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(topic.id);
      showSuccess(`Deleted topic "${topic.name}".`);
      setIsConfirmDeleteOpen(false);
      onClose();
    } catch (err: any) {
      showError(err.message || 'Failed to delete topic.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Edit Topic' : 'Create New Topic'}
        description={
          isEditing
            ? 'Update the name of this speaking topic.'
            : 'Enter a name for the new speaking topic.'
        }
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="topic-modal-name"
            label="Topic Name"
            placeholder="e.g. Vocabulary - Nouns, Grammar Drill, Tech..."
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            error={error}
            required
            autoFocus
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[#2b303c]">
            {isEditing && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setIsConfirmDeleteOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                {isEditing ? 'Save Changes' : 'Create Topic'}
              </Button>
            </div>
          </div>
        </form>
      </Dialog>

      {/* Delete Topic Confirmation */}
      {topic && (
        <ConfirmDialog
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
          title={`Delete Topic "${topic.name}"?`}
          message="Are you sure you want to delete this topic? Practice sessions using this topic will remain intact."
          confirmLabel="Delete Topic"
          isDestructive
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
