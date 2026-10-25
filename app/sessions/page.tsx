'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { FilterControls } from '@/components/sessions/FilterControls';
import { SessionTable } from '@/components/sessions/SessionTable';
import { SessionCard } from '@/components/sessions/SessionCard';
import { SessionFormDialog } from '@/components/sessions/SessionFormDialog';
import { RecordResultDialog } from '@/components/sessions/RecordResultDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { fetchSessions, deleteSession, updateSession, SessionItem } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { Plus, Layers, SearchX } from 'lucide-react';

export default function SessionsLibraryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Sorting
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');
  const [status, setStatus] = useState<string>(searchParams.get('status') || 'ALL');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'recently_updated');

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionItem | null>(null);
  const [resultSession, setResultSession] = useState<SessionItem | null>(null);
  const [deletingSession, setDeletingSession] = useState<SessionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchSessions({
        search,
        status: status !== 'ALL' ? status : undefined,
        sortBy,
      });
      setSessions(res.sessions);
      setTotal(res.total);
    } catch (err: any) {
      showError(err.message || 'Failed to load sessions.');
    } finally {
      setIsLoading(false);
    }
  }, [search, status, sortBy, showError]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('ALL');
    setSortBy('recently_updated');
  };

  const handleStatusChange = async (
    session: SessionItem,
    newStatus: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED',
  ) => {
    try {
      await updateSession(session.id, { status: newStatus });
      showSuccess(`Status updated to ${newStatus}.`);
      loadSessions();
    } catch (err: any) {
      showError(err.message || 'Failed to update status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSession) return;
    setIsDeleting(true);
    try {
      await deleteSession(deletingSession.id);
      showSuccess(`Deleted session "${deletingSession.topic}".`);
      setDeletingSession(null);
      loadSessions();
    } catch (err: any) {
      showError(err.message || 'Failed to delete session.');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilters = search.trim() !== '' || status !== 'ALL' || sortBy !== 'recently_updated';

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#333333]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ececec]">
            Sessions Library
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse, manage, and resume all saved ChatGPT speaking conversations.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Session
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <FilterControls
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Sessions Count Indicator */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>
          Showing <b className="text-gray-200">{sessions.length}</b> of{' '}
          <b className="text-gray-200">{total}</b> speaking sessions
        </span>
      </div>

      {/* Loading & Empty States */}
      {isLoading ? (
        <LoadingState message="Fetching sessions..." />
      ) : sessions.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={<SearchX className="w-8 h-8" />}
            title="No Matching Sessions"
            description="No speaking sessions match your current search query and filters. Try adjusting your search or clearing filters."
            actionLabel="Reset All Filters"
            onAction={handleResetFilters}
          />
        ) : (
          <EmptyState
            icon={<Layers className="w-8 h-8" />}
            title="Library is Empty"
            description="You have not saved any speaking sessions yet. Copy the English coach prompt, start a 5-minute B2 session on ChatGPT, and save the conversation link here."
            actionLabel="Add First Session"
            onAction={() => setIsAddOpen(true)}
            actionIcon={<Plus className="w-4 h-4 mr-1.5" />}
          />
        )
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <SessionTable
              sessions={sessions}
              onEdit={(s) => setEditingSession(s)}
              onDelete={(s) => setDeletingSession(s)}
              onRecordResult={(s) => setResultSession(s)}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onEdit={(session) => setEditingSession(session)}
                onDelete={(session) => setDeletingSession(session)}
                onRecordResult={(session) => setResultSession(session)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </>
      )}

      {/* Dialogs */}
      <SessionFormDialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadSessions}
      />

      <SessionFormDialog
        isOpen={Boolean(editingSession)}
        sessionToEdit={editingSession}
        onClose={() => setEditingSession(null)}
        onSuccess={loadSessions}
      />

      <RecordResultDialog
        isOpen={Boolean(resultSession)}
        session={resultSession}
        onClose={() => setResultSession(null)}
        onSuccess={loadSessions}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingSession)}
        onClose={() => setDeletingSession(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Session Record"
        message={`Are you sure you want to delete "${deletingSession?.topic}"? This removes the record from your manager library. (The actual ChatGPT conversation will remain safe in your ChatGPT account).`}
        confirmLabel="Delete Session"
      />
    </div>
  );
}
