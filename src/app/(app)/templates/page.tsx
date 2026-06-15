import { listTemplates } from "@/lib/queries";
import { TemplateCard } from "@/components/TemplateCard";
import { EmptyState } from "@/components/ItemCard";
import { Icon } from "@/components/Icon";
import { createTemplate, createThoughtFromTemplate } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await listTemplates();
  const outcomes = templates.filter((t) => t.kind === "outcome");
  const thoughts = templates.filter((t) => t.kind === "thought");
  const blankThought = createThoughtFromTemplate.bind(null, null);
  const newOutcomeTpl = createTemplate.bind(null, "outcome");
  const newThoughtTpl = createTemplate.bind(null, "thought");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Icon name="LayoutTemplate" className="h-6 w-6 text-loop-600" />
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <form action={newOutcomeTpl}>
          <button className="btn-ghost w-full border border-dashed border-slate-300 dark:border-slate-700">
            <Icon name="Target" className="h-4 w-4" />
            New outcome
          </button>
        </form>
        <form action={newThoughtTpl}>
          <button className="btn-ghost w-full border border-dashed border-slate-300 dark:border-slate-700">
            <Icon name="PenLine" className="h-4 w-4" />
            New thought
          </button>
        </form>
      </div>

      {templates.length === 0 && (
        <EmptyState
          icon="LayoutTemplate"
          title="No templates yet"
          hint="Seed them with supabase/seed.sql, or add rows to the templates table. Outcome templates pre-load Next Steps; Thought templates start a writing prompt."
        />
      )}

      {outcomes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Outcome templates</h2>
          {outcomes.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Thought templates</h2>
        <form action={blankThought}>
          <button className="btn-ghost w-full border border-dashed border-slate-300 dark:border-slate-700">
            <Icon name="PenLine" className="h-4 w-4" />
            Start from scratch
          </button>
        </form>
        {thoughts.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </section>
    </div>
  );
}
