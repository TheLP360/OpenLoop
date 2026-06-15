"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "./Icon";

export function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return (
    <button onClick={signOut} className="btn-ghost w-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
      <Icon name="LogOut" className="h-4 w-4" />
      Sign out
    </button>
  );
}
