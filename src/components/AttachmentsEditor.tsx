"use client";

import { useState } from "react";
import type { Attachment } from "@/lib/types";
import {
  addLinkAttachment,
  deleteAttachment,
  signedUrl,
  uploadFileAttachment,
} from "@/lib/attachments";
import { Icon } from "./Icon";

const ICON_FOR = { link: "Link", document: "FileText", image: "Image" } as const;

export function AttachmentsEditor({
  itemId,
  initial,
}: {
  itemId: string;
  initial: Attachment[];
}) {
  const [items, setItems] = useState<Attachment[]>(initial);
  const [linkDraft, setLinkDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function onAddLink() {
    const url = linkDraft.trim();
    if (!url) return;
    setBusy(true);
    try {
      const row = await addLinkAttachment(itemId, url);
      setItems((a) => [...a, row]);
      setLinkDraft("");
    } finally {
      setBusy(false);
    }
  }

  async function onPickFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const row = await uploadFileAttachment(itemId, f);
        setItems((a) => [...a, row]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(att: Attachment) {
    setItems((a) => a.filter((x) => x.id !== att.id));
    await deleteAttachment(att);
  }

  async function open(att: Attachment) {
    if (att.url) {
      window.open(att.url, "_blank", "noopener");
    } else if (att.storage_path) {
      const url = await signedUrl(att.storage_path);
      if (url) window.open(url, "_blank", "noopener");
    }
  }

  return (
    <div>
      <label className="label">Links, documents &amp; images</label>

      {items.length > 0 && (
        <ul className="mb-2 space-y-1.5">
          {items.map((att) => (
            <li
              key={att.id}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
            >
              <Icon name={ICON_FOR[att.kind]} className="h-4 w-4 shrink-0 text-loop-600" />
              <button onClick={() => open(att)} className="flex-1 truncate text-left hover:underline" type="button">
                {att.title || att.url || "Attachment"}
              </button>
              <button onClick={() => onRemove(att)} type="button" aria-label="Remove">
                <Icon name="Trash2" className="h-4 w-4 text-slate-400 hover:text-rose-500" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          className="input"
          placeholder="Paste a link / URL"
          value={linkDraft}
          onChange={(e) => setLinkDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddLink();
            }
          }}
        />
        <button type="button" className="btn-ghost px-3" onClick={onAddLink} disabled={busy}>
          <Icon name="Plus" className="h-4 w-4" />
        </button>
        <label className="btn-ghost cursor-pointer px-3" aria-label="Attach files">
          <Icon name="Paperclip" className="h-4 w-4" />
          <input type="file" multiple className="hidden" onChange={(e) => onPickFiles(e.target.files)} />
        </label>
      </div>
      {busy && <p className="mt-1 text-xs text-slate-400">Working…</p>}
    </div>
  );
}
