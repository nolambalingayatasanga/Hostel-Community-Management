import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../../api';

/**
 * Covert background route navigation tracker.
 * Silently records authenticated user page visits to background security telemetry.
 */
export default function RouteTracker() {
  const location = useLocation();
  const lastPathRef = useRef('');

  useEffect(() => {
    const currentPath = location.pathname;
    // Prevent duplicate triggers for the same path
    if (currentPath === lastPathRef.current) return;
    lastPathRef.current = currentPath;

    // Only track if user is authenticated (token exists in localStorage)
    const token = localStorage.getItem('token');
    if (!token) return;

    // Ignore public auth pages
    if (['/login', '/register', '/forgot-password'].includes(currentPath) || currentPath.startsWith('/reset-password')) {
      return;
    }

    // Covert background log
    const timer = setTimeout(() => {
      API.post('/users/track-page-view', {
        path: currentPath,
        pageTitle: document.title || currentPath
      }).catch(() => {
        // Fail silently - telemetry should never impact UX
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
}
