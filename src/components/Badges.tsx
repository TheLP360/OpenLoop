import {
  ENERGY_META,
  KINDS,
  PRIORITY_META,
  STATUS_META,
} from "@/lib/constants";
import type { EnergyLevel, ItemKind, ItemStatus, PriorityLevel } from "@/lib/types";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

export function KindBadge({ kind }: { kind: ItemKind | null }) {
  if (!kind) {
    return <span className="chip bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200">Unsorted</span>;
  }
  const meta = KINDS[kind];
  return (
    <span className={cn("chip", meta.accent)}>
      <Icon name={meta.icon} className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  const meta = STATUS_META[status];
  return <span className={cn("chip", meta.accent)}>{meta.label}</span>;
}

export function EnergyBadge({ energy }: { energy: EnergyLevel | null }) {
  if (!energy) return null;
  const meta = ENERGY_META[energy];
  return <span className={cn("chip", meta.accent)}>{meta.label}</span>;
}

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  if (priority === "none") return null;
  const meta = PRIORITY_META[priority];
  return <span className={cn("chip", meta.accent)}>{meta.label}</span>;
}
