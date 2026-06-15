import { createClient } from "@/lib/supabase/server";
import type { Attachment, Item, ItemKind, Template, TemplateStep } from "@/lib/types";

// Server-side data fetchers. RLS scopes everything to the signed-in user.

export async function getIntake(): Promise<Item[]> {
  const supabase = createClient();
  const nowIso = new Date().toISOString();
  // Intake = freshly captured items, plus anything whose resurface date has
  // arrived (it's time to reprocess it).
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .or(`status.eq.intake,and(resurface_date.lte.${nowIso},status.not.in.(done,archived))`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getIntakeCount(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("status", "intake");
  return count ?? 0;
}

export async function listByKind(kind: ItemKind): Promise<Item[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("kind", kind)
    .neq("status", "intake")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getItem(id: string): Promise<{
  item: Item | null;
  attachments: Attachment[];
  children: Item[];
}> {
  const supabase = createClient();
  const [{ data: item }, { data: attachments }, { data: children }] = await Promise.all([
    supabase.from("items").select("*").eq("id", id).maybeSingle(),
    supabase.from("attachments").select("*").eq("item_id", id).order("sort_order"),
    supabase.from("items").select("*").eq("parent_id", id).order("created_at"),
  ]);
  return { item: item ?? null, attachments: attachments ?? [], children: children ?? [] };
}

export async function listOutcomesForPicker(): Promise<Pick<Item, "id" | "title">[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("items")
    .select("id,title")
    .eq("kind", "outcome")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function listTemplates(): Promise<(Template & { steps: TemplateStep[] })[]> {
  const supabase = createClient();
  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });
  if (!templates?.length) return [];
  const { data: steps } = await supabase
    .from("template_steps")
    .select("*")
    .in(
      "template_id",
      templates.map((t) => t.id)
    )
    .order("sort_order");
  return templates.map((t) => ({
    ...t,
    steps: (steps ?? []).filter((s) => s.template_id === t.id),
  }));
}

export async function dashboardCounts() {
  const supabase = createClient();
  const kinds: ItemKind[] = ["next_step", "outcome", "thought", "resource"];
  const entries = await Promise.all(
    kinds.map(async (k) => {
      const { count } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("kind", k)
        .neq("status", "intake")
        .neq("status", "archived");
      return [k, count ?? 0] as const;
    })
  );
  return Object.fromEntries(entries) as Record<ItemKind, number>;
}
