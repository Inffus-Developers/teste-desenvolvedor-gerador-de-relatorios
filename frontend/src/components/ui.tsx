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
    <div className="app-shell">
      <header className="app-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/customers" className="app-brand">
            Inffus Billing
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`app-nav-link ${pathname.startsWith(href) ? "app-nav-link-active" : ""}`}
              >
                {label}
              </Link>
            ))}
            <button type="button" onClick={logout} className="btn-ghost ml-1">
              Sair
            </button>
          </nav>
          <div className="flex items-center gap-2 sm:hidden">
            {links.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-2.5 py-1.5 text-xs font-medium ${
                  pathname.startsWith(href)
                    ? "bg-[rgb(83_58_253/0.1)] text-[var(--color-primary-deep)]"
                    : "text-muted"
                }`}
              >
                {label}
              </Link>
            ))}
            <button type="button" onClick={logout} className="btn-ghost px-2 py-1.5 text-xs">
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6">{children}</main>
    </div>
  );
}

export function PageTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="page-title">{title}</h1>
      {action}
    </div>
  );
}

export function Alert({ error, success }: { error?: ApiError | string | null; success?: string | null }) {
  const errorMessage = typeof error === "string" ? error : error?.message;

  return (
    <>
      {errorMessage && (
        <div role="alert" className="alert-error">
          {errorMessage}
        </div>
      )}
      {success && (
        <div role="status" className="alert-success">
          {success}
        </div>
      )}
    </>
  );
}

export function Loading() {
  return <div className="py-12 text-center text-sm text-muted">Carregando…</div>;
}

export function Pagination({
  page,
  lastPage,
  onPage,
}: {
  page: number;
  lastPage: number;
  onPage: (page: number) => void;
}) {
  if (lastPage <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-end gap-3 text-sm">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="btn-secondary">
        Anterior
      </button>
      <span className="text-muted">
        Página {page} de {lastPage}
      </span>
      <button type="button" disabled={page >= lastPage} onClick={() => onPage(page + 1)} className="btn-secondary">
        Próxima
      </button>
    </div>
  );
}

export function Field({
  label,
  error,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const fieldId = id ?? props.name;

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="field-label">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
        className="input mt-1.5"
      />
      {error && (
        <span id={`${fieldId}-error`} role="alert" className="mt-1.5 block text-xs text-[var(--color-ruby)]">
          {error}
        </span>
      )}
    </div>
  );
}

export function SelectField({
  label,
  children,
  className,
  ...props
}: { label: string; children: ReactNode; className?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={className ?? "block"}>
      <span className="field-label">{label}</span>
      <select {...props} className="select mt-1.5">
        {children}
      </select>
    </label>
  );
}

export function Form({ children, className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form {...props} className={className ?? "form-shell space-y-4"}>
      {children}
    </form>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return <div className="table-shell">{children}</div>;
}

export function StatCard({ label, value, tabular = false }: { label: string; value: string; tabular?: boolean }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className={`stat-card-value ${tabular ? "tabular-nums" : ""}`}>{value}</div>
    </div>
  );
}

export function DetailCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`surface-card grid gap-3 p-5 text-sm ${className ?? "max-w-2xl"}`}>{children}</div>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <span className="text-muted">{label}:</span>
      <span className="text-secondary">{children}</span>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">{children}</h2>;
}
