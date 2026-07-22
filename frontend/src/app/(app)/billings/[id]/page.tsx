"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Alert, Field, Form, Loading, PageTitle } from "@/components/ui";
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
      <div className="grid max-w-3xl gap-3 rounded-lg border border-slate-200 bg-white p-5 text-sm">
        <div>
          <span className="text-slate-500">Cliente:</span> {billing.customer?.name ?? billing.customer_id}
        </div>
        <div>
          <span className="text-slate-500">Descrição:</span> {billing.description}
        </div>
        <div>
          <span className="text-slate-500">Emissão:</span> {billing.issue_date}
        </div>
        <div>
          <span className="text-slate-500">Vencimento:</span> {billing.due_date}
        </div>
        <div>
          <span className="text-slate-500">Status:</span> {statusLabel[billing.status] ?? billing.status}
        </div>
        <div>
          <span className="text-slate-500">Valor original:</span> {money(billing.original_amount)}
        </div>
        <div>
          <span className="text-slate-500">Juros:</span> {money(billing.interest_amount)}
        </div>
        <div>
          <span className="text-slate-500">Valor atualizado:</span> {money(billing.updated_amount)}
        </div>
        <div>
          <span className="text-slate-500">Taxa mensal:</span> {percent(billing.monthly_interest_rate)}
        </div>
        {billing.payment_date && (
          <>
            <div>
              <span className="text-slate-500">Data do pagamento:</span> {billing.payment_date}
            </div>
            <div>
              <span className="text-slate-500">Valor pago:</span> {money(billing.paid_amount)}
            </div>
            <div>
              <span className="text-slate-500">Juros no pagamento:</span> {money(billing.interest_amount_at_payment)}
            </div>
          </>
        )}
      </div>

      {canPay && (
        <Form onSubmit={onPay} className="mt-6 grid max-w-md gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Registrar pagamento</h2>
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
