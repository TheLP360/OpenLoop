"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import type { TemplateStep } from "@/lib/types";
import {
  addTemplateStep,
  deleteTemplateStep,
  updateTemplateStep,
} from "@/app/actions";
import { ENERGY_META, ENERGY_ORDER, PRIORITY_META, PRIORITY_ORDER } from "@/lib/constants";
import { Icon } from "./Icon";

function SaveStep() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-ghost px-2 py-1 text-xs text-loop-600" disabled={pending}>
      {pending ? "…" : "Save"}
    </button>
  );
}

// Manage the pre-assigned Next Steps of an Outcome template.
export function TemplateStepsEditor({
  templateId,
  steps,
}: {
  templateId: string;
  steps: TemplateStep[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function add() {
    if (!draft.trim()) return;
    await addTemplateStep(templateId, draft);
    setDraft("");
    inputRef.current?.focus();
    router.refresh();
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="ListChecks" className="h-4 w-4 text-loop-600" />
        <h2 className="font-semibold">Pre-assigned Next Steps</h2>
        <span className="ml-auto text-xs text-slate-400">{steps.length}</span>
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="rounded-xl border border-slate-200 p-2 dark:border-slate-700">
            <form action={updateTemplateStep.bind(null, step.id, templateId)} className="space-y-2">
              <input name="title" className="input" defaultValue={step.title} />
              <div className="flex flex-wrap items-center gap-2">
                <select name="energy" className="input flex-1" defaultValue={step.energy ?? ""}>
                  <option value="">Energy —</option>
                  {ENERGY_ORDER.map((e) => (
                    <option key={e} value={e}>
                      {ENERGY_META[e].label}
                    </option>
                  ))}
                </select>
                <select name="priority" className="input flex-1" defaultValue={step.priority}>
                  {PRIORITY_ORDER.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </option>
                  ))}
                </select>
                <SaveStep />
              </div>
            </form>
            <form
              action={async () => {
                await deleteTemplateStep(step.id, templateId);
                router.refresh();
              }}
            >
              <button type="submit" className="mt-1 text-xs text-rose-500 hover:underline">
                Remove
              </button>
            </form>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          className="input"
          placeholder="Add a step (e.g. Clean gutters)…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="btn-ghost px-3" onClick={add}>
          <Icon name="Plus" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
