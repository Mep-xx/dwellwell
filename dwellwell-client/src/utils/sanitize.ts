// dwellwell-client/src/utils/sanitize.ts

/**
 * Basic sanitization to prevent unwanted characters or potential injection.
 * Preserves whitespace/newlines; strips obvious dangerous characters.
 */
export const sanitize = (input?: string): string => {
  return (input || "")
    .replace(/[<>]/g, "")
    .replace(/["']/g, "")
    .replace(/[\\;]/g, "")
    .trim();
};
