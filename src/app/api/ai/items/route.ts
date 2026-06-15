import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, ownerId } from "@/lib/supabase/admin";
import { checkAiKey } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ai/items?kind=&status=&limit= — browse the owner's items.
export async function GET(request: Request) {
  const unauthorized = checkAiKey(request);
  if (unauthorized) return unauthorized;

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 200);

  const supabase = createAdminClient();
  let q = supabase
    .from("items")
    .select("*")
    .eq("owner_id", ownerId())
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (kind) q = q.eq("kind", kind);
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

const CreateBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  body: z.string().optional(),
  kind: z.enum(["next_step", "outcome", "thought", "resource"]).optional(),
});

// POST /api/ai/items — let an AI capture a new item straight into Intake.
export async function POST(request: Request) {
  const unauthorized = checkAiKey(request);
  if (unauthorized) return unauthorized;

  const parsed = CreateBody.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("items")
    .insert({
      owner_id: ownerId(),
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      body: parsed.data.body ?? null,
      kind: parsed.data.kind ?? null,
      status: "intake",
      source: "ai",
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
