import type { Money } from "./types";
export const money = (value: Money) => {
  // Preserve DECIMAL strings, including aggregate totals above Number.MAX_SAFE_INTEGER.
  const raw = typeof value === "number" ? value.toFixed(2) : value;
  const [integer, decimal = ""] = raw.split(".");
  const grouped = new Intl.NumberFormat("pt-BR").format(BigInt(integer || "0"));
  return `R$ ${grouped},${decimal.padEnd(2, "0").slice(0, 2)}`;
};
export const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("pt-BR").format(
        new Date(value.slice(0, 10) + "T12:00:00"),
      )
    : "—";
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const labels = { paid: "Paga", overdue: "Vencida", pending: "Pendente" };
