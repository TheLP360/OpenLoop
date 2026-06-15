"use client";

import { createClient } from "@/lib/supabase/client";
import type { Attachment, AttachmentKind } from "@/lib/types";

const BUCKET = "attachments";

function kindForFile(file: File): AttachmentKind {
  return file.type.startsWith("image/") ? "image" : "document";
}

// Upload a File to Storage at <owner>/<item>/<filename> and record an
// attachment row. Returns the inserted row.
export async function uploadFileAttachment(
  itemId: string,
  file: File
): Promise<Attachment> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${user.id}/${itemId}/${Date.now()}-${safeName}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from("attachments")
    .insert({
      owner_id: user.id,
      item_id: itemId,
      kind: kindForFile(file),
      storage_path: path,
      title: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Attachment;
}

export async function addLinkAttachment(
  itemId: string,
  url: string,
  title?: string
): Promise<Attachment> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("attachments")
    .insert({
      owner_id: user.id,
      item_id: itemId,
      kind: "link",
      url,
      title: title || url,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Attachment;
}

export async function deleteAttachment(att: Attachment): Promise<void> {
  const supabase = createClient();
  if (att.storage_path) {
    await supabase.storage.from(BUCKET).remove([att.storage_path]);
  }
  await supabase.from("attachments").delete().eq("id", att.id);
}

// Signed URL for a stored file (private bucket).
export async function signedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
