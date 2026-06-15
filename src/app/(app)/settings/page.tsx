import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { NotificationToggle } from "@/components/NotificationToggle";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Icon name="Settings" className="h-6 w-6 text-loop-600" />
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="card space-y-3 p-4">
        <div>
          <p className="label">Signed in as</p>
          <p className="text-sm">{user?.email}</p>
        </div>
        <div>
          <p className="label">Your user id (set as OPENLOOP_OWNER_ID & in seed.sql)</p>
          <code className="block break-all rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
            {user?.id}
          </code>
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <div>
          <p className="font-medium">Notifications</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Get a push when an item is due or resurfaces. Enable per device.
          </p>
        </div>
        <NotificationToggle />
      </div>

      <div className="card space-y-2 p-4 text-sm text-slate-500 dark:text-slate-400">
        <p className="font-medium text-ink dark:text-slate-200">Integrations</p>
        <p>• AI search: <code>POST /api/ai/search</code> with header <code>x-openloop-key</code>.</p>
        <p>• Telegram capture: point your bot webhook at <code>/api/telegram/webhook</code>.</p>
        <p>See the README for setup details.</p>
      </div>

      <SignOutButton />
    </div>
  );
}
