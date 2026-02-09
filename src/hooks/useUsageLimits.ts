import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from './useSubscription';
import { apiFetch } from '@/lib/api';

interface UsageData {
  roadmapsCreated: number;
  chatMessagesThisMonth: number;
  quizzesTakenThisMonth?: number;
  notesCount?: number;
  tasksCount?: number;
  aiSuggestionsToday?: number;
  avatarGenerationsThisMonth?: number;
}

interface UsageLimits {
  roadmaps: number;
  chatMessages: number;
  quizzes: number;
  notes: number;
  tasks: number;
  aiSuggestionsPerDay: number;
}

export function useUsageLimits() {
  const { user, session, getAccessToken } = useAuth();
  const { tier, features, isUnlimited } = useSubscription();

  const { data: usage, isLoading, refetch } = useQuery({
    queryKey: ['usage-limits', user?.id],
    queryFn: async (): Promise<UsageData> => {
      if (!user) return { roadmapsCreated: 0, chatMessagesThisMonth: 0, quizzesTakenThisMonth: 0 };
      const token = await getAccessToken();
      return apiFetch<UsageData>('/api/usage', { token });
    },
    enabled: !!user && !!session,
    staleTime: 2 * 60 * 1000,
  });

  const limits: UsageLimits = {
    roadmaps: features.roadmapsPerMonth,
    chatMessages: features.chatQuestionsPerMonth,
    quizzes: features.quizzesPerMonth,
    notes: features.notesLimit,
    tasks: features.tasksLimit,
    aiSuggestionsPerDay: features.aiSuggestionsPerDay,
  };

  const canCreateRoadmap = (): boolean => {
    if (isUnlimited('roadmapsPerMonth')) return true;
    return (usage?.roadmapsCreated ?? 0) < limits.roadmaps;
  };

  const canSendChatMessage = (): boolean => {
    if (isUnlimited('chatQuestionsPerMonth')) return true;
    return (usage?.chatMessagesThisMonth ?? 0) < limits.chatMessages;
  };

  const getRoadmapsRemaining = (): number => {
    if (isUnlimited('roadmapsPerMonth')) return -1;
    return Math.max(0, limits.roadmaps - (usage?.roadmapsCreated ?? 0));
  };

  const getChatMessagesRemaining = (): number => {
    if (isUnlimited('chatQuestionsPerMonth')) return -1;
    return Math.max(0, limits.chatMessages - (usage?.chatMessagesThisMonth ?? 0));
  };

  const canTakeQuiz = (): boolean => {
    if (isUnlimited('quizzesPerMonth')) return true;
    return (usage?.quizzesTakenThisMonth ?? 0) < limits.quizzes;
  };

  const getQuizzesRemaining = (): number => {
    if (isUnlimited('quizzesPerMonth')) return -1;
    return Math.max(0, limits.quizzes - (usage?.quizzesTakenThisMonth ?? 0));
  };

  const canCreateNote = (): boolean => {
    if (isUnlimited('notesLimit')) return true;
    return (usage?.notesCount ?? 0) < limits.notes;
  };

  const getNotesRemaining = (): number => {
    if (isUnlimited('notesLimit')) return -1;
    return Math.max(0, limits.notes - (usage?.notesCount ?? 0));
  };

  const canCreateTask = (): boolean => {
    if (isUnlimited('tasksLimit')) return true;
    return (usage?.tasksCount ?? 0) < limits.tasks;
  };

  const getTasksRemaining = (): number => {
    if (isUnlimited('tasksLimit')) return -1;
    return Math.max(0, limits.tasks - (usage?.tasksCount ?? 0));
  };

  const canSuggestTasks = (): boolean => {
    if (isUnlimited('aiSuggestionsPerDay')) return true;
    return (usage?.aiSuggestionsToday ?? 0) < limits.aiSuggestionsPerDay;
  };

  const getAiSuggestionsRemaining = (): number => {
    if (isUnlimited('aiSuggestionsPerDay')) return -1;
    return Math.max(0, limits.aiSuggestionsPerDay - (usage?.aiSuggestionsToday ?? 0));
  };

  const getAvatarGenerationsRemaining = (): number => {
    const AVATAR_LIMIT_PER_MONTH = 3;
    return Math.max(0, AVATAR_LIMIT_PER_MONTH - (usage?.avatarGenerationsThisMonth ?? 0));
  };

  const canGenerateAvatar = (): boolean => {
    const AVATAR_LIMIT_PER_MONTH = 3;
    return (usage?.avatarGenerationsThisMonth ?? 0) < AVATAR_LIMIT_PER_MONTH;
  };

  return {
    usage,
    limits,
    isLoading,
    refetch,
    tier,
    canCreateRoadmap,
    canSendChatMessage,
    canTakeQuiz,
    getRoadmapsRemaining,
    getChatMessagesRemaining,
    getQuizzesRemaining,
    isUnlimitedRoadmaps: isUnlimited('roadmapsPerMonth'),
    isUnlimitedChat: isUnlimited('chatQuestionsPerMonth'),
    isUnlimitedQuizzes: isUnlimited('quizzesPerMonth'),
    canCreateNote,
    canCreateTask,
    canSuggestTasks,
    getNotesRemaining,
    getTasksRemaining,
    getAiSuggestionsRemaining,
    getAvatarGenerationsRemaining,
    canGenerateAvatar,
    isUnlimitedNotes: isUnlimited('notesLimit'),
    isUnlimitedTasks: isUnlimited('tasksLimit'),
    isUnlimitedAiSuggestions: isUnlimited('aiSuggestionsPerDay'),
  };
}
