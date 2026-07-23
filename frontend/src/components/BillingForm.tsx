"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Field, Form, Loading, PageTitle, SelectField } from "@/components/ui";
import { api } from "@/lib/api";
import type { ApiError, Billing, Customer, PaginatedResponse } from "@/types/api";

type Props = { mode: "create" | "edit"; billingId?: string };

export function BillingForm({ mode, billingId }: Props) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_id: "",
    description: "",
    original_amount: "",
    issue_date: "",
    due_date: "",
    monthly_interest_rate: "0.02",
    status: "pending",
  });

  useEffect(() => {
    let active = true;
    Promise.all([
      api<PaginatedResponse<Customer>>("/customers?per_page=100&sort_by=name"),
      mode === "edit" && billingId ? api<{ data: Billing }>(`/billings/${billingId}`) : Promise.resolve(null),
    ])
      .then(([customerResponse, billingResponse]) => {
        if (!active) return;
        setCustomers(customerResponse.data);
        if (billingResponse) {
          const billing = billingResponse.data;
          setForm({
            customer_id: String(billing.customer_id),
            description: billing.description,
            original_amount: billing.original_amount,
            issue_date: billing.issue_date,
            due_date: billing.due_date,
            monthly_interest_rate: billing.monthly_interest_rate,
            status: billing.status === "cancelled" ? "cancelled" : "pending",
          });
        }
      })
      .catch((err) => active && setError(err as ApiError))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [mode, billingId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const payload = {
      ...form,
      customer_id: Number(form.customer_id),
      original_amount: Number(form.original_amount),
      monthly_interest_rate: Number(form.monthly_interest_rate),
    };
    try {
      if (mode === "create") {
        const created = await api<{ data: Billing }>("/billings", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSuccess("Cobrança cadastrada com sucesso.");
        router.push(`/billings/${created.data.id}`);
      } else {
        await api(`/billings/${billingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setSuccess("Cobrança atualizada com sucesso.");
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <PageTitle
        title={mode === "create" ? "Nova cobrança" : "Editar cobrança"}
        action={
          <Link href="/billings" className="btn-secondary">
            Voltar
          </Link>
        }
      />
      <Alert error={error} success={success} />
      <Form onSubmit={onSubmit} className="grid max-w-2xl gap-4">
        <SelectField
          label="Cliente"
          value={form.customer_id}
          onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
          required
        >
          <option value="">Selecione</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </SelectField>
        <Field
          label="Descrição"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <Field
          label="Valor original"
          type="number"
          step="0.01"
          min="0.01"
          value={form.original_amount}
          onChange={(e) => setForm({ ...form, original_amount: e.target.value })}
          required
        />
        <Field
          label="Data de emissão"
          type="date"
          value={form.issue_date}
          onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
          required
        />
        <Field
          label="Data de vencimento"
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          required
        />
        <Field
          label="Taxa de juros mensal (ex: 0.02 = 2%)"
          type="number"
          step="0.000001"
          min="0"
          max="1"
          value={form.monthly_interest_rate}
          onChange={(e) => setForm({ ...form, monthly_interest_rate: e.target.value })}
          required
        />
        <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="pending">Pendente</option>
          <option value="cancelled">Cancelada</option>
        </SelectField>
        <div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </Form>
    </div>
  );
}
