"use client";

import { useEffect, useState } from "react";
import { savePushSubscription, removePushSubscription } from "@/app/actions";
import { Icon } from "./Icon";

// Convert a base64url VAPID public key into the Uint8Array the Push API wants.
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function keyToB64(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

export function NotificationToggle() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = "serviceWorker" in navigator && "PushManager" in window;
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(!!sub))
      .catch(() => {});
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Notification permission denied.");

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });

      const json = sub.toJSON();
      await savePushSubscription({
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? keyToB64(sub.getKey("p256dh")),
        auth: json.keys?.auth ?? keyToB64(sub.getKey("auth")),
        userAgent: navigator.userAgent,
      });
      setEnabled(true);
      setMsg("Notifications enabled on this device.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setEnabled(false);
      setMsg("Notifications disabled on this device.");
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return <p className="text-sm text-slate-400">Push notifications aren&apos;t supported in this browser.</p>;
  }

  return (
    <div>
      <button
        onClick={enabled ? disable : enable}
        disabled={busy}
        className={enabled ? "btn-ghost w-full" : "btn-primary w-full"}
      >
        <Icon name={enabled ? "BellOff" : "Bell"} className="h-4 w-4" />
        {busy ? "…" : enabled ? "Disable notifications" : "Enable notifications"}
      </button>
      {msg && <p className="mt-2 text-xs text-slate-500">{msg}</p>}
    </div>
  );
}
