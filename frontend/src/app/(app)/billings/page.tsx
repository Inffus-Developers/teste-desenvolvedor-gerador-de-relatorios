"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Loading, PageTitle, Pagination, SelectField, TableShell } from "@/components/ui";
import { api, money, queryString } from "@/lib/api";
import type { ApiError, Billing, Customer, PaginatedResponse } from "@/types/api";
import { paginationOf } from "@/types/api";

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  overdue: "Vencida",
  paid: "Paga",
  cancelled: "Cancelada",
};

export default function BillingsPage() {
  const [items, setItems] = useState<Billing[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("due_date");
  const [sortDir, setSortDir] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    api<PaginatedResponse<Customer>>("/customers?per_page=100&sort_by=name")
      .then((response) => setCustomers(response.data))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api<PaginatedResponse<Billing>>(
      `/billings${queryString({
        page,
        customer_id: customerId,
        status,
        sort_by: sortBy,
        sort_dir: sortDir,
      })}`,
    )
      .then((response) => {
        if (!active) return;
        setItems(response.data);
        const meta = paginationOf(response);
        setPage(meta.page);
        setLastPage(meta.lastPage);
        setError(null);
      })
      .catch((err) => active && setError(err as ApiError))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, customerId, status, sortBy, sortDir]);

  return (
    <div>
      <PageTitle
        title="Cobranças"
        action={
          <Link href="/billings/new" className="btn-primary">
            Nova cobrança
          </Link>
        }
      />
      <Alert error={error} />
      <div className="form-shell mb-4 grid gap-3 md:grid-cols-4">
        <SelectField
          label="Cliente"
          value={customerId}
          onChange={(e) => {
            setPage(1);
            setCustomerId(e.target.value);
          }}
        >
          <option value="">Todos</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Status"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">Todos</option>
          <option value="pending">Pendente</option>
          <option value="overdue">Vencida</option>
          <option value="paid">Paga</option>
          <option value="cancelled">Cancelada</option>
        </SelectField>
        <SelectField label="Ordenar por" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="due_date">Vencimento</option>
          <option value="issue_date">Emissão</option>
          <option value="original_amount">Valor</option>
          <option value="status">Status</option>
        </SelectField>
        <SelectField label="Direção" value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
          <option value="asc">Ascendente</option>
          <option value="desc">Descendente</option>
        </SelectField>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <TableShell>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Descrição</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Valor atualizado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((billing) => (
                <tr key={billing.id}>
                  <td>{billing.customer?.name ?? billing.customer_id}</td>
                  <td>{billing.description}</td>
                  <td className="tabular-nums">{billing.due_date}</td>
                  <td>
                    <span className="badge">{statusLabel[billing.status] ?? billing.status}</span>
                  </td>
                  <td className="tabular-nums font-medium text-[var(--color-ink)]">
                    {money(billing.updated_amount)}
                  </td>
                  <td className="text-right">
                    <Link href={`/billings/${billing.id}`} className="link-accent">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    Nenhuma cobrança encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableShell>
      )}
      <Pagination page={page} lastPage={lastPage} onPage={setPage} />
    </div>
  );
}
