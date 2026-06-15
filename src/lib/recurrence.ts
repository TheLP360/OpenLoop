// Lightweight recurrence engine for OpenLoop.
//
// We persist a compact, RRULE-flavored string in items.recurrence_rule, e.g.
//   FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE
//   FREQ=YEARLY;INTERVAL=1
// and compute the next occurrence in app code (no heavy dependency). This
// covers the common cases people actually schedule: daily/weekly/monthly/yearly
// with an interval, and weekly-by-weekday.

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface RecurrenceRule {
  freq: Frequency;
  interval: number; // >= 1
  byday: number[]; // JS weekday indices 0=Sun..6=Sat (WEEKLY only)
}

const WEEKDAY_TOKENS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseRule(rule?: string | null): RecurrenceRule | null {
  if (!rule) return null;
  const parts = Object.fromEntries(
    rule
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const [k, v] = p.split("=");
        return [k.toUpperCase(), (v ?? "").toUpperCase()];
      })
  );
  const freq = parts.FREQ as Frequency;
  if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) return null;
  const interval = Math.max(1, parseInt(parts.INTERVAL ?? "1", 10) || 1);
  const byday = (parts.BYDAY ?? "")
    .split(",")
    .map((t) => WEEKDAY_TOKENS.indexOf(t.trim() as (typeof WEEKDAY_TOKENS)[number]))
    .filter((i) => i >= 0);
  return { freq, interval, byday };
}

export function buildRule(rule: RecurrenceRule): string {
  const segs = [`FREQ=${rule.freq}`, `INTERVAL=${Math.max(1, rule.interval)}`];
  if (rule.freq === "WEEKLY" && rule.byday.length) {
    segs.push(`BYDAY=${rule.byday.map((d) => WEEKDAY_TOKENS[d]).join(",")}`);
  }
  return segs.join(";");
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

/** The first occurrence strictly after `from`, or null if the rule is invalid. */
export function nextDate(rule: string | null | undefined, from: Date): Date | null {
  const parsed = parseRule(rule);
  if (!parsed) return null;
  const { freq, interval, byday } = parsed;

  if (freq === "DAILY") return addDays(from, interval);

  if (freq === "WEEKLY") {
    if (byday.length === 0) return addDays(from, interval * 7);
    const anchorWeek = startOfWeek(from).getTime();
    for (let i = 1; i <= 366; i++) {
      const cand = addDays(from, i);
      const weeksSince = Math.round((startOfWeek(cand).getTime() - anchorWeek) / (7 * 86400000));
      if (byday.includes(cand.getDay()) && weeksSince % interval === 0) return cand;
    }
    return null;
  }

  if (freq === "MONTHLY") {
    const r = new Date(from);
    const day = r.getDate();
    r.setDate(1); // avoid month-overflow when adding
    r.setMonth(r.getMonth() + interval);
    const daysInMonth = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
    r.setDate(Math.min(day, daysInMonth));
    return r;
  }

  // YEARLY
  const r = new Date(from);
  r.setFullYear(r.getFullYear() + interval);
  return r;
}

/** Human-readable summary, e.g. "Every 2 weeks on Mon, Wed". */
export function humanize(rule?: string | null): string {
  const parsed = parseRule(rule);
  if (!parsed) return "";
  const { freq, interval, byday } = parsed;
  const unit = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" }[freq];
  const every = interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`;
  if (freq === "WEEKLY" && byday.length) {
    return `${every} on ${byday.map((d) => WEEKDAY_LABELS[d]).join(", ")}`;
  }
  return every;
}

export { WEEKDAY_TOKENS, WEEKDAY_LABELS };
