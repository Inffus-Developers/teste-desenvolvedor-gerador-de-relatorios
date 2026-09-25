import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import { api, ApiError } from "./api";
import { labels } from "./format";
import type { Customer, Page } from "./types";

export function useApi<T>(url: string, refresh = 0) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<T>(url, { signal: controller.signal })
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e.message || "Não foi possível conectar ao servidor.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [url, refresh]);
  return { data, error, loading };
}

export function ErrorBox({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="error-box" role="alert">
      <AlertCircle size={18} />
      <div>
        {message}
        {error instanceof ApiError &&
          Object.entries(error.errors).map(([field, messages]) => (
            <div key={field}>{messages.join(" ")}</div>
          ))}
      </div>
    </div>
  );
}

export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle size={20} className="spin" /> Carregando informações…
    </div>
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <Search size={28} />
      <strong>Nenhum resultado encontrado</strong>
      <span>{children}</span>
    </div>
  );
}
export function Badge({ status }: { status: "paid" | "pending" | "overdue" }) {
  return (
    <span className={"badge " + status}>
      <i />
      {labels[status]}
    </span>
  );
}

export function Pagination({
  page,
  number,
  onPage,
}: {
  page?: Page<unknown>;
  number: number;
  onPage: (cursor: string, delta: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        {page?.data.length ?? 0} registros nesta página{" "}
        <span className="muted">· Página {number}</span>
      </span>
      <div>
        <button
          className="icon-button"
          aria-label="Página anterior"
          disabled={!page?.prev_cursor}
          onClick={() => onPage(page!.prev_cursor!, -1)}
        >
          <ChevronLeft size={17} />
        </button>
        <span>{number}</span>
        <button
          className="icon-button"
          aria-label="Próxima página"
          disabled={!page?.next_cursor}
          onClick={() => onPage(page!.next_cursor!, 1)}
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}

export function SortHead({
  field,
  current,
  direction,
  onSort,
  children,
}: {
  field: string;
  current: string;
  direction: string;
  onSort: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <th>
      <button className="sort-button" onClick={() => onSort(field)}>
        {children}
        {current === field ? (
          direction === "asc" ? (
            <ArrowUp size={12} />
          ) : (
            <ArrowDown size={12} />
          )
        ) : (
          <ArrowDown size={12} className="muted" />
        )}
      </button>
    </th>
  );
}

export function Modal({
  title,
  subtitle,
  children,
  close,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={close} aria-label={title}>
      <div className="modal-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button className="icon-button" aria-label="Fechar" onClick={close}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function CustomerPicker({
  value,
  name = "",
  onChange,
  activeOnly = false,
  required = false,
}: {
  value: string;
  name?: string;
  onChange: (id: string, name: string) => void;
  activeOnly?: boolean;
  required?: boolean;
}) {
  const [text, setText] = useState(name);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setText(name);
  }, [name]);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(text), 250);
    return () => clearTimeout(timer);
  }, [text]);
  const { data, loading, error } = useApi<Page<Customer>>(
    "/api/customers?per_page=20&search=" +
      encodeURIComponent(search) +
      (activeOnly ? "&active=1" : ""),
  );
  return (
    <div
      className="picker"
      ref={wrap}
      onBlur={(e) => {
        if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div className="input-icon">
        <Search size={16} />
        <input
          aria-label="Buscar cliente"
          placeholder="Todos os clientes"
          value={text}
          required={required}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setText(e.target.value);
            onChange("", e.target.value);
            setOpen(true);
          }}
        />
        {value && <Check size={16} />}
      </div>
      {open && (
        <div className="picker-menu">
          {!required && (
            <button
              type="button"
              onClick={() => {
                onChange("", "");
                setText("");
                setOpen(false);
              }}
            >
              Todos os clientes
            </button>
          )}
          {loading ? (
            <span>Buscando…</span>
          ) : error ? (
            <span>{error}</span>
          ) : (
            data?.data.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  onChange(String(c.id), c.name);
                  setText(c.name);
                  setOpen(false);
                }}
              >
                <strong>{c.name}</strong>
                <small>{c.document}</small>
              </button>
            ))
          )}
          {!loading && !data?.data.length && (
            <span>Nenhum cliente encontrado.</span>
          )}
          <small className="picker-hint">
            Busque pelo início do nome ou documento.
          </small>
        </div>
      )}
    </div>
  );
}
