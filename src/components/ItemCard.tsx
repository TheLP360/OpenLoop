import Link from "next/link";
import type { Item } from "@/lib/types";
import { KindBadge, PriorityBadge, StatusBadge } from "./Badges";
import { Icon } from "./Icon";
import { cn, formatDate } from "@/lib/utils";

export function ItemCard({
  item,
  href,
  showKind = true,
}: {
  item: Item;
  href?: string;
  showKind?: boolean;
}) {
  const link = href ?? `/item/${item.id}`;
  const done = item.status === "done" || item.status === "archived";
  return (
    <Link
      href={link}
      className="card block px-4 py-3 transition hover:border-loop-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={cn("font-medium leading-snug", done && "text-slate-400 line-through")}>
          {item.title || "Untitled"}
        </h3>
        {item.priority !== "none" && <PriorityBadge priority={item.priority} />}
      </div>

      {item.description && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
          {item.description}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {showKind && <KindBadge kind={item.kind} />}
        <StatusBadge status={item.status} />
        {item.due_date && (
          <span className="chip bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
            <Icon name="Calendar" className="h-3 w-3" />
            {formatDate(item.due_date)}
          </span>
        )}
        {item.recurrence_rule && (
          <span className="chip bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Icon name="Repeat" className="h-3 w-3" />
            Repeats
          </span>
        )}
        {item.tags.slice(0, 3).map((t) => (
          <span key={t} className="chip bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            #{t}
          </span>
        ))}
      </div>
    </Link>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="rounded-2xl bg-slate-100 p-3 text-slate-400 dark:bg-slate-800">
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <p className="font-medium">{title}</p>
      {hint && <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
