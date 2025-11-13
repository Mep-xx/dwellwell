// dwellwell-api/src/lib/recurrence.ts

export type IntervalUnit = "day" | "week" | "month" | "year";
export type RecurrenceRule = { unit: IntervalUnit; every: number };

const DAY = 24 * 60 * 60 * 1000;

function addMonths(base: Date, months: number) {
  const d = new Date(base.getTime());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0); // clamp to end-of-month
  return d;
}

export function addInterval(base: Date, rule: RecurrenceRule) {
  const { unit, every } = rule;
  if (unit === "day") return new Date(base.getTime() + every * DAY);
  if (unit === "week") return new Date(base.getTime() + every * 7 * DAY);
  if (unit === "month") return addMonths(base, every);
  if (unit === "year") {
    const d = new Date(base.getTime());
    d.setFullYear(d.getFullYear() + every);
    return d;
  }
  return base;
}

/**
 * Accepts strings like:
 *   "90 days", "30 day", "weekly", "2 weeks", "3 months", "monthly",
 *   "1 year", "yearly", "annual"
 * Fallback: 30 days when unknown.
 */
export function parseRecurrenceInterval(input: string | null | undefined): RecurrenceRule | null {
  if (!input) return null;
  const s = input.trim().toLowerCase();

  // common words
  if (s === "weekly") return { unit: "week", every: 1 };
  if (s === "monthly") return { unit: "month", every: 1 };
  if (s === "yearly" || s === "annual" || s === "annually") return { unit: "year", every: 1 };
  if (s === "daily") return { unit: "day", every: 1 };

  // numeric forms: "90 days", "2 weeks", "3 months", "1 year"
  const m = s.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)\b/);
  if (m) {
    const every = Math.max(1, parseInt(m[1], 10));
    const unitWord = m[2];
    if (unitWord.startsWith("day")) return { unit: "day", every };
    if (unitWord.startsWith("week")) return { unit: "week", every };
    if (unitWord.startsWith("month")) return { unit: "month", every };
    if (unitWord.startsWith("year")) return { unit: "year", every };
  }

  // last-ditch friendly words
  if (s.includes("week")) return { unit: "week", every: parseInt(s) || 1 };
  if (s.includes("month")) return { unit: "month", every: parseInt(s) || 1 };
  if (s.includes("year")) return { unit: "year", every: parseInt(s) || 1 };
  if (s.includes("day")) return { unit: "day", every: parseInt(s) || 30 };

  // Unknown → treat as 30 days so it never breaks
  return { unit: "day", every: 30 };
}

/**
 * Rolling schedule: next due is computed from completion time.
 * If no recognizable recurrence is present, returns null.
 */
export function nextDueOnComplete(recurrenceInterval: string | null | undefined, completedAt: Date): Date | null {
  const rule = parseRecurrenceInterval(recurrenceInterval);
  if (!rule) return null;
  return addInterval(completedAt, rule);
}

/** Move forward from a base date by the recurrence string. */
export function forwardFrom(base: Date, recurrenceInterval: string | null | undefined): Date {
  const rule = parseRecurrenceInterval(recurrenceInterval);
  if (!rule) return new Date(base.getTime() + 30 * DAY);
  return addInterval(base, rule);
}
