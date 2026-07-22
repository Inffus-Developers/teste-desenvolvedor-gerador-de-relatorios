"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Alert, Field, Form } from "@/components/ui";
import type { ApiError, User } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@inffus.test");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api<{ token: string; user: User }>("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(response.token);
      router.replace("/customers");
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Inffus Billing</h1>
          <p className="mt-1 text-sm text-slate-600">Acesse com suas credenciais</p>
        </div>
        <Form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <Alert error={error} />
          <Field label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Field label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <p className="text-center text-xs text-slate-500">Usuário padrão: admin@inffus.test / password</p>
        </Form>
      </div>
    </div>
  );
}
