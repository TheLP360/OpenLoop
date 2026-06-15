"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Item } from "@/lib/types";
import { ItemCard } from "@/components/ItemCard";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfGrid(monthStart: Date) {
  const d = new Date(monthStart);
  d.setDate(1 - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });
  const [items, setItems] = useState<Item[]>([]);

  const gridStart = useMemo(() => startOfGrid(month), [month]);
  const days = useMemo(
    () => Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    }),
    [gridStart]
  );

  useEffect(() => {
    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridStart.getDate() + 42);
    const a = gridStart.toISOString();
    const b = gridEnd.toISOString();
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("items")
        .select("*")
        .or(
          `and(due_date.gte.${a},due_date.lt.${b}),and(scheduled_date.gte.${a},scheduled_date.lt.${b})`
        );
      setItems((data as Item[]) ?? []);
    })();
  }, [gridStart]);

  // Map day -> items landing on it (by due or scheduled date).
  const byDay = useMemo(() => {
    const map = new Map<string, Item[]>();
    const push = (d: string, it: Item) => {
      if (!map.has(d)) map.set(d, []);
      const arr = map.get(d)!;
      if (!arr.find((x) => x.id === it.id)) arr.push(it);
    };
    for (const it of items) {
      if (it.due_date) push(ymd(new Date(it.due_date)), it);
      if (it.scheduled_date) push(ymd(new Date(it.scheduled_date)), it);
    }
    return map;
  }, [items]);

  const todayKey = ymd(new Date());
  const selectedItems = byDay.get(ymd(selected)) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon name="Calendar" className="h-6 w-6 text-loop-600" />
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
      </div>

      <div className="card p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <button
            className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            <Icon name="ChevronLeft" className="h-5 w-5" />
          </button>
          <p className="font-semibold">
            {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <button
            className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            <Icon name="ChevronRight" className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[10px] font-medium uppercase text-slate-400">
          {WEEKDAYS.map((w, i) => (
            <div key={i} className="py-1">{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const key = ymd(d);
            const inMonth = d.getMonth() === month.getMonth();
            const count = byDay.get(key)?.length ?? 0;
            const isToday = key === todayKey;
            const isSelected = key === ymd(selected);
            return (
              <button
                key={key}
                onClick={() => setSelected(new Date(d))}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition",
                  !inMonth && "text-slate-300 dark:text-slate-600",
                  isSelected
                    ? "bg-loop-600 text-white"
                    : isToday
                      ? "bg-loop-50 text-loop-700 dark:bg-loop-500/15 dark:text-loop-300"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {d.getDate()}
                {count > 0 && (
                  <span
                    className={cn(
                      "mt-0.5 h-1.5 w-1.5 rounded-full",
                      isSelected ? "bg-white" : "bg-loop-500"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-2 px-1 text-sm font-semibold text-slate-500">
          {selected.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </h2>
        {selectedItems.length === 0 ? (
          <p className="px-1 text-sm text-slate-400">Nothing scheduled or due.</p>
        ) : (
          <div className="space-y-2">
            {selectedItems.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
