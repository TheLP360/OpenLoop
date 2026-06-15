"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: "Home" },
  { href: "/intake", label: "Intake", icon: "Inbox", badgeKey: true },
  { href: "/next-steps", label: "Next", icon: "CircleCheck" },
  { href: "/outcomes", label: "Outcomes", icon: "Target" },
  { href: "/thoughts", label: "Thoughts", icon: "PenLine" },
];

export function BottomNav({ intakeCount }: { intakeCount: number }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-ink/90">
      <div
        className="mx-auto flex max-w-2xl items-stretch justify-around px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition",
                active ? "text-loop-600 dark:text-loop-300" : "text-slate-400 dark:text-slate-500"
              )}
            >
              <Icon name={item.icon} className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
              {item.label}
              {item.badgeKey && intakeCount > 0 && (
                <span className="absolute right-3 top-1 rounded-full bg-loop-600 px-1.5 text-[9px] font-bold text-white">
                  {intakeCount > 99 ? "99+" : intakeCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
