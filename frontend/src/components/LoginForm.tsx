"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useState } from "react";
import { Alert, Field } from "@/components/ui";
import { api } from "@/lib/api";
import { getToken, setToken } from "@/lib/auth";
import type { ApiError, User } from "@/types/api";

type FieldErrors = {
  email?: string;
  password?: string;
};

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email.trim()) {
    errors.email = "Informe seu e-mail.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!password) {
    errors.password = "Informe sua senha.";
  }

  return errors;
}

function mapApiErrors(error: ApiError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  error.errors?.email?.forEach((message) => {
    fieldErrors.email = message;
  });
  error.errors?.password?.forEach((message) => {
    fieldErrors.password = message;
  });

  if (!fieldErrors.email && !fieldErrors.password && error.status === 422) {
    fieldErrors.email = error.message;
  }

  return fieldErrors;
}

export function LoginForm() {
  const router = useRouter();
  const formId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (getToken()) {
      router.replace("/customers");
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validate(email, password);
    setFieldErrors(validationErrors);
    setError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await api<{ token: string; user: User }>("/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      setToken(response.token);
      router.replace("/customers");
    } catch (err) {
      const apiError = err as ApiError;
      const mappedErrors = mapApiErrors(apiError);
      setFieldErrors(mappedErrors);
      setError(Object.keys(mappedErrors).length > 0 ? null : apiError);
    } finally {
      setLoading(false);
    }
  }

  function fillDemoCredentials() {
    setEmail("admin@inffus.test");
    setPassword("password");
    setFieldErrors({});
    setError(null);
  }

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      noValidate
      className="space-y-5"
      aria-labelledby={`${formId}-title`}
    >
      <h2 id={`${formId}-title`} className="sr-only">
        Formulário de login
      </h2>

      <Alert error={error} />

      <Field
        id={`${formId}-email`}
        name="email"
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          if (fieldErrors.email) {
            setFieldErrors((current) => ({ ...current, email: undefined }));
          }
        }}
        error={fieldErrors.email}
        disabled={loading}
        placeholder="seu@email.com"
      />

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor={`${formId}-password`} className="field-label">
            Senha
          </label>
          <button
            type="button"
            className="text-xs font-medium text-[var(--color-primary-deep)] hover:text-[var(--color-primary)]"
            onClick={() => setShowPassword((current) => !current)}
            aria-pressed={showPassword}
            aria-controls={`${formId}-password`}
            disabled={loading}
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <input
          id={`${formId}-password`}
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (fieldErrors.password) {
              setFieldErrors((current) => ({ ...current, password: undefined }));
            }
          }}
          disabled={loading}
          placeholder="••••••••"
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={fieldErrors.password ? `${formId}-password-error` : undefined}
          className="input mt-1.5"
        />
        {fieldErrors.password && (
          <span id={`${formId}-password-error`} role="alert" className="mt-1.5 block text-xs text-[var(--color-ruby)]">
            {fieldErrors.password}
          </span>
        )}
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-center text-xs text-muted">
        Ambiente de demonstração?{" "}
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="link-accent"
          disabled={loading}
        >
          Usar credenciais de teste
        </button>
      </p>
    </form>
  );
}
