import type {
  EnergyLevel,
  ItemKind,
  ItemStatus,
  PriorityLevel,
} from "./types";

// ── Vocabulary ────────────────────────────────────────────────────────────────
// OpenLoop renames the classic PARA / GTD elements. The UI always uses these.

export interface KindMeta {
  kind: ItemKind;
  /** Singular label, e.g. "Next Step". */
  label: string;
  /** Plural label, e.g. "Next Steps". */
  plural: string;
  /** URL slug, e.g. "next-steps". */
  slug: string;
  /** lucide-react icon name. */
  icon: string;
  /** Tailwind accent classes for chips/badges. */
  accent: string;
  /** One-line description for empty states. */
  blurb: string;
}

export const KINDS: Record<ItemKind, KindMeta> = {
  next_step: {
    kind: "next_step",
    label: "Next Step",
    plural: "Next Steps",
    slug: "next-steps",
    icon: "CircleCheck",
    accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    blurb: "The single physical actions that move things forward.",
  },
  outcome: {
    kind: "outcome",
    label: "Outcome",
    plural: "Outcomes",
    slug: "outcomes",
    icon: "Target",
    accent: "bg-loop-100 text-loop-700 dark:bg-loop-500/15 dark:text-loop-300",
    blurb: "Multi-step results you're committed to — your projects.",
  },
  thought: {
    kind: "thought",
    label: "Thought",
    plural: "Thoughts",
    slug: "thoughts",
    icon: "PenLine",
    accent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    blurb: "Notes, journaling, and free writing.",
  },
  resource: {
    kind: "resource",
    label: "Resource",
    plural: "Resources",
    slug: "resources",
    icon: "Library",
    accent: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    blurb: "Reference material you want to keep at hand.",
  },
};

export const KIND_ORDER: ItemKind[] = ["next_step", "outcome", "thought", "resource"];

export const KIND_BY_SLUG: Record<string, ItemKind> = Object.fromEntries(
  KIND_ORDER.map((k) => [KINDS[k].slug, k])
) as Record<string, ItemKind>;

// ── Status ──────────────────────────────────────────────────────────────────

export const STATUS_META: Record<ItemStatus, { label: string; accent: string }> = {
  intake: { label: "Intake", accent: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
  next: { label: "Next", accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  active: { label: "Active", accent: "bg-loop-100 text-loop-700 dark:bg-loop-500/15 dark:text-loop-300" },
  waiting: { label: "Waiting", accent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  someday: { label: "Someday", accent: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  done: { label: "Done", accent: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  archived: { label: "Archived", accent: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

export const STATUS_ORDER: ItemStatus[] = [
  "intake",
  "next",
  "active",
  "waiting",
  "someday",
  "done",
  "archived",
];

// ── Energy & Priority ─────────────────────────────────────────────────────────

export const ENERGY_META: Record<EnergyLevel, { label: string; accent: string }> = {
  low: { label: "Low energy", accent: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" },
  medium: { label: "Medium energy", accent: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" },
  high: { label: "High energy", accent: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
};

export const PRIORITY_META: Record<PriorityLevel, { label: string; accent: string }> = {
  none: { label: "No priority", accent: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  low: { label: "Low", accent: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  medium: { label: "Medium", accent: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  high: { label: "High", accent: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300" },
  urgent: { label: "Urgent", accent: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
};

export const ENERGY_ORDER: EnergyLevel[] = ["low", "medium", "high"];
export const PRIORITY_ORDER: PriorityLevel[] = ["none", "low", "medium", "high", "urgent"];
