import { useState, type FormEvent } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { post, put } from "./api";
import { CustomerPicker, ErrorBox, Modal } from "./components";
import { date, money, today } from "./format";
import type { Charge, Customer } from "./types";

type Actions = { close: () => void; saved: (message: string) => void };
function SaveButton({
  busy,
  children = "Salvar alterações",
}: {
  busy: boolean;
  children?: string;
}) {
  return (
    <button className="button primary" disabled={busy}>
      {busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}{" "}
      {busy ? "Salvando…" : children}
    </button>
  );
}

export function CustomerForm({
  customer,
  close,
  saved,
}: Actions & { customer?: Customer }) {
  const [form, setForm] = useState({
    name: customer?.name ?? "",
    document: customer?.document ?? "",
    email: customer?.email ?? "",
    active: customer?.active ?? true,
  });
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await (customer
        ? put("/api/customers/" + customer.id, form)
        : post("/api/customers", form));
      saved(
        customer
          ? "Cliente atualizado com sucesso."
          : "Cliente cadastrado com sucesso.",
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={customer ? "Editar cliente" : "Novo cliente"}
      subtitle="Organize os dados de quem faz parte do seu negócio."
      close={close}
    >
      <form onSubmit={submit} className="form">
        <ErrorBox error={error} />
        <label>
          Nome ou razão social
          <input
            required
            maxLength={255}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex.: Aurora Studio"
          />
        </label>
        <div className="form-grid">
          <label>
            CPF ou CNPJ
            <input
              required
              value={form.document}
              onChange={(e) => setForm({ ...form, document: e.target.value })}
              placeholder="Somente números"
            />
          </label>
          <label>
            E-mail
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="financeiro@empresa.com"
            />
          </label>
        </div>
        <label>
          Status
          <select
            value={String(form.active)}
            onChange={(e) =>
              setForm({ ...form, active: e.target.value === "true" })
            }
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </label>
        <div className="form-footer">
          <button type="button" className="button" onClick={close}>
            Cancelar
          </button>
          <SaveButton busy={busy} />
        </div>
      </form>
    </Modal>
  );
}

export function ChargeForm({
  charge,
  close,
  saved,
}: Actions & { charge?: Charge }) {
  const [customerName, setCustomerName] = useState(charge?.customer_name ?? "");
  const [form, setForm] = useState({
    customer_id: String(charge?.customer_id ?? ""),
    description: charge?.description ?? "",
    original_amount: String(charge?.original_amount ?? ""),
    monthly_interest_rate: String(charge?.monthly_interest_rate ?? 2),
    issued_at: charge?.issued_at ?? today(),
    due_at: charge?.due_at ?? today(),
  });
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.customer_id) {
      setError("Selecione um cliente na lista de resultados.");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await (charge
        ? put("/api/charges/" + charge.id, form)
        : post("/api/charges", form));
      saved(
        charge
          ? "Cobrança atualizada com sucesso."
          : "Cobrança criada com sucesso.",
      );
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={charge ? "Editar cobrança" : "Nova cobrança"}
      subtitle="Os juros serão calculados automaticamente após o vencimento."
      close={close}
    >
      <form onSubmit={submit} className="form">
        <ErrorBox error={error} />
        <div className="field-label">
          Cliente
          <CustomerPicker
            required
            activeOnly
            value={form.customer_id}
            name={customerName}
            onChange={(id, name) => {
              setForm({ ...form, customer_id: id });
              setCustomerName(name);
            }}
          />
        </div>
        <label>
          Descrição
          <textarea
            required
            rows={3}
            maxLength={500}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="O que está sendo cobrado?"
          />
        </label>
        <div className="form-grid">
          <label>
            Valor original (R$)
            <input
              type="number"
              required
              min="0.01"
              max="99999999.99"
              step="0.01"
              value={form.original_amount}
              onChange={(e) =>
                setForm({ ...form, original_amount: e.target.value })
              }
            />
          </label>
          <label>
            Juros mensais (%)
            <input
              type="number"
              required
              min="0"
              max="100"
              step="0.0001"
              value={form.monthly_interest_rate}
              onChange={(e) =>
                setForm({ ...form, monthly_interest_rate: e.target.value })
              }
            />
          </label>
          <label>
            Data de emissão
            <input
              type="date"
              required
              min="2000-01-01"
              max={today()}
              value={form.issued_at}
              onChange={(e) => setForm({ ...form, issued_at: e.target.value })}
            />
          </label>
          <label>
            Data de vencimento
            <input
              type="date"
              required
              min={form.issued_at}
              max="2100-12-31"
              value={form.due_at}
              onChange={(e) => setForm({ ...form, due_at: e.target.value })}
            />
          </label>
        </div>
        <div className="form-footer">
          <button type="button" className="button" onClick={close}>
            Cancelar
          </button>
          <SaveButton busy={busy} />
        </div>
      </form>
    </Modal>
  );
}

export function PaymentForm({
  charge,
  close,
  saved,
}: Actions & { charge: Charge }) {
  const [form, setForm] = useState({
    paid_at: today(),
    paid_amount: Number(charge.updated_amount).toFixed(2),
  });
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await post("/api/charges/" + charge.id + "/payment", form);
      saved("Pagamento registrado com sucesso.");
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Registrar pagamento"
      subtitle={charge.customer_name + " · Cobrança #" + charge.id}
      close={close}
    >
      <form onSubmit={submit} className="form">
        <div className="payment-summary">
          <span>{charge.description}</span>
          <strong>{money(charge.updated_amount)}</strong>
          <small>
            Valor atualizado hoje · vencimento em {date(charge.due_at)}
          </small>
        </div>
        <ErrorBox error={error} />
        <div className="form-grid">
          <label>
            Data do pagamento
            <input
              type="date"
              required
              min={charge.issued_at}
              max={today()}
              value={form.paid_at}
              onChange={(e) => setForm({ ...form, paid_at: e.target.value })}
            />
          </label>
          <label>
            Valor recebido (R$)
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.paid_amount}
              onChange={(e) =>
                setForm({ ...form, paid_amount: e.target.value })
              }
            />
          </label>
        </div>
        <p className="notice">
          O registro quita integralmente a cobrança, mesmo com desconto ou
          acréscimo. Os juros serão fixados na data informada. Esta operação não
          poderá ser desfeita pela interface.
        </p>
        <div className="form-footer">
          <button type="button" className="button" onClick={close}>
            Cancelar
          </button>
          <SaveButton busy={busy}>Confirmar pagamento</SaveButton>
        </div>
      </form>
    </Modal>
  );
}

export function ChargeDetails({
  charge,
  close,
  edit,
  pay,
}: {
  charge: Charge;
  close: () => void;
  edit: () => void;
  pay: () => void;
}) {
  return (
    <Modal
      title={"Cobrança #" + charge.id}
      subtitle={charge.customer_name}
      close={close}
    >
      <div className="form">
        <p className="detail-description">{charge.description}</p>
        <dl className="detail-grid">
          {[
            ["Emissão", date(charge.issued_at)],
            ["Vencimento", date(charge.due_at)],
            ["Valor original", money(charge.original_amount)],
            ["Juros mensais", Number(charge.monthly_interest_rate) + "%"],
            ["Juros calculados", money(charge.interest)],
            ["Valor atualizado", money(charge.updated_amount)],
            ["Pagamento", date(charge.paid_at)],
            ["Valor recebido", money(charge.paid_amount)],
          ].map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {charge.status !== "paid" && (
          <div className="form-footer">
            <button className="button" onClick={edit}>
              Editar cobrança
            </button>
            <button className="button primary" onClick={pay}>
              Registrar pagamento <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
