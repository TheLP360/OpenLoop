import Link from "next/link";
import { dashboardCounts, getIntakeCount } from "@/lib/queries";
import { KINDS, KIND_ORDER } from "@/lib/constants";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [counts, intakeCount] = await Promise.all([dashboardCounts(), getIntakeCount()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Today</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Close your open loops.</p>
      </div>

      {/* Intake call-to-action */}
      <Link
        href="/intake"
        className="card flex items-center gap-4 bg-loop-600 px-5 py-4 text-white shadow-fab hover:bg-loop-700"
      >
        <div className="rounded-2xl bg-white/20 p-3">
          <Icon name="Inbox" className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold">Intake</p>
          <p className="text-sm text-white/80">
            {intakeCount === 0
              ? "All clear — nothing to process."
              : `${intakeCount} item${intakeCount === 1 ? "" : "s"} to process.`}
          </p>
        </div>
        <Icon name="ChevronRight" className="h-5 w-5 text-white/80" />
      </Link>

      {/* The four elements */}
      <div className="grid grid-cols-2 gap-3">
        {KIND_ORDER.map((k) => {
          const meta = KINDS[k];
          return (
            <Link key={k} href={`/${meta.slug}`} className="card px-4 py-4 transition hover:shadow-md">
              <div className={cn("mb-3 inline-flex rounded-xl p-2", meta.accent)}>
                <Icon name={meta.icon} className="h-5 w-5" />
              </div>
              <p className="font-semibold">{meta.plural}</p>
              <p className="text-sm text-slate-400">{counts[k] ?? 0} active</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/templates" className="card flex items-center gap-3 px-4 py-3 hover:shadow-md">
          <Icon name="LayoutTemplate" className="h-5 w-5 text-loop-600" />
          <span className="font-medium">Templates</span>
        </Link>
        <Link href="/search" className="card flex items-center gap-3 px-4 py-3 hover:shadow-md">
          <Icon name="Search" className="h-5 w-5 text-loop-600" />
          <span className="font-medium">Search</span>
        </Link>
      </div>
    </div>
  );
}
