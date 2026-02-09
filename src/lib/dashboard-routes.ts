/**
 * Single source of truth for dashboard (app) routes.
 * All app routes live under /dashboard so they are clearly protected and not indexed.
 */
export const DASHBOARD_BASE = '/dashboard' as const;

export const dashboardPaths = {
  index: DASHBOARD_BASE,
  roadmap: `${DASHBOARD_BASE}/roadmap`,
  study: `${DASHBOARD_BASE}/study`,
  courses: `${DASHBOARD_BASE}/courses`,
  chat: `${DASHBOARD_BASE}/chat`,
  careerTools: `${DASHBOARD_BASE}/career-tools`,
  community: `${DASHBOARD_BASE}/community`,
  profile: `${DASHBOARD_BASE}/profile`,
  upgrade: `${DASHBOARD_BASE}/upgrade`,
  support: `${DASHBOARD_BASE}/support`,
  tickets: `${DASHBOARD_BASE}/tickets`,
  affiliate: `${DASHBOARD_BASE}/affiliate`,
  checkoutSuccess: `${DASHBOARD_BASE}/checkout/success`,
  checkoutCancel: `${DASHBOARD_BASE}/checkout/cancel`,
} as const;

export function roadmapPath(id?: string): string {
  return id ? `${DASHBOARD_BASE}/roadmap/${id}` : dashboardPaths.roadmap;
}

/** Study page URL; optional roadmap id keeps Study scoped to that roadmap (multi-roadmap UX). */
export function studyPath(roadmapId?: string | null): string {
  if (!roadmapId) return dashboardPaths.study;
  return `${dashboardPaths.study}?roadmap=${encodeURIComponent(roadmapId)}`;
}

/** Courses page URL; optional roadmap id keeps Courses scoped to that roadmap (multi-roadmap UX). */
export function coursesPath(roadmapId?: string | null): string {
  if (!roadmapId) return dashboardPaths.courses;
  return `${dashboardPaths.courses}?roadmap=${encodeURIComponent(roadmapId)}`;
}

/** Paths that are under dashboard (for noindex / isAppPath). */
export const DASHBOARD_PATH_PREFIX = `${DASHBOARD_BASE}/`;

export function isDashboardPath(pathname: string): boolean {
  return pathname === DASHBOARD_BASE || pathname.startsWith(DASHBOARD_PATH_PREFIX);
}
