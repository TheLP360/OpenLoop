import { NextResponse } from "next/server";
import { createAdminClient, ownerId } from "@/lib/supabase/admin";
import { sendToOwner } from "@/lib/push";
import { KINDS } from "@/lib/constants";
import type { Item } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return auth === secret;
}

function label(item: Item): string {
  return item.kind ? KINDS[item.kind].label : "Item";
}

// POST /api/cron/notify — scan for due / resurfaced items and push them.
// Triggered by Supabase pg_cron (see supabase/cron_notify.sql). Idempotent:
// each item fires at most once per due/resurface via the *_notified_at stamps.
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const owner = ownerId();
  const now = new Date().toISOString();
  let due = 0;
  let resurfaced = 0;

  // Due items.
  const { data: dueItems } = await supabase
    .from("items")
    .select("*")
    .eq("owner_id", owner)
    .lte("due_date", now)
    .is("due_notified_at", null)
    .not("status", "in", "(done,archived)");

  for (const item of (dueItems as Item[]) ?? []) {
    await sendToOwner(owner, {
      title: `Due: ${label(item)}`,
      body: item.title || "Untitled",
      url: `/item/${item.id}`,
      tag: `due-${item.id}`,
    });
    await supabase.from("items").update({ due_notified_at: now }).eq("id", item.id);
    due++;
  }

  // Resurfaced items (resurface date arrived).
  const { data: resurfacedItems } = await supabase
    .from("items")
    .select("*")
    .eq("owner_id", owner)
    .lte("resurface_date", now)
    .is("resurface_notified_at", null)
    .not("status", "in", "(done,archived)");

  for (const item of (resurfacedItems as Item[]) ?? []) {
    await sendToOwner(owner, {
      title: "Resurfaced for review",
      body: item.title || "Untitled",
      url: `/intake`,
      tag: `resurface-${item.id}`,
    });
    await supabase.from("items").update({ resurface_notified_at: now }).eq("id", item.id);
    resurfaced++;
  }

  return NextResponse.json({ ok: true, due, resurfaced });
}
