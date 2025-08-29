// dwellwell-api/src/config/cookies.ts
export const COOKIE_SAMESITE: 'none' | 'lax' =
  ((process.env.COOKIE_SAMESITE as any) || 'none') as any;

export const COOKIE_SECURE = process.env.NODE_ENV === 'production';

export const REFRESH_COOKIE_PATH = '/api/auth';

export const REFRESH_MAX_AGE_MS =
  Number(process.env.REFRESH_MAX_AGE_MS ?? 1000 * 60 * 60 * 24 * 180); // 180d

// 👇 name for the non-HttpOnly hint cookie
export const REFRESH_HINT_COOKIE = 'dw_has_refresh';