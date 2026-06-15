"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { KINDS } from "@/lib/constants";
import type {
  EnergyLevel,
  ItemKind,
  ItemStatus,
  PriorityLevel,
} from "@/lib/types";
import { parseTags } from "@/lib/utils";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)?.toString().trim();
  return s ? s : null;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/intake");
  for (const k of Object.values(KINDS)) revalidatePath(`/${k.slug}`);
}

// ── Quick Capture ─────────────────────────────────────────────────────────────
// Minimal: title, description, optional kind, optional links. Lands in Intake.
export async function quickCapture(input: {
  title: string;
  description?: string;
  kind?: ItemKind | null;
  links?: string[];
}): Promise<{ id: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("items")
    .insert({
      owner_id: user.id,
      title: input.title.trim() || "Untitled",
      description: input.description?.trim() || null,
      kind: input.kind ?? null,
      status: "intake",
      source: "quick_capture",
    })
    .select("id")
    .single();
  if (error) throw error;

  const links = (input.links ?? []).map((u) => u.trim()).filter(Boolean);
  if (links.length) {
    await supabase.from("attachments").insert(
      links.map((url, i) => ({
        owner_id: user.id,
        item_id: data.id,
        kind: "link" as const,
        url,
        sort_order: i,
      }))
    );
  }

  revalidateAll();
  return { id: data.id };
}

// ── Full create / update (the detailed form) ──────────────────────────────────
function readItemFields(formData: FormData) {
  const tagsRaw = str(formData.get("tags"));
  return {
    kind: (str(formData.get("kind")) as ItemKind | null) ?? null,
    status: (str(formData.get("status")) as ItemStatus) ?? "intake",
    title: str(formData.get("title")) ?? "Untitled",
    description: str(formData.get("description")),
    body: str(formData.get("body")),
    energy: (str(formData.get("energy")) as EnergyLevel | null) ?? null,
    priority: (str(formData.get("priority")) as PriorityLevel) ?? "none",
    tags: tagsRaw ? parseTags(tagsRaw) : [],
    due_date: str(formData.get("due_date")),
    scheduled_date: str(formData.get("scheduled_date")),
    resurface_date: str(formData.get("resurface_date")),
    parent_id: str(formData.get("parent_id")),
    url: str(formData.get("url")),
    recurrence_rule: str(formData.get("recurrence_rule")),
  };
}

export async function createItem(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const fields = readItemFields(formData);
  const { data, error } = await supabase
    .from("items")
    .insert({ ...fields, owner_id: user.id })
    .select("id")
    .single();
  if (error) throw error;

  revalidateAll();
  const slug = fields.kind ? KINDS[fields.kind].slug : "intake";
  redirect(`/item/${data.id}?from=${slug}`);
}

export async function updateItem(id: string, formData: FormData) {
  const supabase = createClient();
  const fields = readItemFields(formData);

  // Stamp completion time when transitioning to done.
  const completed_at = fields.status === "done" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("items")
    .update({ ...fields, completed_at })
    .eq("id", id);
  if (error) throw error;

  revalidateAll();
  revalidatePath(`/item/${id}`);
}

export async function setStatus(id: string, status: ItemStatus) {
  const supabase = createClient();
  const { error } = await supabase
    .from("items")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidateAll();
  revalidatePath(`/item/${id}`);
}

export async function deleteItem(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
  revalidateAll();
  redirect("/intake");
}

// Add a Next Step directly under an Outcome.
export async function addChildNextStep(parentId: string, title: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  if (!title.trim()) return;

  const { error } = await supabase.from("items").insert({
    owner_id: user.id,
    kind: "next_step",
    status: "next",
    title: title.trim(),
    parent_id: parentId,
    source: "web",
  });
  if (error) throw error;
  revalidateAll();
  revalidatePath(`/item/${parentId}`);
}

// ── Templates → items ─────────────────────────────────────────────────────────

// Spawn an Outcome (with its pre-assigned Next Steps) from an Outcome template.
export async function createOutcomeFromTemplate(templateId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: template } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .single();
  if (!template) throw new Error("Template not found");

  const { data: steps } = await supabase
    .from("template_steps")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order");

  const { data: outcome, error } = await supabase
    .from("items")
    .insert({
      owner_id: user.id,
      kind: "outcome",
      status: "active",
      title: template.name,
      description: template.description,
      tags: template.default_tags ?? [],
      source: "template",
      template_id: template.id,
    })
    .select("id")
    .single();
  if (error) throw error;

  if (steps?.length) {
    await supabase.from("items").insert(
      steps.map((s) => ({
        owner_id: user.id,
        kind: "next_step" as const,
        status: "next" as const,
        title: s.title,
        description: s.description,
        energy: s.energy,
        priority: s.priority,
        parent_id: outcome.id,
        source: "template" as const,
      }))
    );
  }

  revalidateAll();
  redirect(`/item/${outcome.id}?from=outcomes`);
}

// Start a Thought from a writing-prompt template (or blank).
export async function createThoughtFromTemplate(templateId: string | null) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  let title = "Untitled thought";
  let body: string | null = null;
  let tags: string[] = [];

  if (templateId) {
    const { data: template } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .single();
    if (template) {
      title = template.name;
      body = template.prompt;
      tags = template.default_tags ?? [];
    }
  }

  const { data, error } = await supabase
    .from("items")
    .insert({
      owner_id: user.id,
      kind: "thought",
      status: "active",
      title,
      body,
      tags,
      source: templateId ? "template" : "web",
      template_id: templateId,
    })
    .select("id")
    .single();
  if (error) throw error;

  revalidateAll();
  redirect(`/item/${data.id}?from=thoughts`);
}
