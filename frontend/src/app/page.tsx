"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getToken() ? "/customers" : "/login");
  }, [router]);

  return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Redirecionando…</div>;
}
