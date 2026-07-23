"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, DetailCard, DetailRow, Field, Form, Loading, PageTitle, SectionTitle } from "@/components/ui";
import { api, money, percent } from "@/lib/api";
import type { ApiError, Billing } from "@/types/api";

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  overdue: "Vencida",
  paid: "Paga",
  cancelled: "Cancelada",
};

export default function BillingShowPage() {
  const params = useParams<{ id: string }>();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const response = await api<{ data: Billing }>(`/billings/${params.id}`);
      setBilling(response.data);
      setError(null);
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function onPay(event: FormEvent) {
    event.preventDefault();
    setPaying(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api<{ data: Billing }>(`/billings/${params.id}/pay`, {
        method: "POST",
        body: JSON.stringify({ payment_date: paymentDate }),
      });
      setBilling(response.data);
      setSuccess("Pagamento registrado com sucesso.");
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <Loading />;
  if (!billing) return <Alert error={error ?? "Cobrança não encontrada."} />;

  const canPay = billing.status === "pending" || billing.status === "overdue";
  const canEdit = billing.status !== "paid";

  return (
    <div>
      <PageTitle
        title={`Cobrança #${billing.id}`}
        action={
          <div className="flex gap-2">
            <Link href="/billings" className="btn-secondary">
              Voltar
            </Link>
            {canEdit && (
              <Link href={`/billings/${billing.id}/edit`} className="btn-primary">
                Editar
              </Link>
            )}
          </div>
        }
      />
      <Alert error={error} success={success} />
      <DetailCard className="max-w-3xl">
        <DetailRow label="Cliente">{billing.customer?.name ?? billing.customer_id}</DetailRow>
        <DetailRow label="Descrição">{billing.description}</DetailRow>
        <DetailRow label="Emissão">{billing.issue_date}</DetailRow>
        <DetailRow label="Vencimento">{billing.due_date}</DetailRow>
        <DetailRow label="Status">{statusLabel[billing.status] ?? billing.status}</DetailRow>
        <DetailRow label="Valor original">
          <span className="tabular-nums">{money(billing.original_amount)}</span>
        </DetailRow>
        <DetailRow label="Juros">
          <span className="tabular-nums">{money(billing.interest_amount)}</span>
        </DetailRow>
        <DetailRow label="Valor atualizado">
          <span className="tabular-nums">{money(billing.updated_amount)}</span>
        </DetailRow>
        <DetailRow label="Taxa mensal">
          <span className="tabular-nums">{percent(billing.monthly_interest_rate)}</span>
        </DetailRow>
        {billing.payment_date && (
          <>
            <DetailRow label="Data do pagamento">{billing.payment_date}</DetailRow>
            <DetailRow label="Valor pago">
              <span className="tabular-nums">{money(billing.paid_amount)}</span>
            </DetailRow>
            <DetailRow label="Juros no pagamento">
              <span className="tabular-nums">{money(billing.interest_amount_at_payment)}</span>
            </DetailRow>
          </>
        )}
      </DetailCard>

      {canPay && (
        <Form onSubmit={onPay} className="mt-6 max-w-md">
          <SectionTitle>Registrar pagamento</SectionTitle>
          <Field
            label="Data do pagamento"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
          <div>
            <button type="submit" className="btn-primary" disabled={paying}>
              {paying ? "Registrando…" : "Confirmar pagamento"}
            </button>
          </div>
        </Form>
      )}
    </div>
  );
}
