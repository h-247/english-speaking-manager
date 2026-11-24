'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { SessionTable } from '@/components/sessions/SessionTable';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionFormDialog } from '@/components/sessions/SessionFormDialog';
import { RecordResultDialog } from '@/components/sessions/RecordResultDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TopicSelectDropdown } from '@/components/topics/TopicSelectDropdown';
import { usePractice } from '@/context/PracticeContext';
import { deleteSession, updateSession, SessionItem } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Sparkles, Plus, FolderPlus } from 'lucide-react';

export function TopicsPageContent({
  defaultTab,
}: {
  defaultTab?: 'crud' | 'workspace';
} = {}) {
  const { showSuccess, showError } = useToast();
  const {
    sessions,
    topics,
    displayTopics,
    isLoading,
    filteredSessions,
    viewMode,
    selectedTopicFilter,
    setSelectedTopicFilter,
    setStatusFilter,
    setSearchQuery,
    loadSessions,
    loadTopics,
    handleInstantCreateSession,
    handleAutoAddTopic,
    handleCreateTopic,
    handleUpdateTopic,
    handleDeleteTopic,
  } = usePractice();

  // Session dialog states
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [resultSession, setResultSession] = useState<SessionItem | null>(null);
  const [deletingSession, setDeletingSession] = useState<SessionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deletingSession) return;
    setIsDeleting(true);
    try {
      await deleteSession(deletingSession.id);
      showSuccess(`Deleted session "${deletingSession.topic}".`);
      setDeletingSession(null);
      await loadSessions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete session.';
      showError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (
    session: SessionItem,
    newStatus: 'To Do' | 'Doing' | 'Done' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | string,
  ) => {
    try {
      const normalizedStatus = newStatus === 'To do' ? 'To Do' : newStatus;
      await updateSession(session.id, { status: normalizedStatus as any });
      showSuccess(`Updated status to ${newStatus}.`);
      await loadSessions();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status.';
      showError(msg);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150" suppressHydrationWarning>
      {/* Practice Sessions Content Area */}
      {filteredSessions.length > 0 ? (
        viewMode === 'table' ? (
          <SessionTable
            sessions={filteredSessions}
            onEdit={(s) => setEditingSession(s)}
            onDelete={(s) => setDeletingSession(s)}
            onRecordResult={(s) => setResultSession(s)}
            onStatusChange={handleStatusChange}
            onRefresh={loadSessions}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onEdit={(s) => setEditingSession(s)}
                onDelete={(s) => setDeletingSession(s)}
                onRecordResult={(s) => setResultSession(s)}
                onStatusChange={handleStatusChange}
                onRefresh={loadSessions}
              />
            ))}
          </div>
        )
      ) : sessions.length > 0 ? (
        /* Filter matched 0 results */
        <div className="bg-[#262626] border border-[#383838] rounded-xl p-8 text-center space-y-3">
          <FolderPlus className="w-10 h-10 mx-auto text-gray-500" />
          <h3 className="text-base font-bold text-gray-200">
            No sessions match your filter
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            {selectedTopicFilter !== 'ALL'
              ? `No sessions found for "${selectedTopicFilter}". Click below to start practicing this topic.`
              : 'Try clearing your search query or changing your status filter.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {selectedTopicFilter !== 'ALL' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleInstantCreateSession(selectedTopicFilter)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Practice topic &quot;{selectedTopicFilter}&quot;
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTopicFilter('ALL');
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      ) : (
        /* Empty State: 0 sessions in library */
        <div className="bg-[#262626] border border-[#383838] rounded-xl p-8 sm:p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-950/60 border border-blue-800/40 text-blue-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-100">
              No speaking practice sessions yet
            </h3>
            <p className="text-sm text-gray-400 max-w-lg mx-auto">
              Get started by clicking &quot;Add Topic&quot; in the sidebar or below to practice with ChatGPT and track your scores.
            </p>
          </div>
          <div className="mt-2 flex justify-center">
            <TopicSelectDropdown
              topics={displayTopics}
              onSelectTopic={(topicName) => handleInstantCreateSession(topicName)}
              onCreateTopic={handleCreateTopic}
              onUpdateTopic={handleUpdateTopic}
              onDeleteTopic={handleDeleteTopic}
              triggerLabel="Add Topic"
              showChevron={false}
              align="center"
            />
          </div>
        </div>
      )}

      {/* Edit Session Dialog */}
      <SessionFormDialog
        isOpen={Boolean(editingSession)}
        sessionToEdit={editingSession}
        topics={topics}
        onClose={() => setEditingSession(null)}
        onSuccess={() => {
          loadSessions();
          loadTopics();
        }}
      />

      {/* Record Score Dialog */}
      <RecordResultDialog
        isOpen={Boolean(resultSession)}
        session={resultSession}
        onClose={() => setResultSession(null)}
        onSuccess={loadSessions}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Session"
        message={`Are you sure you want to delete session "${deletingSession?.topic}"? This removes the session link and score from your manager. (Your ChatGPT conversations remain safe in ChatGPT).`}
        confirmLabel="Delete Session"
      />
    </div>
  );
}
