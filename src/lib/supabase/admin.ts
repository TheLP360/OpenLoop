import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for trusted server routes only (Telegram webhook, AI
// search). Bypasses RLS, so it must NEVER be imported into client code and
// every query must be scoped to OPENLOOP_OWNER_ID.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function ownerId(): string {
  const id = process.env.OPENLOOP_OWNER_ID;
  if (!id) throw new Error("OPENLOOP_OWNER_ID is not set.");
  return id;
}
