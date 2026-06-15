"use client";

import { icons, type LucideProps } from "lucide-react";

// Render a lucide icon by name (names come from constants.ts KindMeta.icon).
export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const LucideIcon = icons[name as keyof typeof icons];
  if (!LucideIcon) return null;
  return <LucideIcon {...props} />;
}
