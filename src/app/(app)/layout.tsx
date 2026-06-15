import { Suspense } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import { QuickCapture } from "@/components/QuickCapture";
import { Icon } from "@/components/Icon";
import { getIntakeCount } from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const intakeCount = await getIntakeCount();

  return (
    <div className="mx-auto min-h-screen max-w-2xl pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-ink/80">
        <Link href="/" className="flex items-center gap-2">
          <img src="/icons/icon.svg" alt="" className="h-7 w-7 rounded-lg" />
          <span className="text-lg font-semibold tracking-tight">OpenLoop</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/search" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Search">
            <Icon name="Search" className="h-5 w-5" />
          </Link>
          <Link href="/templates" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Templates">
            <Icon name="LayoutTemplate" className="h-5 w-5" />
          </Link>
          <Link href="/settings" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Settings">
            <Icon name="Settings" className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="px-4 py-5">{children}</main>

      <Suspense>
        <QuickCapture />
      </Suspense>
      <BottomNav intakeCount={intakeCount} />
    </div>
  );
}
