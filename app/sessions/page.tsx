'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { SessionFormDialog } from '@/components/sessions/SessionFormDialog';
import { RecordResultDialog } from '@/components/sessions/RecordResultDialog';
import { TopicLinkManager } from '@/components/sessions/TopicLinkManager';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchSessions, deleteSession, SessionItem } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Plus } from 'lucide-react';

export default function TopicsPage() {
  const { showSuccess, showError } = useToast();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [initialTopicForAdd, setInitialTopicForAdd] = useState<string | undefined>(undefined);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [resultSession, setResultSession] = useState<SessionItem | null>(null);
  const [selectedUrlForResult, setSelectedUrlForResult] = useState<string | undefined>(undefined);
  const [deletingSession, setDeletingSession] = useState<SessionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTopics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchSessions({ limit: 100 });
      setSessions(res.sessions);
    } catch (err: any) {
      showError(err.message || 'Failed to load topics.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const handleConfirmDelete = async () => {
    if (!deletingSession) return;
    setIsDeleting(true);
    try {
      await deleteSession(deletingSession.id);
      showSuccess(`Deleted topic "${deletingSession.topic}".`);
      setDeletingSession(null);
      loadTopics();
    } catch (err: any) {
      showError(err.message || 'Failed to delete topic.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenAddWithTopic = (initialTopic?: string) => {
    setInitialTopicForAdd(initialTopic);
    setIsAddOpen(true);
  };

  const handleRecordResult = (session: SessionItem, initialUrl?: string) => {
    setResultSession(session);
    setSelectedUrlForResult(initialUrl);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#333333]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ececec]">
            Speaking Topics & ChatGPT Links
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Choose a speaking topic to organize, practice, and track your ChatGPT conversation links.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => handleOpenAddWithTopic()}>
          <Plus className="w-4 h-4" />
          Add Session / Topic
        </Button>
      </div>

      {/* Main 1-Page Topic & ChatGPT Links Manager */}
      <TopicLinkManager
        sessions={sessions}
        onRefresh={loadTopics}
        onRecordResult={handleRecordResult}
        onEditSession={(s) => setEditingSession(s)}
        onDeleteSession={(s) => setDeletingSession(s)}
        onOpenAddSession={handleOpenAddWithTopic}
      />

      {/* Dialogs */}
      <SessionFormDialog
        isOpen={isAddOpen}
        initialTopic={initialTopicForAdd}
        onClose={() => {
          setIsAddOpen(false);
          setInitialTopicForAdd(undefined);
        }}
        onSuccess={loadTopics}
      />

      <SessionFormDialog
        isOpen={Boolean(editingSession)}
        sessionToEdit={editingSession}
        onClose={() => setEditingSession(null)}
        onSuccess={loadTopics}
      />

      <RecordResultDialog
        isOpen={Boolean(resultSession)}
        session={resultSession}
        initialUrl={selectedUrlForResult}
        onClose={() => {
          setResultSession(null);
          setSelectedUrlForResult(undefined);
        }}
        onSuccess={loadTopics}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Topic"
        message={`Are you sure you want to delete "${deletingSession?.topic}"? This removes the topic and its saved links from your manager. (Your ChatGPT conversations remain safe in ChatGPT).`}
        confirmLabel="Delete Topic"
      />
    </div>
  );
}
