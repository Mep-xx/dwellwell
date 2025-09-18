// dwellwell-client/src/utils/images.ts
import { getApiOrigin } from "@/utils/url";

/**
 * Robustly turn `home.imageUrl` into a browser-usable src.
 * - Accepts absolute URLs
 * - Allows app placeholders (/images/…)
 * - Serves /uploads from API origin in prod and as relative in dev (Vite proxy)
 * - Never throws "Invalid base URL"
 */
export function resolveHomeImageUrl(v?: string | null): string {
  const PLACEHOLDER = "/images/home_placeholder.png";
  if (!v) return PLACEHOLDER;

  const val = String(v).trim();
  if (!val) return PLACEHOLDER;

  // Absolute URL already
  if (/^https?:\/\//i.test(val)) return val;

  // App-provided placeholders
  if (val.startsWith("/images/")) return val;

  // Normalize: strip leading /api and leading slashes
  const trimmed = val.replace(/^\/?api\/?/, "").replace(/^\/+/, "");

  // In dev, Vite proxy makes `/uploads/...` work directly.
  if (import.meta.env.DEV && trimmed.startsWith("uploads/")) {
    return `/${trimmed}`;
  }

  // Otherwise, prepend API origin safely (no new URL() on a relative base)
  let apiOrigin = "";
  try {
    apiOrigin = getApiOrigin();
  } catch {
    apiOrigin = window.location.origin;
  }
  return `${apiOrigin}/${trimmed}`;
}
