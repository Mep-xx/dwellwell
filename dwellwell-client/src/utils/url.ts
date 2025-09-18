// dwellwell-client/src/utils/url.ts

// Safely derive the API origin whether axios baseURL is absolute ("https://x/api")
// or relative ("/api"). Falls back to window.origin.
import { api } from "@/utils/api";

export function getApiOrigin(): string {
  const base = api.defaults.baseURL || "";
  try {
    // If base is relative, this resolves it against the page origin.
    return new URL(base, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}
