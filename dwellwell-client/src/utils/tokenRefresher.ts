// dwellwell-client/src/utils/tokenRefresher.ts
// Proactive refresh 5 minutes before access-token expiry; reschedules on visibility.
// Stops immediately if refresh is unauthorized or cookie disappears.

const baseURL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');

let timer: number | null = null;
const bc = new BroadcastChannel('dwellwell-auth'); // keep tokens in sync across tabs

function getToken(): string | null {
  try { return localStorage.getItem('dwellwell-token'); } catch { return null; }
}
function setToken(token: string) {
  try { localStorage.setItem('dwellwell-token', token); } catch { /* ignore */ }
}
function clearToken() {
  try { localStorage.removeItem('dwellwell-token'); } catch { /* ignore */ }
}

function hasRefreshHintCookie(): boolean {
  return document.cookie.split('; ').some((c) => c.startsWith('dw_has_refresh='));
}

function decodeExp(token: string | null): number | null {
  if (!token) return null;
  try {
    const [, payloadB64] = token.split('.');
    const payloadJson = JSON.parse(atob(payloadB64));
    return typeof payloadJson.exp === 'number' ? payloadJson.exp : null;
  } catch {
    return null;
  }
}

async function refreshOnce(): Promise<string | null> {
  // If the hint cookie isn't present, don't even try.
  if (!hasRefreshHintCookie()) return null;

  try {
    const resp = await fetch(`${baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: '{}',
    });

    if (resp.status === 401) {
      // Stop the refresher and propagate logout to other tabs
      stopTokenRefresher();
      clearToken();
      bc.postMessage({ type: 'LOGOUT' });
      return null;
    }

    if (!resp.ok) {
      // Non-401 error: just skip this tick; we'll try again on next schedule
      return null;
    }

    const data = await resp.json();
    const t = data?.accessToken || null;
    if (t) {
      setToken(t);
      bc.postMessage({ type: 'NEW_ACCESS_TOKEN', token: t });
    }
    return t;
  } catch {
    // Network or other failure — don't spin; let schedule handle later
    return null;
  }
}

function schedule() {
  if (timer) window.clearTimeout(timer);

  const token = getToken();
  const exp = decodeExp(token);
  if (!token || !exp) {
    // No token yet (or unreadable) — try again in a minute if cookie exists
    timer = window.setTimeout(() => {
      if (document.visibilityState === 'visible' && hasRefreshHintCookie()) {
        refreshOnce();
      }
      schedule();
    }, 60_000);
    return;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const secondsLeft = exp - nowSec;

  // Refresh 5 minutes before expiry; but never sooner than 30s from now
  const delayMs = Math.max((secondsLeft - 5 * 60) * 1000, 30_000);

  timer = window.setTimeout(async () => {
    if (document.visibilityState === 'visible' && hasRefreshHintCookie()) {
      await refreshOnce();
    }
    schedule();
  }, delayMs);
}

export function startTokenRefresher() {
  stopTokenRefresher();
  document.addEventListener('visibilitychange', onVis);
  schedule();
}
export function stopTokenRefresher() {
  if (timer) window.clearTimeout(timer);
  timer = null;
  document.removeEventListener('visibilitychange', onVis);
}
export function rescheduleTokenRefresher() {
  schedule();
}

function onVis() {
  if (document.visibilityState === 'visible') schedule();
}
