import { getIntake } from "@/lib/queries";
import { ItemCard, EmptyState } from "@/components/ItemCard";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const items = await getIntake();
  const now = Date.now();
  const resurfaced = items.filter(
    (i) => i.status !== "intake" && i.resurface_date && new Date(i.resurface_date).getTime() <= now
  );
  const fresh = items.filter((i) => i.status === "intake");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Icon name="Inbox" className="h-6 w-6 text-loop-600" />
        <h1 className="text-2xl font-bold tracking-tight">Intake</h1>
        <span className="ml-auto text-sm text-slate-400">{items.length}</span>
      </div>
      <p className="-mt-2 text-sm text-slate-500 dark:text-slate-400">
        Open an item to process it — assign a type, energy, priority, dates, and more.
      </p>

      {items.length === 0 && (
        <EmptyState
          icon="CheckCheck"
          title="Inbox zero"
          hint="Captured items land here. Tap the + button anywhere to add something."
        />
      )}

      {fresh.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            To process ({fresh.length})
          </h2>
          {fresh.map((it) => (
            <ItemCard key={it.id} item={it} href={`/item/${it.id}?from=intake`} />
          ))}
        </section>
      )}

      {resurfaced.length > 0 && (
        <section className="space-y-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-amber-500">
            Resurfaced ({resurfaced.length})
          </h2>
          {resurfaced.map((it) => (
            <ItemCard key={it.id} item={it} href={`/item/${it.id}?from=intake`} />
          ))}
        </section>
      )}
    </div>
  );
}
