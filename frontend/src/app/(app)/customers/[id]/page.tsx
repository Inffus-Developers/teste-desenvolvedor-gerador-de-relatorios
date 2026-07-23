"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, DetailCard, DetailRow, Loading, PageTitle } from "@/components/ui";
import { api } from "@/lib/api";
import type { ApiError, Customer } from "@/types/api";

export default function CustomerShowPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let active = true;
    api<{ data: Customer }>(`/customers/${params.id}`)
      .then((response) => active && setCustomer(response.data))
      .catch((err) => active && setError(err as ApiError))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.id]);

  if (loading) return <Loading />;
  if (!customer) return <Alert error={error ?? "Cliente não encontrado."} />;

  return (
    <div>
      <PageTitle
        title={customer.name}
        action={
          <div className="flex gap-2">
            <Link href="/customers" className="btn-secondary">
              Voltar
            </Link>
            <Link href={`/customers/${customer.id}/edit`} className="btn-primary">
              Editar
            </Link>
          </div>
        }
      />
      <Alert error={error} />
      <DetailCard>
        <DetailRow label="Documento">{customer.document}</DetailRow>
        <DetailRow label="E-mail">{customer.email}</DetailRow>
        <DetailRow label="Status">{customer.status === "active" ? "Ativo" : "Inativo"}</DetailRow>
      </DetailCard>
    </div>
  );
}
