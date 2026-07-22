"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Field, Form, Loading, SelectField } from "@/components/ui";
import { api } from "@/lib/api";
import type { ApiError, Customer } from "@/types/api";

type Props = { mode: "create" | "edit"; customerId?: string };

export function CustomerForm({ mode, customerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    document: "",
    email: "",
    status: "active",
  });

  useEffect(() => {
    if (mode !== "edit" || !customerId) return;
    let active = true;
    api<{ data: Customer }>(`/customers/${customerId}`)
      .then((response) => {
        if (!active) return;
        const customer = response.data;
        setForm({
          name: customer.name,
          document: customer.document,
          email: customer.email,
          status: customer.status,
        });
      })
      .catch((err) => active && setError(err as ApiError))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [mode, customerId]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (mode === "create") {
        const created = await api<{ data: Customer }>("/customers", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setSuccess("Cliente cadastrado com sucesso.");
        router.push(`/customers/${created.data.id}`);
      } else {
        await api(`/customers/${customerId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        setSuccess("Cliente atualizado com sucesso.");
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          {mode === "create" ? "Novo cliente" : "Editar cliente"}
        </h1>
        <Link href="/customers" className="btn-secondary">
          Voltar
        </Link>
      </div>
      <Alert error={error} success={success} />
      <Form onSubmit={onSubmit} className="grid max-w-2xl gap-4">
        <Field label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Field
          label="Documento"
          value={form.document}
          onChange={(e) => setForm({ ...form, document: e.target.value })}
          required
        />
        <Field
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <SelectField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
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
