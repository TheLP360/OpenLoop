import { NextResponse } from "next/server";

// Shared-secret guard for the AI API. Send the key in `x-openloop-key`
// (or `Authorization: Bearer <key>`).
export function checkAiKey(request: Request): NextResponse | null {
  const expected = process.env.AI_SEARCH_API_KEY;
  if (!expected) {
    return NextResponse.json({ error: "AI API not configured" }, { status: 503 });
  }
  const header =
    request.headers.get("x-openloop-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  if (header !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
