/**
 * Single source of truth for premium benefits. Used on Upgrade page and for
 * contextual upgrade prompts (roadmap, chat, quiz, notes, tasks, ai_suggestions).
 */

export type PremiumFeatureKey =
  | 'roadmaps'
  | 'chat'
  | 'quizzes'
  | 'courses'
  | 'cv_analysis'
  | 'find_jobs'
  | 'analytics';

export type UpgradePromptFeature =
  | 'roadmap'
  | 'chat'
  | 'quiz'
  | 'notes'
  | 'tasks'
  | 'ai_suggestions';

/** Feature key used in UpgradePrompt to pick the matching benefit label */
export const UPGRADE_PROMPT_TO_BENEFIT: Record<UpgradePromptFeature, PremiumFeatureKey> = {
  roadmap: 'roadmaps',
  chat: 'chat',
  quiz: 'quizzes',
  notes: 'roadmaps', // notes are part of roadmap experience; show roadmaps benefit
  tasks: 'roadmaps',
  ai_suggestions: 'chat',
};

const premiumFeaturesByKey: Record<PremiumFeatureKey, { en: string; ar: string }> = {
  roadmaps: { en: 'Unlimited roadmaps', ar: 'خرائط طريق غير محدودة' },
  chat: { en: 'Unlimited AI chat', ar: 'دردشة ذكاء اصطناعي غير محدودة' },
  quizzes: { en: 'Unlimited quizzes', ar: 'اختبارات غير محدودة' },
  courses: { en: 'Full course recommendations', ar: 'توصيات دورات كاملة' },
  cv_analysis: { en: 'CV analysis (paste or upload)', ar: 'تحليل السيرة الذاتية (لصق أو رفع)' },
  find_jobs: {
    en: 'Find jobs for me — 10 real jobs weekly',
    ar: 'اعثر على وظائف لي — 10 وظائف حقيقية أسبوعياً',
  },
  analytics: { en: 'Progress tracking & analytics', ar: 'تتبع التقدم والتحليلات' },
};

const ORDER: PremiumFeatureKey[] = [
  'roadmaps',
  'chat',
  'quizzes',
  'courses',
  'cv_analysis',
  'find_jobs',
  'analytics',
];

/** Full list of premium features for Upgrade page (en/ar). */
export function getPremiumFeaturesList(lang: 'en' | 'ar') {
  return ORDER.map((key) => premiumFeaturesByKey[key][lang]);
}

/** Single benefit label for contextual prompts (e.g. "Unlimited roadmaps"). */
export function getBenefitLabel(
  feature: UpgradePromptFeature,
  lang: 'en' | 'ar'
): string {
  const key = UPGRADE_PROMPT_TO_BENEFIT[feature];
  return premiumFeaturesByKey[key][lang];
}

/** Benefits relevant to Career Tools (CV, Find jobs). */
export function getCareerToolsBenefits(lang: 'en' | 'ar'): string[] {
  return [
    premiumFeaturesByKey.cv_analysis[lang],
    premiumFeaturesByKey.find_jobs[lang],
  ];
}

/** Short "Unlock: …" line for Dashboard free plan bar. */
export function getUnlockSummary(lang: 'en' | 'ar'): string {
  return lang === 'ar'
    ? 'فتح: خرائط طريق غير محدودة، دردشة ذكاء اصطناعي، اختبارات، والمزيد'
    : 'Unlock: unlimited roadmaps, AI chat, quizzes, and more';
}
