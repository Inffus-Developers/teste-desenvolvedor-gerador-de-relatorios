import { useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Download,
  FileDown,
  FileSpreadsheet,
  Filter,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { post, query } from "./api";
import {
  Badge,
  CustomerPicker,
  Empty,
  ErrorBox,
  Loading,
  Modal,
  Pagination,
  SortHead,
  useApi,
} from "./components";
import { ChargeDetails, ChargeForm, CustomerForm, PaymentForm } from "./forms";
import { date, money, today } from "./format";
import type {
  Charge,
  Customer,
  Export,
  Filters,
  Page,
  Report,
  Totals,
} from "./types";

type PageProps = { notify: (message: string) => void };
const initialFilters = (report: boolean): Filters => {
  const current = today();
  const last = new Date(
    Number(current.slice(0, 4)),
    Number(current.slice(5, 7)),
    0,
  ).getDate();
  return {
    start_date: report ? current.slice(0, 8) + "01" : "",
    end_date: report ? current.slice(0, 8) + last : "",
    date_field: "due_at",
    customer_id: "",
    status: "",
    sort: "due_at",
    direction: "asc",
  };
};

function TotalsCards({ totals }: { totals: Totals }) {
  return (
    <div className="stat-grid">
      <article className="stat-card">
        <div className="stat-top">
          <span>Total atualizado</span>
          <Wallet size={18} />
        </div>
        <strong>{money(totals.updated_amount)}</strong>
        <small>
          {Number(totals.count).toLocaleString("pt-BR")} cobranças no período
        </small>
      </article>
      <article className="stat-card received">
        <div className="stat-top">
          <span>Total recebido</span>
          <ArrowDownLeft size={19} />
        </div>
        <strong>{money(totals.received_amount)}</strong>
        <small>Pagamentos efetivamente registrados</small>
      </article>
      <article className="stat-card">
        <div className="stat-top">
          <span>Total pendente</span>
          <ArrowUpRight size={19} />
        </div>
        <strong>{money(totals.pending_amount)}</strong>
        <small>Cobranças em aberto, com juros</small>
      </article>
      <article className="stat-card">
        <div className="stat-top">
          <span>Juros calculados</span>
          <Receipt size={18} />
        </div>
        <strong>{money(totals.interest)}</strong>
        <small>Original: {money(totals.original_amount)}</small>
      </article>
    </div>
  );
}

export function BillingPage({
  report,
  notify,
}: PageProps & { report: boolean }) {
  const [filters, setFilters] = useState<Filters>(() => initialFilters(report));
  const [draft, setDraft] = useState(filters);
  const [customerName, setCustomerName] = useState("");
  const [cursor, setCursor] = useState("");
  const [number, setNumber] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<Charge>();
  const [mode, setMode] = useState<"new" | "edit" | "pay" | "view">();
  const [error, setError] = useState<unknown>();
  const [exporting, setExporting] = useState(false);
  const {
    data,
    loading,
    error: loadError,
  } = useApi<Report | Page<Charge>>(
    "/api/" +
      (report ? "reports/billing" : "charges") +
      "?" +
      query({ ...filters, cursor, per_page: 15 }),
    refresh,
  );
  const page =
    data && "rows" in data ? data.rows : (data as Page<Charge> | undefined);
  const totals = data && "totals" in data ? data.totals : undefined;
  function resetPage() {
    setCursor("");
    setNumber(1);
  }
  function apply(e: FormEvent) {
    e.preventDefault();
    setFilters({ ...draft, sort: filters.sort, direction: filters.direction });
    resetPage();
  }
  function sort(field: string) {
    setFilters({
      ...filters,
      sort: field,
      direction:
        filters.sort === field && filters.direction === "asc" ? "desc" : "asc",
    });
    resetPage();
  }
  function saved(message: string) {
    setMode(undefined);
    setSelected(undefined);
    setRefresh((v) => v + 1);
    notify(message);
  }
  async function exportFile(format: "pdf" | "csv") {
    setExporting(true);
    setError(undefined);
    try {
      await post("/api/exports", { ...filters, format });
      notify("Exportação solicitada. Acompanhe o arquivo em Exportações.");
    } catch (e) {
      setError(e);
    } finally {
      setExporting(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            {report ? "SEU NEGÓCIO EM NÚMEROS" : "GESTÃO FINANCEIRA"}
          </div>
          <h1>{report ? "Relatório de faturamento" : "Cobranças"}</h1>
          <p>
            {report
              ? "Uma visão clara dos seus recebimentos, do início ao fim."
              : "Acompanhe cada cobrança e mantenha os recebimentos em dia."}
          </p>
        </div>
        <div className="heading-actions">
          {report ? (
            <>
              <button
                className="button"
                disabled={exporting || loading || !!loadError}
                onClick={() => exportFile("csv")}
              >
                <FileSpreadsheet size={16} /> CSV
              </button>
              <button
                className="button primary"
                disabled={exporting || loading || !!loadError}
                onClick={() => exportFile("pdf")}
              >
                <Download size={16} /> Exportar PDF
              </button>
            </>
          ) : (
            <button
              className="button primary"
              onClick={() => {
                setSelected(undefined);
                setMode("new");
              }}
            >
              <Plus size={17} /> Nova cobrança
            </button>
          )}
        </div>
      </div>
      <ErrorBox error={error || loadError} />
      <section className="filter-card">
        <div className="section-caption">
          <span>
            <SlidersHorizontal size={16} /> Filtrar{" "}
            {report ? "relatório" : "cobranças"}
          </span>
          <span className="muted">Encontre exatamente o que precisa</span>
        </div>
        <form className="filters" onSubmit={apply}>
          <label>
            Período baseado em
            <select
              value={draft.date_field}
              onChange={(e) =>
                setDraft({ ...draft, date_field: e.target.value })
              }
            >
              <option value="due_at">Data de vencimento</option>
              <option value="issued_at">Data de emissão</option>
              <option value="paid_at">Data de pagamento</option>
            </select>
          </label>
          <label>
            Data inicial
            <input
              type="date"
              required={!!draft.end_date}
              max={draft.end_date || undefined}
              value={draft.start_date}
              onChange={(e) =>
                setDraft({ ...draft, start_date: e.target.value })
              }
            />
          </label>
          <label>
            Data final
            <input
              type="date"
              required={!!draft.start_date}
              min={draft.start_date || undefined}
              value={draft.end_date}
              onChange={(e) => setDraft({ ...draft, end_date: e.target.value })}
            />
          </label>
          <div className="field-label">
            Cliente
            <CustomerPicker
              value={draft.customer_id}
              name={customerName}
              onChange={(id, name) => {
                setDraft({ ...draft, customer_id: id });
                setCustomerName(name);
              }}
            />
          </div>
          <label>
            Status
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="overdue">Vencida</option>
              <option value="paid">Paga</option>
            </select>
          </label>
          <button className="button primary filter-submit">
            <Filter size={15} /> Aplicar
          </button>
          <button
            type="button"
            className="text-button clear-filters"
            onClick={() => {
              const cleared = initialFilters(false);
              setDraft(cleared);
              setFilters(cleared);
              setCustomerName("");
              resetPage();
            }}
          >
            Limpar filtros
          </button>
        </form>
      </section>
      {loading && <Loading />}
      {totals && <TotalsCards totals={totals} />}
      <section className="table-card">
        <div className="table-heading">
          <div>
            <h2>
              {report ? "Detalhamento das cobranças" : "Todas as cobranças"}
              {totals && (
                <span className="count-pill">
                  {Number(totals.count).toLocaleString("pt-BR")}
                </span>
              )}
            </h2>
            <p>
              {filters.start_date
                ? `${date(filters.start_date)} — ${date(filters.end_date)}`
                : "Todos os períodos"}{" "}
              <span className="separator">/</span> Valores em reais (BRL)
            </p>
          </div>
          <button
            className="icon-button"
            aria-label="Atualizar cobranças"
            onClick={() => setRefresh((v) => v + 1)}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        {!loading && page?.data.length === 0 ? (
          <Empty>Tente ajustar os filtros ou cadastre uma nova cobrança.</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Cliente / descrição</th>
                  <SortHead
                    field="issued_at"
                    current={filters.sort}
                    direction={filters.direction}
                    onSort={sort}
                  >
                    Emissão
                  </SortHead>
                  <SortHead
                    field="due_at"
                    current={filters.sort}
                    direction={filters.direction}
                    onSort={sort}
                  >
                    Vencimento
                  </SortHead>
                  <th>Status</th>
                  <SortHead
                    field="original_amount"
                    current={filters.sort}
                    direction={filters.direction}
                    onSort={sort}
                  >
                    Original
                  </SortHead>
                  <th className="numeric">Juros</th>
                  <th className="numeric">Atualizado</th>
                  <th className="numeric">Pago</th>
                  <th>
                    <span className="sr-only">Detalhes</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {page?.data.map((charge) => (
                  <tr key={charge.id}>
                    <td>
                      <button
                        className="row-title"
                        onClick={() => {
                          setSelected(charge);
                          setMode("view");
                        }}
                      >
                        {charge.customer_name}
                      </button>
                      <span className="row-subtitle" title={charge.description}>
                        {charge.description}
                      </span>
                    </td>
                    <td className="date-cell">{date(charge.issued_at)}</td>
                    <td
                      className={
                        "date-cell " +
                        (charge.status === "overdue" ? "overdue-text" : "")
                      }
                    >
                      {date(charge.due_at)}
                    </td>
                    <td>
                      <Badge status={charge.status} />
                    </td>
                    <td className="numeric">{money(charge.original_amount)}</td>
                    <td className="numeric muted">{money(charge.interest)}</td>
                    <td className="numeric strong">
                      {money(charge.updated_amount)}
                    </td>
                    <td className="numeric">
                      {Number(charge.paid_amount)
                        ? money(charge.paid_amount)
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={"Detalhes da cobrança " + charge.id}
                        onClick={() => {
                          setSelected(charge);
                          setMode("view");
                        }}
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totals && (
          <div className="table-totals">
            <span>
              Total do período <strong>{totals.count} cobranças</strong>
            </span>
            <span>
              Original <strong>{money(totals.original_amount)}</strong>
            </span>
            <span>
              Juros <strong>{money(totals.interest)}</strong>
            </span>
            <span>
              Atualizado <strong>{money(totals.updated_amount)}</strong>
            </span>
            <span>
              Recebido <strong>{money(totals.received_amount)}</strong>
            </span>
            <span>
              Pendente <strong>{money(totals.pending_amount)}</strong>
            </span>
          </div>
        )}
        <Pagination
          page={page}
          number={number}
          onPage={(c, d) => {
            setCursor(c);
            setNumber((v) => v + d);
          }}
        />
      </section>
      <div className="page-footnote">
        <CheckCircle2 size={15} />
        <span>
          Juros calculados no backend. Cobranças pagas mantêm o valor registrado
          no pagamento.
        </span>
        <span className="footnote-date">
          <CalendarDays size={14} /> Referência:{" "}
          {date(data && "as_of" in data ? data.as_of : today())}
        </span>
      </div>
      {(mode === "new" || mode === "edit") && (
        <ChargeForm
          charge={mode === "edit" ? selected : undefined}
          close={() => setMode(undefined)}
          saved={saved}
        />
      )}
      {mode === "pay" && selected && (
        <PaymentForm
          charge={selected}
          close={() => setMode(undefined)}
          saved={saved}
        />
      )}
      {mode === "view" && selected && (
        <ChargeDetails
          charge={selected}
          close={() => setMode(undefined)}
          edit={() => setMode("edit")}
          pay={() => setMode("pay")}
        />
      )}
    </>
  );
}

export function CustomersPage({ notify }: PageProps) {
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [active, setActive] = useState("");
  const [sort, setSort] = useState("name");
  const [direction, setDirection] = useState("asc");
  const [cursor, setCursor] = useState("");
  const [number, setNumber] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<Customer>();
  const [mode, setMode] = useState<"new" | "edit" | "view">();
  const { data, loading, error } = useApi<Page<Customer>>(
    "/api/customers?" +
      query({ search: applied, active, sort, direction, cursor, per_page: 15 }),
    refresh,
  );
  function reset() {
    setCursor("");
    setNumber(1);
  }
  function changeSort(field: string) {
    setDirection(sort === field && direction === "asc" ? "desc" : "asc");
    setSort(field);
    reset();
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">RELAÇÕES QUE IMPORTAM</div>
          <h1>Clientes</h1>
          <p>Todos os seus clientes, organizados em um só lugar.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setSelected(undefined);
            setMode("new");
          }}
        >
          <Plus size={17} /> Novo cliente
        </button>
      </div>
      <section className="table-card">
        <div className="customer-toolbar">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(search);
              reset();
            }}
          >
            <div className="input-icon">
              <Search size={17} />
              <input
                aria-label="Buscar por nome ou documento"
                placeholder="Busque por nome ou documento…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="button" type="submit">
              Buscar
            </button>
          </form>
          <select
            aria-label="Status do cliente"
            value={active}
            onChange={(e) => {
              setActive(e.target.value);
              reset();
            }}
          >
            <option value="">Todos os clientes</option>
            <option value="1">Ativos</option>
            <option value="0">Inativos</option>
          </select>
        </div>
        <ErrorBox error={error} />
        {loading && <Loading />}
        {!loading && data?.data.length === 0 ? (
          <Empty>Cadastre um cliente para começar.</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <SortHead
                    field="name"
                    current={sort}
                    direction={direction}
                    onSort={changeSort}
                  >
                    Cliente
                  </SortHead>
                  <SortHead
                    field="document"
                    current={sort}
                    direction={direction}
                    onSort={changeSort}
                  >
                    Documento
                  </SortHead>
                  <th>E-mail</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <button
                        className="customer-name"
                        onClick={() => {
                          setSelected(c);
                          setMode("view");
                        }}
                      >
                        <span className="avatar" aria-hidden="true">
                          {c.name.slice(0, 2).toUpperCase()}
                        </span>
                        <strong>{c.name}</strong>
                      </button>
                    </td>
                    <td>{c.document}</td>
                    <td>{c.email}</td>
                    <td>
                      <span
                        className={"badge " + (c.active ? "paid" : "inactive")}
                      >
                        <i />
                        {c.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="text-button"
                        onClick={() => {
                          setSelected(c);
                          setMode("edit");
                        }}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          page={data}
          number={number}
          onPage={(c, d) => {
            setCursor(c);
            setNumber((v) => v + d);
          }}
        />
      </section>
      {(mode === "new" || mode === "edit") && (
        <CustomerForm
          customer={selected}
          close={() => setMode(undefined)}
          saved={(message) => {
            setMode(undefined);
            setRefresh((v) => v + 1);
            notify(message);
          }}
        />
      )}{" "}
      {mode === "view" && selected && (
        <Modal
          title={selected.name}
          subtitle="Dados do cliente"
          close={() => setMode(undefined)}
        >
          <div className="form">
            <dl className="detail-grid">
              <div>
                <dt>Documento</dt>
                <dd>{selected.document}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{selected.active ? "Ativo" : "Inativo"}</dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>{selected.email}</dd>
              </div>
            </dl>
            <div className="form-footer">
              <button
                className="button primary"
                onClick={() => setMode("edit")}
              >
                Editar cliente
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

export function ExportsPage({ tick }: { tick: number }) {
  const [refresh, setRefresh] = useState(0);
  const { data, loading, error } = useApi<Export[]>(
    "/api/exports",
    tick + refresh,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">SEUS DADOS, COM VOCÊ</div>
          <h1>Exportações</h1>
          <p>Acompanhe a geração e baixe seus relatórios.</p>
        </div>
        <button className="button" onClick={() => setRefresh((v) => v + 1)}>
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>
      <div className="notice export-notice">
        <FileDown size={20} />
        <span>
          Os arquivos ficam disponíveis por 24 horas. Relatórios PDF com mais de
          250 cobranças são divididos em partes dentro de um ZIP.
        </span>
      </div>
      <ErrorBox error={error} />
      {loading && !data && <Loading />}
      <section className="table-card">
        {!data?.length && !loading ? (
          <Empty>Gere um arquivo CSV ou PDF na página de relatórios.</Empty>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Solicitado em</th>
                  <th>Status</th>
                  <th>Progresso</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {data?.map((item) => {
                  const expired = new Date(item.expires_at) < new Date();
                  return (
                    <tr key={item.id} data-testid={"export-" + item.id}>
                      <td>
                        <div className="export-file">
                          <FileDown size={23} />
                          <div>
                            <strong>Relatório de faturamento</strong>
                            <span className="row-subtitle">
                              {item.format.toUpperCase()} · {item.id.slice(-8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {new Date(item.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td>
                        <span
                          className={
                            "badge " +
                            (item.status === "completed"
                              ? "paid"
                              : item.status === "failed"
                                ? "overdue"
                                : "pending")
                          }
                        >
                          <i />
                          {expired
                            ? "Expirado"
                            : {
                                queued: "Na fila",
                                processing: "Gerando",
                                completed: "Concluído",
                                failed: "Falhou",
                              }[item.status]}
                        </span>
                        {item.error && (
                          <small className="row-subtitle">{item.error}</small>
                        )}
                      </td>
                      <td>
                        {item.processed_rows.toLocaleString("pt-BR")}{" "}
                        {item.totals
                          ? "/ " +
                            Number(item.totals.count).toLocaleString("pt-BR")
                          : ""}{" "}
                        registros
                      </td>
                      <td>
                        {item.status === "completed" && !expired ? (
                          <a
                            className="button"
                            href={"/api/exports/" + item.id + "/download"}
                          >
                            <Download size={15} /> Baixar
                          </a>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="subtle-note">
        Mostrando as 20 exportações mais recentes. Atualização automática a cada
        5 segundos.
      </p>
    </>
  );
}
