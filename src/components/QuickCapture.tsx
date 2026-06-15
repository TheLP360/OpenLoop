"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "./Icon";
import { KINDS, KIND_ORDER } from "@/lib/constants";
import type { ItemKind } from "@/lib/types";
import { quickCapture } from "@/app/actions";
import { uploadFileAttachment } from "@/lib/attachments";
import { cn } from "@/lib/utils";

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // PWA shortcut / deep link: /?capture=1 opens the sheet.
  useEffect(() => {
    if (searchParams.get("capture") === "1") setOpen(true);
  }, [searchParams]);

  return (
    <>
      <button
        aria-label="Quick capture"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-loop-600 text-white shadow-fab transition active:scale-95 hover:bg-loop-700"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <Icon name="Plus" className="h-7 w-7" />
      </button>
      {open && <CaptureSheet onClose={() => setOpen(false)} onSaved={() => router.refresh()} />}
    </>
  );
}

function CaptureSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<ItemKind | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [linkDraft, setLinkDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function addLink() {
    const v = linkDraft.trim();
    if (!v) return;
    setLinks((l) => [...l, v]);
    setLinkDraft("");
  }

  async function save() {
    if (!title.trim() && !description.trim()) return;
    setSaving(true);
    try {
      const { id } = await quickCapture({ title, description, kind, links });
      // Upload any picked files to the newly created item.
      for (const f of files) {
        try {
          await uploadFileAttachment(id, f);
        } catch {
          /* keep going; partial capture is better than none */
        }
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-slide-up rounded-t-3xl bg-white p-5 shadow-xl dark:bg-ink-soft sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quick Capture</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>

        {/* Optional type — leave unset to triage later in Intake. */}
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
          <TypePill label="Unsorted" active={kind === null} onClick={() => setKind(null)} icon="Inbox" />
          {KIND_ORDER.map((k) => (
            <TypePill
              key={k}
              label={KINDS[k].label}
              icon={KINDS[k].icon}
              active={kind === k}
              onClick={() => setKind(k)}
            />
          ))}
        </div>

        <input
          ref={titleRef}
          className="input mb-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="input mb-3 min-h-[72px] resize-none"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Links */}
        <div className="mb-3">
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Add a link / URL"
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
              }}
            />
            <button className="btn-ghost px-3" onClick={addLink} type="button">
              <Icon name="Link" className="h-4 w-4" />
            </button>
          </div>
          {links.length > 0 && (
            <ul className="mt-2 space-y-1">
              {links.map((l, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                  <span className="truncate">{l}</span>
                  <button onClick={() => setLinks((ls) => ls.filter((_, idx) => idx !== i))}>
                    <Icon name="X" className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Files / images */}
        <div className="mb-4">
          <label className="btn-ghost cursor-pointer border border-dashed border-slate-300 dark:border-slate-700">
            <Icon name="Paperclip" className="h-4 w-4" />
            Attach documents or images
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])}
            />
          </label>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">
                  <span className="truncate">{f.name}</span>
                  <button onClick={() => setFiles((fs) => fs.filter((_, idx) => idx !== i))}>
                    <Icon name="X" className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button className="btn-primary w-full" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Capture to Intake"}
        </button>
      </div>
    </div>
  );
}

function TypePill({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "chip shrink-0 border px-3 py-1.5",
        active
          ? "border-loop-500 bg-loop-50 text-loop-700 dark:bg-loop-500/15 dark:text-loop-300"
          : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
      )}
    >
      <Icon name={icon} className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
