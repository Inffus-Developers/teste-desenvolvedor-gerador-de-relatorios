"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Loading, PageTitle, Pagination, SelectField } from "@/components/ui";
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
      <div className="mb-4 grid gap-3 md:grid-cols-4">
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
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Valor atualizado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((billing) => (
                <tr key={billing.id} className="border-b border-slate-100">
                  <td className="px-4 py-3">{billing.customer?.name ?? billing.customer_id}</td>
                  <td className="px-4 py-3">{billing.description}</td>
                  <td className="px-4 py-3">{billing.due_date}</td>
                  <td className="px-4 py-3">{statusLabel[billing.status] ?? billing.status}</td>
                  <td className="px-4 py-3">{money(billing.updated_amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/billings/${billing.id}`} className="underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nenhuma cobrança encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} lastPage={lastPage} onPage={setPage} />
    </div>
  );
}
