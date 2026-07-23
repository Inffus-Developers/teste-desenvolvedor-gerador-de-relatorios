"use client";

import { ProtectedShell } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
