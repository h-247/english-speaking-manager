'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  fetchSessions,
  fetchTopics,
  createSession,
  createTopic,
  updateTopic,
  deleteTopic,
  SessionItem,
  TopicItem,
} from '@/lib/api-client';
import { PRESET_TOPICS, getPresetTopicByName } from '@/lib/preset-topics';
import { useToast } from '@/components/ui/Toast';

interface PracticeContextType {
  sessions: SessionItem[];
  topics: TopicItem[];
  displayTopics: TopicItem[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedTopicFilter: string;
  setSelectedTopicFilter: (topic: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  viewMode: 'cards' | 'table';
  setViewMode: (mode: 'cards' | 'table') => void;
  topicCounts: Map<string, number>;
  counts: { all: number; toDo: number; doing: number; done: number };
  filteredSessions: SessionItem[];
  loadSessions: () => Promise<void>;
  loadTopics: () => Promise<void>;
  handleInstantCreateSession: (topicName: string) => Promise<void>;
  handleAutoAddTopic: () => Promise<void>;
  handleCreateTopic: (data: { name: string; color: string; icon: string; description?: string }) => Promise<TopicItem | void>;
  handleUpdateTopic: (id: string, data: { name?: string; color?: string; icon?: string; description?: string }) => Promise<void>;
  handleDeleteTopic: (id: string) => Promise<void>;
  editingTopic: TopicItem | null;
  setEditingTopic: (topic: TopicItem | null) => void;
  activePromptChatUrl: string;
  setActivePromptChatUrl: (url: string) => void;
  isEditPromptOpen: boolean;
  setIsEditPromptOpen: (open: boolean) => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  isAddTopicModalOpen: boolean;
  setIsAddTopicModalOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  sortBy: 'default' | 'name' | 'score';
  setSortBy: (sort: 'default' | 'name' | 'score') => void;
}

const PracticeContext = createContext<PracticeContextType | undefined>(undefined);

export function PracticeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { showSuccess, showError } = useToast();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & View state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicFilter, setSelectedTopicFilterState] = useState('ALL');
  const [statusFilter, setStatusFilterState] = useState('ALL');
  const [viewMode, setViewModeState] = useState<'cards' | 'table'>('cards');
  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'score'>('default');

  // Prompt Chat Link state
  const [activePromptChatUrl, setActivePromptChatUrl] = useState<string>('');
  const [isEditPromptOpen, setIsEditPromptOpen] = useState(false);

  // Navigation drawer / collapse state (default sidebar closed)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState(true);
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);

  // Persistent setters that sync to localStorage
  const setIsSidebarCollapsed = useCallback(
    (action: boolean | ((prev: boolean) => boolean)) => {
      setIsSidebarCollapsedState((prev) => {
        const next = typeof action === 'function' ? action(prev) : action;
        try {
          localStorage.setItem('sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    },
    [],
  );

  const setStatusFilter = useCallback((status: string) => {
    setStatusFilterState(status);
    try {
      localStorage.setItem('practice_status_filter', status);
    } catch {}
  }, []);

  const setSelectedTopicFilter = useCallback((topic: string) => {
    setSelectedTopicFilterState(topic);
    try {
      localStorage.setItem('practice_topic_filter', topic);
    } catch {}
  }, []);

  const setViewMode = useCallback((mode: 'cards' | 'table') => {
    setViewModeState(mode);
    try {
      localStorage.setItem('practice_view_mode', mode);
    } catch {}
  }, []);

  const handleAutoAddTopicRef = useRef<() => Promise<void>>(undefined);

  // Load persisted states from localStorage on mount and attach keyboard shortcut (Alt+1, Alt+B, Alt+`)
  useEffect(() => {
    try {
      const storedSidebar = localStorage.getItem('sidebar_collapsed');
      if (storedSidebar !== null) {
        setIsSidebarCollapsedState(storedSidebar === 'true');
      }

      const storedStatus = localStorage.getItem('practice_status_filter');
      if (storedStatus) {
        setStatusFilterState(storedStatus);
      }

      const storedTopic = localStorage.getItem('practice_topic_filter');
      if (storedTopic) {
        setSelectedTopicFilterState(storedTopic);
      }

      const storedViewMode = localStorage.getItem('practice_view_mode');
      if (storedViewMode === 'cards' || storedViewMode === 'table') {
        setViewModeState(storedViewMode);
      }
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      const isAlt = e.altKey;
      if (!isAlt) return;

      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Toggle Sidebar shortcut: Alt+1, Alt+Shift+A, or Alt+B
      const isDigit1 =
        key === '1' ||
        e.code === 'Digit1' ||
        e.code === 'Numpad1' ||
        e.keyCode === 49 ||
        e.keyCode === 97;
      const isToggleSidebar =
        (isAlt && isDigit1) ||
        (isAlt && isShift && key === 'a') ||
        (isAlt && !isShift && key === 'b');

      if (isToggleSidebar) {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
        return;
      }

      // Add Topic shortcut: Alt+` (or Alt+' / Alt+Shift+Z / Alt+Shift+T)
      const isBackquote =
        e.key === '`' ||
        e.key === '~' ||
        e.key === "'" ||
        e.key === '"' ||
        e.code === 'Backquote' ||
        e.code === 'Quote' ||
        e.keyCode === 192 ||
        e.keyCode === 222 ||
        e.which === 192 ||
        e.which === 222;

      const isAddTopic =
        (isAlt && isBackquote) ||
        (isAlt && isShift && (key === 'z' || key === 't'));

      if (isAddTopic) {
        e.preventDefault();
        // Show Add Topic Pop-up Modal on Alt+`
        setIsAddTopicModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSidebarCollapsed]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => !prev);
  }, [setIsSidebarCollapsed]);

  // Load Prompt Chat URL from localStorage
  useEffect(() => {
    const updateUrl = () => {
      try {
        const stored = localStorage.getItem('prompt_chat_url');
        if (stored !== null) {
          setActivePromptChatUrl(stored);
        } else {
          const shared = localStorage.getItem('shared_prompt_url');
          setActivePromptChatUrl(shared || '');
        }
      } catch {}
    };
    updateUrl();
    window.addEventListener('storage', updateUrl);
    window.addEventListener('prompt_chat_url_changed', updateUrl);
    return () => {
      window.removeEventListener('storage', updateUrl);
      window.removeEventListener('prompt_chat_url_changed', updateUrl);
    };
  }, []);

  // Close mobile nav on path change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [pathname]);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchSessions({ limit: 100 });
      setSessions(res.sessions || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load speaking sessions.';
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  const loadTopics = useCallback(async () => {
    try {
      const res = await fetchTopics();
      setTopics(res.topics || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load topics.';
      showError(msg);
    }
  }, [showError]);

  useEffect(() => {
    loadSessions();
    loadTopics();
  }, [loadSessions, loadTopics]);

  // Display Topics (user topics only, no auto-seed fallback)
  const displayTopics = useMemo(() => {
    return topics;
  }, [topics]);

  // Counts by status
  const counts = useMemo(() => {
    let toDo = 0;
    let doing = 0;
    let done = 0;

    sessions.forEach((s) => {
      const st = (s.status || 'To Do').toUpperCase();
      if (st === 'DONE' || st === 'COMPLETED') done++;
      else if (st === 'DOING' || st === 'IN_PROGRESS') doing++;
      else toDo++;
    });

    return {
      all: sessions.length,
      toDo,
      doing,
      done,
    };
  }, [sessions]);

  // Topic session count map
  const topicCounts = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      const key = s.topic.trim().toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [sessions]);

  // Instant create speaking session from topic selection
  const handleInstantCreateSession = useCallback(
    async (topicName: string) => {
      const trimmedTopic = topicName.trim();
      if (!trimmedTopic) return;

      try {
        // Ensure topic exists in topics table
        if (!topics.some((t) => t.name.trim().toLowerCase() === trimmedTopic.toLowerCase())) {
          try {
            const preset = getPresetTopicByName(trimmedTopic);
            await createTopic({
              name: trimmedTopic,
              color: '',
              icon: '',
              description: preset?.description,
            });
          } catch {}
        }

        await createSession({
          topic: trimmedTopic,
          tags: [],
          status: 'To Do',
          chatgptUrl: '',
        });

        showSuccess(`Created speaking session for "${trimmedTopic}"!`);
        await Promise.all([loadSessions(), loadTopics()]);

        // If not already on /sessions or /topics, navigate there
        if (pathname !== '/sessions' && pathname !== '/topics') {
          router.push('/sessions');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create speaking session.';
        showError(msg);
      }
    },
    [topics, loadSessions, loadTopics, pathname, router, showError, showSuccess],
  );

  const isAddingTopicRef = useRef(false);

  // Automatically add topic (starts with "Job & Study" as shown in photo, then next preset)
  const handleAutoAddTopic = useCallback(async () => {
    if (isAddingTopicRef.current) return;
    isAddingTopicRef.current = true;

    try {
      // 1. Fetch fresh sessions and topics to avoid stale closure state
      let currentSessions = sessions;
      let currentTopics = topics;
      try {
        const [freshS, freshT] = await Promise.all([
          fetchSessions({ limit: 100 }),
          fetchTopics(),
        ]);
        if (freshS?.sessions) currentSessions = freshS.sessions;
        if (freshT?.topics) currentTopics = freshT.topics;
      } catch {}

      const existingSessionTopics = new Set(
        currentSessions.map((s) => s.topic.trim().toLowerCase()),
      );

      // 2. Look for any existing topic in user's topics list that doesn't have a session yet
      const topicWithoutSession = currentTopics.find(
        (t) => !existingSessionTopics.has(t.name.trim().toLowerCase()),
      );

      let topicName: string;
      let description = '';

      if (topicWithoutSession) {
        topicName = topicWithoutSession.name;
        description = topicWithoutSession.description || '';
      } else {
        // 3. Otherwise pick the next preset from PRESET_TOPICS
        const nextPreset =
          PRESET_TOPICS.find((p) => !existingSessionTopics.has(p.name.trim().toLowerCase())) ||
          PRESET_TOPICS[0];
        topicName = nextPreset.name;
        description = nextPreset.description;
      }

      // Ensure topic exists in topics table
      if (!currentTopics.some((t) => t.name.trim().toLowerCase() === topicName.toLowerCase())) {
        try {
          await createTopic({
            name: topicName,
            color: '',
            icon: '',
            description,
          });
        } catch {}
      }

      await createSession({
        topic: topicName,
        tags: [],
        status: 'To Do',
        chatgptUrl: '',
      });

      // Reset filters so the newly created session is immediately visible
      setStatusFilterState('ALL');
      try {
        localStorage.setItem('practice_status_filter', 'ALL');
      } catch {}

      setSelectedTopicFilterState('ALL');
      try {
        localStorage.setItem('practice_topic_filter', 'ALL');
      } catch {}

      setSearchQuery('');

      showSuccess(`Created speaking session for "${topicName}"!`);
      await Promise.all([loadSessions(), loadTopics()]);

      if (pathname !== '/sessions' && pathname !== '/topics') {
        router.push('/sessions');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add topic.';
      showError(msg);
    } finally {
      isAddingTopicRef.current = false;
    }
  }, [sessions, topics, loadSessions, loadTopics, pathname, router, showError, showSuccess]);

  handleAutoAddTopicRef.current = handleAutoAddTopic;

  useEffect(() => {
    handleAutoAddTopicRef.current = handleAutoAddTopic;
  }, [handleAutoAddTopic]);

  // Topic management
  const handleCreateTopic = useCallback(
    async (data: { name: string; color: string; icon: string; description?: string }) => {
      try {
        const created = await createTopic(data);
        await loadTopics();
        return created;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to create topic.';
        showError(msg);
        throw err;
      }
    },
    [loadTopics, showError],
  );

  const handleUpdateTopic = useCallback(
    async (id: string, data: { name?: string; color?: string; icon?: string; description?: string }) => {
      try {
        await updateTopic(id, data);
        await loadTopics();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to update topic.';
        showError(msg);
        throw err;
      }
    },
    [loadTopics, showError],
  );

  const handleDeleteTopic = useCallback(
    async (id: string) => {
      try {
        await deleteTopic(id);
        await loadTopics();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to delete topic.';
        showError(msg);
        throw err;
      }
    },
    [loadTopics, showError],
  );

  // Filtered and Sorted Sessions
  const filteredSessions = useMemo(() => {
    const list = sessions.filter((session) => {
      // 1. Topic Filter (Case-insensitive comparison)
      if (selectedTopicFilter && selectedTopicFilter !== 'ALL') {
        const matchesTopic =
          session.topic.trim().toLowerCase() === selectedTopicFilter.trim().toLowerCase();
        if (!matchesTopic) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'ALL') {
        const sessionStatus = (session.status || 'To Do').toUpperCase();
        if (statusFilter === 'To Do' && sessionStatus !== 'TO DO' && sessionStatus !== 'PLANNED') {
          return false;
        }
        if (statusFilter === 'Doing' && sessionStatus !== 'DOING' && sessionStatus !== 'IN_PROGRESS') {
          return false;
        }
        if (statusFilter === 'Done' && sessionStatus !== 'DONE' && sessionStatus !== 'COMPLETED') {
          return false;
        }
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTopic = session.topic.toLowerCase().includes(query);
        const matchesNotes = session.notes?.toLowerCase().includes(query);
        const matchesUrl = session.chatgptUrl?.toLowerCase().includes(query);
        const matchesTags = session.tags?.some((tag) => tag.toLowerCase().includes(query));
        const matchesLinks = session.groupedLinks?.some((l) => l.url.toLowerCase().includes(query));

        if (!matchesTopic && !matchesNotes && !matchesUrl && !matchesTags && !matchesLinks) {
          return false;
        }
      }

      return true;
    });

    // Apply Sorting
    if (sortBy === 'name') {
      return [...list].sort((a, b) => a.topic.localeCompare(b.topic));
    }
    if (sortBy === 'score') {
      return [...list].sort((a, b) => {
        const scoreA = (a as any).bestScore ?? a.score ?? -1;
        const scoreB = (b as any).bestScore ?? b.score ?? -1;
        return scoreB - scoreA;
      });
    }

    return list;
  }, [sessions, selectedTopicFilter, statusFilter, searchQuery, sortBy]);

  return (
    <PracticeContext.Provider
      value={{
        sessions,
        topics,
        displayTopics,
        isLoading,
        searchQuery,
        setSearchQuery,
        selectedTopicFilter,
        setSelectedTopicFilter,
        statusFilter,
        setStatusFilter,
        viewMode,
        setViewMode,
        topicCounts,
        counts,
        filteredSessions,
        loadSessions,
        loadTopics,
        handleInstantCreateSession,
        handleAutoAddTopic,
        handleCreateTopic,
        handleUpdateTopic,
        handleDeleteTopic,
        editingTopic,
        setEditingTopic,
        activePromptChatUrl,
        setActivePromptChatUrl,
        isEditPromptOpen,
        setIsEditPromptOpen,
        isMobileNavOpen,
        setIsMobileNavOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
        isAddTopicModalOpen,
        setIsAddTopicModalOpen,
        sortBy,
        setSortBy,
      }}
    >
      {children}
    </PracticeContext.Provider>
  );
}

export function usePractice() {
  const context = useContext(PracticeContext);
  if (!context) {
    throw new Error('usePractice must be used within a PracticeProvider');
  }
  return context;
}
