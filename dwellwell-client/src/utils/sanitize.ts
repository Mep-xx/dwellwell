//dwellwell-client/src/utils/sanitize.ts

/**
 * Basic sanitization to prevent unwanted characters or potential injection.
 * For more advanced scenarios, consider libraries like DOMPurify for HTML contexts.
 */
export const sanitize = (input?: string): string => {
    return (input || '')
        .replace(/[<>]/g, '')
        .replace(/["']/g, '')
        .replace(/[\\;]/g, '')
        .trim();
  };
  