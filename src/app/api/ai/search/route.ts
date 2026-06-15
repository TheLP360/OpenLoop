import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, ownerId } from "@/lib/supabase/admin";
import { checkAiKey } from "@/lib/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  query: z.string().default(""),
  kind: z.enum(["next_step", "outcome", "thought", "resource"]).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// POST /api/ai/search — ranked fuzzy search across all of the owner's items.
// Lets an AI assistant query your OpenLoop knowledge base.
export async function POST(request: Request) {
  const unauthorized = checkAiKey(request);
  if (unauthorized) return unauthorized;

  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { query, kind, limit } = parsed.data;
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("search_items", {
    p_owner: ownerId(),
    p_query: query,
    p_kind: kind ?? null,
    p_limit: limit ?? 25,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ results: data ?? [] });
}
