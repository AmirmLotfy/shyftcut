import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/event-tracking';

/**
 * Component to track page views on route changes
 */
export function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return null;
}
