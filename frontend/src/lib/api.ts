import { getToken } from "@/lib/auth";
import type { ApiError } from "@/types/api";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

function toApiError(payload: unknown, status: number): ApiError {
  const data = payload as { message?: string; errors?: Record<string, string[]> };
  return {
    message: data?.message ?? "Não foi possível concluir a solicitação.",
    errors: data?.errors,
    status,
  };
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) throw toApiError(payload, response.status);
  return payload as T;
}

export async function download(path: string, filename: string) {
  const token = getToken();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Accept: "*/*",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw toApiError(payload, response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function queryString(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function money(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function percent(rate?: string | number | null) {
  return `${(Number(rate ?? 0) * 100).toFixed(2)}%`;
}
