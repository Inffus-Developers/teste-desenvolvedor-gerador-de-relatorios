"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormHTMLAttributes, type InputHTMLAttributes, type ReactNode, useEffect } from "react";
import { api } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import type { ApiError } from "@/types/api";

export function ProtectedShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  async function logout() {
    try {
      await api("/logout", { method: "POST" });
    } catch {
      // The local session must still be cleared when the API is unavailable.
    }
    clearToken();
    router.replace("/login");
  }

  const links = [
    ["/customers", "Clientes"],
    ["/billings", "Cobranças"],
    ["/reports", "Relatórios"],
  ];
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/customers" className="font-semibold text-slate-900">Inffus Billing</Link>
          <nav className="flex items-center gap-1">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className={`rounded-md px-3 py-2 text-sm font-medium ${pathname.startsWith(href) ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>{label}</Link>
            ))}
            <button onClick={logout} className="ml-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Sair</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">{children}</main>
    </div>
  );
}

export function PageTitle({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold text-slate-900">{title}</h1>{action}</div>;
}

export function Alert({ error, success }: { error?: ApiError | string | null; success?: string | null }) {
  const errorMessage = typeof error === "string" ? error : error?.message;
  return <>{errorMessage && <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}{success && <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div>}</>;
}

export function Loading() {
  return <div className="py-12 text-center text-sm text-slate-500">Carregando…</div>;
}

export function Pagination({ page, lastPage, onPage }: { page: number; lastPage: number; onPage: (page: number) => void }) {
  if (lastPage <= 1) return null;
  return <div className="mt-4 flex items-center justify-end gap-3 text-sm"><button disabled={page <= 1} onClick={() => onPage(page - 1)} className="btn-secondary disabled:opacity-50">Anterior</button><span className="text-slate-600">Página {page} de {lastPage}</span><button disabled={page >= lastPage} onClick={() => onPage(page + 1)} className="btn-secondary disabled:opacity-50">Próxima</button></div>;
}

export function Field({ label, error, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input {...props} className="input mt-1" />{error && <span className="mt-1 block text-xs font-normal text-red-600">{error}</span>}</label>;
}

export function SelectField({ label, children, ...props }: { label: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <label className="block text-sm font-medium text-slate-700">{label}<select {...props} className="input mt-1">{children}</select></label>;
}

export function Form({ children, className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form {...props} className={className ?? "rounded-lg border border-slate-200 bg-white p-5 shadow-sm"}>
      {children}
    </form>
  );
}
