// Domain types for OpenLoop, mirroring the Supabase schema (0001_init.sql).

export type ItemKind = "next_step" | "outcome" | "thought" | "resource";

export type ItemStatus =
  | "intake"
  | "next"
  | "active"
  | "waiting"
  | "someday"
  | "done"
  | "archived";

export type EnergyLevel = "low" | "medium" | "high";
export type PriorityLevel = "none" | "low" | "medium" | "high" | "urgent";
export type AttachmentKind = "link" | "document" | "image";
export type TemplateKind = "outcome" | "thought";
export type CaptureSource = "web" | "quick_capture" | "telegram" | "ai" | "template";

export interface Item {
  id: string;
  owner_id: string;
  kind: ItemKind | null;
  status: ItemStatus;
  title: string;
  description: string | null;
  body: string | null;
  energy: EnergyLevel | null;
  priority: PriorityLevel;
  tags: string[];
  due_date: string | null;
  scheduled_date: string | null;
  resurface_date: string | null;
  completed_at: string | null;
  due_notified_at: string | null;
  resurface_notified_at: string | null;
  parent_id: string | null;
  url: string | null;
  recurrence_rule: string | null;
  recurrence_parent_id: string | null;
  source: CaptureSource;
  template_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  owner_id: string;
  item_id: string;
  kind: AttachmentKind;
  url: string | null;
  storage_path: string | null;
  title: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
  created_at: string;
}

export interface Template {
  id: string;
  owner_id: string;
  kind: TemplateKind;
  name: string;
  description: string | null;
  prompt: string | null;
  default_tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TemplateStep {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  energy: EnergyLevel | null;
  priority: PriorityLevel;
  sort_order: number;
  created_at: string;
}

export interface ItemWithRelations extends Item {
  attachments?: Attachment[];
  children?: Item[];
}
