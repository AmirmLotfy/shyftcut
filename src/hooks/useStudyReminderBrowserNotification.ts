import { useEffect, useRef } from 'react';
import { useNotificationPreferences } from './useNotificationPreferences';
import { useStudyStreak } from './useStudyStreak';

const STORAGE_KEY_PREFIX = 'shyftcut_reminder_notified_';

function getCurrentHourInTimezone(tz: string): number {
  try {
    const str = new Date().toLocaleString('en-US', { timeZone: tz || 'UTC', hour: '2-digit', hour12: false });
    return parseInt(str, 10) || 0;
  } catch {
    return new Date().getUTCHours();
  }
}

function parseReminderHour(reminderTime: string): number {
  const match = String(reminderTime || '20:00').trim().match(/^(\d{1,2})/);
  return match ? Math.min(23, Math.max(0, parseInt(match[1], 10))) : 20;
}

/**
 * When app is open and current hour (in user timezone) matches reminder_time
 * and user has not studied today, show a browser Notification once per day.
 * Re-checks every 5 minutes so crossing into the reminder hour is caught.
 */
export function useStudyReminderBrowserNotification() {
  const { preferences } = useNotificationPreferences();
  const { streak } = useStudyStreak();
  const activity_dates = streak.activity_dates ?? [];
  const notifiedRef = useRef<string | null>(null);

  const check = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const tz = preferences?.timezone || 'UTC';
    const reminderTime = preferences?.reminder_time || '20:00';
    const reminderHour = parseReminderHour(reminderTime);
    const currentHour = getCurrentHourInTimezone(tz);
    if (currentHour !== reminderHour) return;

    const today = new Date().toISOString().slice(0, 10);
    const studiedToday = activity_dates.includes(today);
    if (studiedToday) return;

    const storageKey = STORAGE_KEY_PREFIX + today;
    try {
      if (sessionStorage.getItem(storageKey) === '1') return;
      if (notifiedRef.current === today) return;
    } catch {
      return;
    }

    const show = () => {
      try {
        new Notification('Shyftcut', {
          body: "Don't break your streak — study today!",
          icon: '/favicon.ico',
        });
        notifiedRef.current = today;
        sessionStorage.setItem(storageKey, '1');
      } catch {
        /* ignore */
      }
    };

    if (Notification.permission === 'granted') {
      show();
      return;
    }
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((p) => {
        if (p === 'granted') show();
      });
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [preferences?.timezone, preferences?.reminder_time, streak.activity_dates]);
}
