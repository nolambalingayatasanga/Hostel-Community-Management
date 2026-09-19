import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { recordPageView, flushVisitedPages } from '../../utils/routeTracker';

/**
 * Route Navigation Tracker.
 * Records authenticated page views silently in sessionStorage.
 * Dispatches to backend telemetry ONLY on tab close, page refresh, or logout.
 */
export default function RouteTracker() {
  const location = useLocation();
  const lastPathRef = useRef('');

  // Record route visits in session storage (Zero network requests per navigation)
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === lastPathRef.current) return;
    lastPathRef.current = currentPath;

    recordPageView(currentPath, document.title || currentPath);
  }, [location.pathname]);

  // Flush to server API on page refresh, tab close, or window hide
  useEffect(() => {
    const handleUnload = () => {
      flushVisitedPages(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushVisitedPages(false);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
