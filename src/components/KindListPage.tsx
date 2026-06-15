import { listByKind } from "@/lib/queries";
import { KINDS, STATUS_ORDER } from "@/lib/constants";
import type { Item, ItemKind, ItemStatus } from "@/lib/types";
import { ItemCard, EmptyState } from "./ItemCard";
import { Icon } from "./Icon";
import { STATUS_META } from "@/lib/constants";

// Shared list view for a single kind (Next Steps, Outcomes, Thoughts, Resources),
// grouped by workflow status.
export async function KindListPage({ kind }: { kind: ItemKind }) {
  const meta = KINDS[kind];
  const items = await listByKind(kind);

  const groups = new Map<ItemStatus, Item[]>();
  for (const it of items) {
    if (!groups.has(it.status)) groups.set(it.status, []);
    groups.get(it.status)!.push(it);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Icon name={meta.icon} className="h-6 w-6 text-loop-600" />
        <h1 className="text-2xl font-bold tracking-tight">{meta.plural}</h1>
        <span className="ml-auto text-sm text-slate-400">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={meta.icon} title={`No ${meta.plural.toLowerCase()} yet`} hint={meta.blurb} />
      ) : (
        STATUS_ORDER.filter((s) => groups.has(s)).map((status) => (
          <section key={status} className="space-y-2">
            <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {STATUS_META[status].label}
              <span className="ml-1 text-slate-300">({groups.get(status)!.length})</span>
            </h2>
            <div className="space-y-2">
              {groups.get(status)!.map((it) => (
                <ItemCard key={it.id} item={it} showKind={false} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
