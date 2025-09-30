// dwellwell-api/src/config/cookies.ts
// Env-aware cookie flags + keep cookie maxAge aligned with refresh JWT TTL.

const ENV = process.env.NODE_ENV || 'development';

// If API and SPA are same-site (same scheme+host), 'lax' is fine.
// If cross-site (different site), set COOKIE_SAMESITE=none and use HTTPS.
export const COOKIE_SAMESITE: 'lax' | 'strict' | 'none' =
  (process.env.COOKIE_SAMESITE as any) === 'strict'
    ? 'strict'
    : (process.env.COOKIE_SAMESITE as any) === 'none'
      ? 'none'
      : 'lax';

// Secure only when not http dev
export const COOKIE_SECURE =
  (process.env.COOKIE_SECURE ?? '').toString() !== ''
    ? String(process.env.COOKIE_SECURE).toLowerCase() === 'true'
    : ENV !== 'development' && ENV !== 'test';

// Cookie path must cover /auth/refresh
export const REFRESH_COOKIE_PATH = process.env.REFRESH_COOKIE_PATH || '/api/auth';

// ---------- TTL helpers ----------

// Parse "180d", "30d", "24h", "15m", "3600" (bare number = seconds)
function durationToMs(input: string): number {
  const s = input.trim().toLowerCase();
  if (/^\d+$/.test(s)) return Number(s) * 1000; // seconds → ms
  const match = s.match(/^(\d+)\s*(ms|s|m|h|d|w)$/);
  if (!match) throw new Error(`Invalid duration: ${input}`);
  const n = Number(match[1]);
  const unit = match[2];
  const factor: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  return n * factor[unit];
}

// Keep this env in sync with your refresh JWT TTL (utils/auth.ts)
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '180d';

// If REFRESH_MAX_AGE_MS is explicitly set, respect it; else derive from JWT TTL
const derivedMs = (() => {
  try { return durationToMs(REFRESH_TOKEN_TTL); }
  catch { return 180 * 24 * 60 * 60 * 1000; } // fallback 180d
})();
export const REFRESH_MAX_AGE_MS =
  process.env.REFRESH_MAX_AGE_MS ? Number(process.env.REFRESH_MAX_AGE_MS) : derivedMs;

// 👇 name for the non-HttpOnly hint cookie (client checks presence)
export const REFRESH_HINT_COOKIE = process.env.REFRESH_HINT_COOKIE || 'dw_has_refresh';
