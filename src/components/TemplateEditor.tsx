"use client";

import { useFormStatus } from "react-dom";
import type { Template, TemplateStep } from "@/lib/types";
import { deleteTemplate, updateTemplate } from "@/app/actions";
import { TemplateStepsEditor } from "./TemplateStepsEditor";
import { Icon } from "./Icon";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary flex-1" disabled={pending}>
      <Icon name="Check" className="h-4 w-4" />
      {pending ? "Saving…" : "Save template"}
    </button>
  );
}

export function TemplateEditor({
  template,
}: {
  template: Template & { steps: TemplateStep[] };
}) {
  const isOutcome = template.kind === "outcome";
  const save = updateTemplate.bind(null, template.id);
  const remove = deleteTemplate.bind(null, template.id);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <form action={save} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input name="name" className="input" defaultValue={template.name} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input min-h-[60px]" defaultValue={template.description ?? ""} />
          </div>

          {!isOutcome && (
            <div>
              <label className="label">Writing prompt</label>
              <textarea
                name="prompt"
                className="input min-h-[160px] leading-relaxed"
                defaultValue={template.prompt ?? ""}
                placeholder="The scaffold a new Thought starts with. Markdown ok."
              />
            </div>
          )}

          <div>
            <label className="label">Default tags</label>
            <input
              name="default_tags"
              className="input"
              defaultValue={template.default_tags.join(", ")}
              placeholder="comma, separated"
            />
          </div>

          <div className="flex gap-2">
            <SaveButton />
          </div>
        </form>
      </div>

      {isOutcome && <TemplateStepsEditor templateId={template.id} steps={template.steps} />}

      <form
        action={remove}
        onSubmit={(e) => {
          if (!confirm("Delete this template?")) e.preventDefault();
        }}
      >
        <button type="submit" className="btn-ghost w-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
          <Icon name="Trash2" className="h-4 w-4" />
          Delete template
        </button>
      </form>
    </div>
  );
}
