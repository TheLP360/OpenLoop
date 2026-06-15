"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Item } from "@/lib/types";
import { addChildNextStep, setStatus } from "@/app/actions";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

// Inline Next Steps list for an Outcome, with quick add + check-off.
export function OutcomeChildren({ parentId, initial }: { parentId: string; initial: Item[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function add() {
    if (!draft.trim()) return;
    await addChildNextStep(parentId, draft);
    setDraft("");
    inputRef.current?.focus();
    router.refresh();
  }

  async function toggle(step: Item) {
    await setStatus(step.id, step.status === "done" ? "next" : "done");
    router.refresh();
  }

  return (
    <div className="card px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Icon name="ListChecks" className="h-4 w-4 text-loop-600" />
        <h2 className="font-semibold">Next Steps</h2>
        <span className="ml-auto text-xs text-slate-400">
          {initial.filter((s) => s.status === "done").length}/{initial.length}
        </span>
      </div>

      <ul className="space-y-1">
        {initial.map((step) => {
          const done = step.status === "done";
          return (
            <li key={step.id} className="flex items-center gap-2 py-1">
              <button onClick={() => toggle(step)} aria-label="Toggle done">
                <Icon
                  name={done ? "CheckCircle2" : "Circle"}
                  className={cn("h-5 w-5", done ? "text-emerald-500" : "text-slate-300")}
                />
              </button>
              <Link
                href={`/item/${step.id}`}
                className={cn("flex-1 truncate text-sm hover:underline", done && "text-slate-400 line-through")}
              >
                {step.title}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex gap-2">
        <input
          ref={inputRef}
          className="input"
          placeholder="Add a next step…"
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
