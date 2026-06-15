"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { Item } from "@/lib/types";
import {
  ENERGY_ORDER,
  ENERGY_META,
  KINDS,
  KIND_ORDER,
  PRIORITY_ORDER,
  PRIORITY_META,
  STATUS_META,
  STATUS_ORDER,
} from "@/lib/constants";
import { deleteItem, updateItem } from "@/app/actions";
import { toDateTimeLocal } from "@/lib/utils";
import { Icon } from "./Icon";
import { RecurrencePicker } from "./RecurrencePicker";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary flex-1" disabled={pending}>
      <Icon name="Check" className="h-4 w-4" />
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export function ItemForm({
  item,
  outcomes,
}: {
  item: Item;
  outcomes: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState(item.kind ?? "");
  const updateAction = updateItem.bind(null, item.id);
  const deleteAction = deleteItem.bind(null, item.id);

  const isThought = kind === "thought";
  const isResource = kind === "resource";
  const isNextStep = kind === "next_step";

  return (
    <div className="space-y-4">
      <form action={updateAction} className="space-y-4">
        {/* Type selector — assign during intake processing */}
        <div>
          <label className="label">Type</label>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            <TypeRadio name="kind" value="" label="Unsorted" icon="Inbox" checked={kind === ""} onChange={setKind} />
            {KIND_ORDER.map((k) => (
              <TypeRadio
                key={k}
                name="kind"
                value={k}
                label={KINDS[k].label}
                icon={KINDS[k].icon}
                checked={kind === k}
                onChange={setKind}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="label">Title</label>
          <input name="title" className="input" defaultValue={item.title} placeholder="Title" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea name="description" className="input min-h-[64px]" defaultValue={item.description ?? ""} />
        </div>

        {/* Long-form content — primary for thoughts */}
        <div>
          <label className="label">{isThought ? "Writing" : "Notes"}</label>
          <textarea
            name="body"
            className="input min-h-[140px] font-[inherit] leading-relaxed"
            defaultValue={item.body ?? ""}
            placeholder={isThought ? "Start writing…" : "Additional notes (markdown ok)"}
          />
        </div>

        {isResource && (
          <div>
            <label className="label">Primary link</label>
            <input name="url" className="input" defaultValue={item.url ?? ""} placeholder="https://…" />
          </div>
        )}

        {isNextStep && outcomes.length > 0 && (
          <div>
            <label className="label">Part of outcome</label>
            <select name="parent_id" className="input" defaultValue={item.parent_id ?? ""}>
              <option value="">— None —</option>
              {outcomes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title || "Untitled"}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Status</label>
            <select name="status" className="input" defaultValue={item.status}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select name="priority" className="input" defaultValue={item.priority}>
              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Energy</label>
            <select name="energy" className="input" defaultValue={item.energy ?? ""}>
              <option value="">—</option>
              {ENERGY_ORDER.map((e) => (
                <option key={e} value={e}>
                  {ENERGY_META[e].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tags</label>
            <input name="tags" className="input" defaultValue={item.tags.join(", ")} placeholder="comma, separated" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Due date</label>
            <input type="datetime-local" name="due_date" className="input" defaultValue={toDateTimeLocal(item.due_date)} />
          </div>
          <div>
            <label className="label">Scheduled</label>
            <input type="datetime-local" name="scheduled_date" className="input" defaultValue={toDateTimeLocal(item.scheduled_date)} />
          </div>
          <div className="col-span-2">
            <label className="label">Resurface date (reappears in Intake)</label>
            <input type="datetime-local" name="resurface_date" className="input" defaultValue={toDateTimeLocal(item.resurface_date)} />
          </div>
        </div>

        {(isNextStep || kind === "outcome") && (
          <RecurrencePicker defaultValue={item.recurrence_rule} />
        )}

        <div className="flex gap-2 pt-1">
          <SubmitButton />
        </div>
      </form>

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm("Delete this item permanently?")) e.preventDefault();
        }}
      >
        <button type="submit" className="btn-ghost w-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10">
          <Icon name="Trash2" className="h-4 w-4" />
          Delete
        </button>
      </form>
    </div>
  );
}

function TypeRadio({
  name,
  value,
  label,
  icon,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  icon: string;
  checked: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label
      className={
        "chip shrink-0 cursor-pointer border px-3 py-1.5 " +
        (checked
          ? "border-loop-500 bg-loop-50 text-loop-700 dark:bg-loop-500/15 dark:text-loop-300"
          : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400")
      }
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="hidden"
      />
      <Icon name={icon} className="h-3.5 w-3.5" />
      {label}
    </label>
  );
}
