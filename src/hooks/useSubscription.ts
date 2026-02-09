import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface SubscriptionResponse {
  tier?: SubscriptionTier;
  status?: string;
  current_period_start?: string;
  current_period_end?: string;
  polar_customer_id?: string;
  polar_subscription_id?: string;
  [key: string]: unknown;
}

const CACHE_KEY_PREFIX = 'shyftcut_sub_tier';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function getCachedTier(userId: string): SubscriptionTier | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}_${userId}`);
    if (!raw) return null;
    const { tier, ts } = JSON.parse(raw) as { tier?: string; ts?: number };
    if (ts == null || Date.now() - ts > CACHE_TTL_MS) return null;
    if (['free', 'premium', 'pro'].includes(String(tier))) return tier as SubscriptionTier;
    return null;
  } catch {
    return null;
  }
}

function setCachedTier(userId: string, tier: SubscriptionTier): void {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}_${userId}`, JSON.stringify({ tier, ts: Date.now() }));
  } catch {
    // ignore
  }
}

interface SubscriptionFeatures {
  roadmapsPerMonth: number;
  chatQuestionsPerMonth: number;
  quizzesPerMonth: number;
  notesLimit: number;
  tasksLimit: number;
  aiSuggestionsPerDay: number;
  fullCourseRecommendations: boolean;
  progressTracking: boolean;
  cvAnalysis: boolean;
  jobRecommendations: boolean;
}

const tierFeatures: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    roadmapsPerMonth: 1,
    chatQuestionsPerMonth: 10,
    quizzesPerMonth: 3,
    notesLimit: 20,
    tasksLimit: 30,
    aiSuggestionsPerDay: 5,
    fullCourseRecommendations: false,
    progressTracking: true,
    cvAnalysis: false,
    jobRecommendations: false,
  },
  premium: {
    roadmapsPerMonth: -1,
    chatQuestionsPerMonth: -1,
    quizzesPerMonth: -1,
    notesLimit: -1,
    tasksLimit: -1,
    aiSuggestionsPerDay: -1,
    fullCourseRecommendations: true,
    progressTracking: true,
    cvAnalysis: true,
    jobRecommendations: true,
  },
  pro: {
    roadmapsPerMonth: -1,
    chatQuestionsPerMonth: -1,
    quizzesPerMonth: -1,
    notesLimit: -1,
    tasksLimit: -1,
    aiSuggestionsPerDay: -1,
    fullCourseRecommendations: true,
    progressTracking: true,
    cvAnalysis: true,
    jobRecommendations: true,
  },
};

export function useSubscription() {
  const { user, session, getAccessToken } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const token = await getAccessToken();
      return apiFetch<SubscriptionResponse | null>('/api/subscription', { token });
    },
    enabled: !!user && !!session,
    staleTime: 2 * 60 * 1000, // 2 min: serve cached data instantly when navigating
    placeholderData: (): SubscriptionResponse | null => {
      if (!user?.id) return null;
      const cached = getCachedTier(user.id);
      return cached ? { tier: cached } : null;
    },
  });

  useEffect(() => {
    if (user?.id && subscription?.tier) {
      setCachedTier(user.id, subscription.tier as SubscriptionTier);
    }
  }, [user?.id, subscription?.tier]);

  const sub = subscription ?? null;
  const tier: SubscriptionTier = (sub?.tier ?? 'free') as SubscriptionTier;
  const features = tierFeatures[tier];
  const periodEnd: string | null = sub?.current_period_end ?? null;
  const status: string | null = sub?.status ?? null;

  const canUseFeature = (feature: keyof SubscriptionFeatures): boolean => {
    const value = features[feature];
    if (typeof value === 'boolean') return value;
    return value !== 0;
  };

  const isUnlimited = (feature: 'roadmapsPerMonth' | 'chatQuestionsPerMonth' | 'quizzesPerMonth' | 'notesLimit' | 'tasksLimit' | 'aiSuggestionsPerDay'): boolean => {
    return features[feature] === -1;
  };

  return {
    subscription: sub,
    tier,
    features,
    isLoading,
    canUseFeature,
    isUnlimited,
    isPremium: tier === 'premium' || tier === 'pro',
    isPro: tier === 'pro',
    periodEnd,
    status,
  };
}
