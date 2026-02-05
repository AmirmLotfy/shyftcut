import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, apiPath, apiHeaders } from '@/lib/api';

/** Subscribe for Web Push and save to backend. Returns success or error message. */
export async function subscribePush(getAccessToken: () => Promise<string | null>): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, error: 'Push not supported' };
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const vapidRes = await fetch(apiPath('/api/vapid-public') + (apiPath('/api/vapid-public').includes('?') ? '&' : '?') + 'path=' + encodeURIComponent('/api/vapid-public'), {
      headers: apiHeaders('/api/vapid-public'),
    });
    if (!vapidRes.ok) return { ok: false, error: 'Push not configured' };
    const { publicKey } = (await vapidRes.json()) as { publicKey?: string };
    if (!publicKey) return { ok: false, error: 'No VAPID key' };
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const sub = subscription.toJSON();
    const token = await getAccessToken();
    const path = '/api/push-subscription';
    const url = apiPath(path) + (apiPath(path).includes('?') ? '&' : '?') + 'path=' + encodeURIComponent(path);
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...apiHeaders(path, token), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: sub.keys,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent?.slice(0, 500) : undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: (data as { error?: string }).error || 'Failed to save subscription' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Subscribe failed' };
  }
}

/** Remove push subscription from backend. */
export async function unsubscribePush(getAccessToken: () => Promise<string | null>): Promise<void> {
  const token = await getAccessToken();
  const path = '/api/push-subscription';
  const url = apiPath(path) + (apiPath(path).includes('?') ? '&' : '?') + 'path=' + encodeURIComponent(path);
  await fetch(url, {
    method: 'DELETE',
    headers: apiHeaders(path, token),
  });
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64.replace(/-/g, '+').replace(/_/g, '/') + padding);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePushSubscription() {
  const { getAccessToken } = useAuth();
  const [subscribing, setSubscribing] = useState(false);
  const subscribe = useCallback(async () => {
    setSubscribing(true);
    try {
      return await subscribePush(getAccessToken);
    } finally {
      setSubscribing(false);
    }
  }, [getAccessToken]);
  const unsubscribe = useCallback(async () => {
    await unsubscribePush(getAccessToken);
  }, [getAccessToken]);
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
  return { subscribe, unsubscribe, subscribing, isSupported };
}
