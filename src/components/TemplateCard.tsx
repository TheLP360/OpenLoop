"use client";

import { useTransition } from "react";
import type { Template, TemplateStep } from "@/lib/types";
import { createOutcomeFromTemplate, createThoughtFromTemplate } from "@/app/actions";
import { Icon } from "./Icon";

export function TemplateCard({ template }: { template: Template & { steps: TemplateStep[] } }) {
  const [pending, start] = useTransition();
  const isOutcome = template.kind === "outcome";

  function use() {
    start(() => {
      if (isOutcome) createOutcomeFromTemplate(template.id);
      else createThoughtFromTemplate(template.id);
    });
  }

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-loop-50 p-2 text-loop-600 dark:bg-loop-500/15">
          <Icon name={isOutcome ? "Target" : "PenLine"} className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">{template.name}</h3>
          {template.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{template.description}</p>
          )}
        </div>
      </div>

      {isOutcome && template.steps.length > 0 && (
        <ul className="mt-3 space-y-1 pl-1">
          {template.steps.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Icon name="Circle" className="h-3.5 w-3.5 text-slate-300" />
              {s.title}
            </li>
          ))}
        </ul>
      )}

      {!isOutcome && template.prompt && (
        <pre className="mt-3 max-h-28 overflow-hidden whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
          {template.prompt}
        </pre>
      )}

      <button className="btn-primary mt-3 w-full" onClick={use} disabled={pending}>
        <Icon name="Plus" className="h-4 w-4" />
        {pending ? "Creating…" : isOutcome ? "Create outcome" : "Start writing"}
      </button>
    </div>
  );
}
