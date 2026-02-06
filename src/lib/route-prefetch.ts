import { dashboardPaths } from './dashboard-routes';

/**
 * Prefetch route chunks on hover for instant navigation.
 * Uses the same import paths as lazy() in App.tsx so chunks are deduplicated.
 */
export function prefetchRoute(route: string): void {
  switch (route) {
    case dashboardPaths.index:
      void import('../pages/Dashboard');
      break;
    case dashboardPaths.roadmap:
      void import('../pages/Roadmap');
      break;
    case dashboardPaths.study:
      void import('../pages/Study');
      break;
    case dashboardPaths.courses:
      void import('../pages/Courses');
      break;
    case dashboardPaths.chat:
      void import('../pages/Chat');
      break;
    case dashboardPaths.careerTools:
      void import('../pages/CareerTools');
      break;
    case dashboardPaths.community:
      void import('../pages/Community');
      break;
    case dashboardPaths.profile:
      void import('../pages/Profile');
      break;
    case dashboardPaths.affiliate:
      void import('../pages/Affiliate');
      break;
    case dashboardPaths.support:
      void import('../pages/Support');
      break;
    case dashboardPaths.upgrade:
      void import('../pages/Upgrade');
      break;
    case '/earn':
      void import('../pages/Earn');
      break;
    case '/wizard':
      void import('../pages/Wizard');
      break;
    default:
      break;
  }
}
