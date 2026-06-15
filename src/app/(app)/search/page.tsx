"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Item } from "@/lib/types";
import { ItemCard } from "@/components/ItemCard";
import { Icon } from "@/components/Icon";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const pattern = `%${term}%`;
      const { data } = await supabase
        .from("items")
        .select("*")
        .or(`title.ilike.${pattern},description.ilike.${pattern},body.ilike.${pattern}`)
        .order("updated_at", { ascending: false })
        .limit(50);
      setResults((data as Item[]) ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon name="Search" className="h-6 w-6 text-loop-600" />
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
      </div>

      <div className="relative">
        <Icon name="Search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          className="input pl-9"
          placeholder="Search everything…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading && <p className="text-sm text-slate-400">Searching…</p>}
      <div className="space-y-2">
        {results.map((it) => (
          <ItemCard key={it.id} item={it} />
        ))}
      </div>
      {!loading && q.trim() && results.length === 0 && (
        <p className="text-sm text-slate-400">No matches.</p>
      )}
    </div>
  );
}
