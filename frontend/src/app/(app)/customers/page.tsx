"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, Loading, PageTitle, Pagination, SelectField } from "@/components/ui";
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
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
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
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((customer) => (
                <tr key={customer.id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{customer.name}</td>
                  <td className="px-4 py-3">{customer.document}</td>
                  <td className="px-4 py-3">{customer.email}</td>
                  <td className="px-4 py-3 capitalize">{customer.status === "active" ? "Ativo" : "Inativo"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/customers/${customer.id}`} className="text-slate-700 underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhum cliente encontrado.
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
