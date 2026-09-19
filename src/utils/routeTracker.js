/**
 * Session-based Route Navigation Tracker
 * Batches visited paths in sessionStorage and flushes them to the server
 * only when the user logs out, closes the tab, or refreshes the page.
 */

const SESSION_STORAGE_KEY = 'session_tracked_pages';

const PUBLIC_EXCLUDED_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];

/**
 * Record a visited path in the current browser tab's sessionStorage without making an API call.
 */
export const recordPageView = (pathname, customTitle = '') => {
  try {
    if (typeof window === 'undefined' || !pathname) return;

    // Only record for authenticated users
    const token = localStorage.getItem('token');
    if (!token) return;

    // Exclude public authentication pages
    const isExcluded = PUBLIC_EXCLUDED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (isExcluded) return;

    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    let pagesMap = {};
    if (raw) {
      try {
        pagesMap = JSON.parse(raw) || {};
      } catch {
        pagesMap = {};
      }
    }

    const currentEntry = pagesMap[pathname] || {};
    pagesMap[pathname] = {
      path: pathname,
      pageTitle: customTitle || document.title || currentEntry.pageTitle || pathname,
      lastVisitedAt: new Date().toISOString(),
      count: (currentEntry.count || 0) + 1
    };

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(pagesMap));
  } catch (err) {
    // Fail silently - telemetry should never impact UX
  }
};

/**
 * Flush all session-tracked pages to the server API.
 * Uses keepalive fetch so it survives page reloads and tab closures.
 */
export const flushVisitedPages = (isLogout = false) => {
  try {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return;

    let pagesMap = {};
    try {
      pagesMap = JSON.parse(raw);
    } catch {
      return;
    }

    const pages = Object.values(pagesMap || {});
    if (pages.length === 0) return;

    const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
    const url = `${apiBase}/users/track-page-view`;

    const payload = JSON.stringify({ pages });

    // Use keepalive fetch which is standard for beforeunload/pagehide and logout
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: payload,
      keepalive: true
    }).catch(() => {
      // Ignore background network errors
    });

    if (isLogout) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch (err) {
    // Fail silently
  }
};
