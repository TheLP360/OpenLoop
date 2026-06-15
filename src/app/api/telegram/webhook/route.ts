import { NextResponse } from "next/server";
import { createAdminClient, ownerId } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API = "https://api.telegram.org";

// Verify the request really came from Telegram (secret token header) or our
// own webhook secret query param.
function authorized(request: Request): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return false;
  const url = new URL(request.url);
  const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
  return url.searchParams.get("secret") === secret || headerSecret === secret;
}

async function reply(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`${API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {});
}

// Download a Telegram file and store it as an attachment on the item.
async function ingestFile(
  supabase: ReturnType<typeof createAdminClient>,
  itemId: string,
  fileId: string,
  fileName: string,
  isImage: boolean
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  const meta = await fetch(`${API}/bot${token}/getFile?file_id=${fileId}`).then((r) => r.json());
  const filePath = meta?.result?.file_path;
  if (!filePath) return;

  const res = await fetch(`${API}/file/bot${token}/${filePath}`);
  if (!res.ok) return;
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") ?? undefined;

  const safeName = fileName.replace(/[^\w.\-]+/g, "_");
  const storagePath = `${ownerId()}/${itemId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("attachments").upload(storagePath, buf, {
    contentType: mime,
    upsert: false,
  });
  if (error) return;

  await supabase.from("attachments").insert({
    owner_id: ownerId(),
    item_id: itemId,
    kind: isImage ? "image" : "document",
    storage_path: storagePath,
    title: fileName,
    mime_type: mime ?? null,
    size_bytes: buf.byteLength,
  });
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = await request.json().catch(() => null);
  const message = update?.message ?? update?.channel_post;
  if (!message) return NextResponse.json({ ok: true });

  // Only accept messages from the configured owner.
  const allowed = process.env.TELEGRAM_ALLOWED_USER_ID;
  const fromId = message.from?.id;
  if (allowed && String(fromId) !== String(allowed)) {
    await reply(message.chat.id, "Not authorized for this OpenLoop instance.");
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();

  // Title/description from text or caption.
  const text: string = message.text ?? message.caption ?? "";
  const [firstLine, ...rest] = text.split("\n");
  const title = (firstLine || "Captured from Telegram").slice(0, 200);
  const description = rest.join("\n").trim() || null;

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      owner_id: ownerId(),
      title,
      description,
      status: "intake",
      source: "telegram",
    })
    .select("id")
    .single();
  if (error || !item) {
    await reply(message.chat.id, "Couldn't save that — try again.");
    return NextResponse.json({ ok: true });
  }

  // Any URLs in the text become link attachments.
  const urls = text.match(/https?:\/\/\S+/g) ?? [];
  if (urls.length) {
    await supabase.from("attachments").insert(
      urls.map((url: string) => ({
        owner_id: ownerId(),
        item_id: item.id,
        kind: "link" as const,
        url,
        title: url,
      }))
    );
  }

  // Photos (largest size) and documents.
  if (Array.isArray(message.photo) && message.photo.length) {
    const largest = message.photo[message.photo.length - 1];
    await ingestFile(supabase, item.id, largest.file_id, `photo-${largest.file_unique_id}.jpg`, true);
  }
  if (message.document) {
    await ingestFile(
      supabase,
      item.id,
      message.document.file_id,
      message.document.file_name ?? "document",
      (message.document.mime_type ?? "").startsWith("image/")
    );
  }

  await reply(message.chat.id, "✓ Captured to OpenLoop Intake.");
  return NextResponse.json({ ok: true });
}
