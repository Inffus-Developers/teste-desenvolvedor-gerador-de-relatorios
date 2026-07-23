"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Loading, PageTitle, Pagination, SelectField, TableShell } from "@/components/ui";
import { api, queryString } from "@/lib/api";
import type { ApiError, Customer, PaginatedResponse } from "@/types/api";
import { paginationOf } from "@/types/api";

export default function CustomersPage() {
  const [items, setItems] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api<PaginatedResponse<Customer>>(
      `/customers${queryString({ page, status, search, sort_by: "name", sort_dir: "asc" })}`,
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
  }, [page, status, search]);

  return (
    <div>
      <PageTitle
        title="Clientes"
        action={
          <Link href="/customers/new" className="btn-primary">
            Novo cliente
          </Link>
        }
      />
      <Alert error={error} />
      <div className="form-shell mb-4 grid gap-3 sm:grid-cols-3">
        <input
          className="input"
          placeholder="Buscar por nome, documento ou e-mail"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <SelectField
          label="Status"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">Todos</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
        </SelectField>
      </div>
      {loading ? (
        <Loading />
      ) : (
        <TableShell>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Documento</th>
                <th>E-mail</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((customer) => (
                <tr key={customer.id}>
                  <td className="font-medium text-[var(--color-ink)]">{customer.name}</td>
                  <td>{customer.document}</td>
                  <td>{customer.email}</td>
                  <td>
                    <span className="badge">{customer.status === "active" ? "Ativo" : "Inativo"}</span>
                  </td>
                  <td className="text-right">
                    <Link href={`/customers/${customer.id}`} className="link-accent">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted">
                    Nenhum cliente encontrado.
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
