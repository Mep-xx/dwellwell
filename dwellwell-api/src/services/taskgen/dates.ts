//dwellwell-api/src/services/taskgen/dates.ts
export function addByInterval(from: Date, recurrenceInterval: string): Date {
  const d = new Date(from);
  const r = (recurrenceInterval || "").toLowerCase();

  // Try to pull a number; default to 1 if none
  const n = parseInt(r.match(/\d+/)?.[0] ?? "1", 10);

  if (r.includes("day")) d.setDate(d.getDate() + n);
  else if (r.includes("week")) d.setDate(d.getDate() + 7 * n);
  else if (r.includes("month")) d.setMonth(d.getMonth() + n);
  else if (r.includes("quarter")) d.setMonth(d.getMonth() + 3 * n);
  else if (r.includes("year")) d.setFullYear(d.getFullYear() + n);
  else {
    // sane default: monthly
    d.setMonth(d.getMonth() + n);
  }
  return d;
}

export function initialDueDate(anchor?: Date | null, recurrenceInterval?: string): Date {
  const base = anchor && !isNaN(anchor.getTime()) ? anchor : new Date();
  return addByInterval(base, recurrenceInterval || "monthly");
}
