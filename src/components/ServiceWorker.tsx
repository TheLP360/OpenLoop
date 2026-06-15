"use client";

import { useEffect } from "react";

// Registers the PWA service worker once on the client.
export function ServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // avoid caching during dev
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration is best-effort */
    });
  }, []);
  return null;
}
