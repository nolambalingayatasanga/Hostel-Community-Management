import dayjs from 'dayjs';

export const WEEK_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const EVENT_COLORS = [
  { label: 'Ocean Blue', value: '#0088ff' },
  { label: 'Royal Purple', value: '#7c3aed' },
  { label: 'Emerald Green', value: '#059669' },
  { label: 'Vibrant Orange', value: '#ea580c' },
  { label: 'Crimson Red', value: '#dc2626' },
  { label: 'Amber Gold', value: '#d97706' },
  { label: 'Sky Cyan', value: '#0284c7' },
  { label: 'Hot Pink', value: '#db2777' },
  { label: 'Deep Indigo', value: '#4f46e5' },
  { label: 'Slate Gray', value: '#475569' }
];

export const DEFAULT_COORDS = { lat: 12.9716, lng: 77.5946 };
export const DEFAULT_PLACE_NAME = 'Bengaluru, Karnataka, India';

/**
 * Format a 24-hour time string ("HH:mm") into 12-hour AM/PM format (e.g., "9:00 AM", "11:55 PM").
 */
export const formatTime = (t) => {
  if (!t) return '';
  if (typeof t === 'string' && (t.includes('AM') || t.includes('PM') || t.includes('am') || t.includes('pm'))) {
    return t;
  }
  const parts = String(t).split(':');
  if (parts.length < 2) return t;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/**
 * Check whether an event falls on a specific date (YYYY-MM-DD), accounting for multi-day events.
 */
export const isEventOnDate = (ev, dateStr) => {
  if (!ev) return false;
  const start = ev.startDate || ev.eventDate ? dayjs(ev.startDate || ev.eventDate).format('YYYY-MM-DD') : '';
  const end = ev.endDate || ev.startDate || ev.eventDate ? dayjs(ev.endDate || ev.startDate || ev.eventDate).format('YYYY-MM-DD') : start;
  if (!start) return false;
  return dateStr >= start && dateStr <= (end || start);
};
