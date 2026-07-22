import { type FormEvent, useEffect, useState } from 'react'
import { ApiError } from '../../services/api'
import { listCustomers } from '../../services/customers'
import { exportBillingReport, getBillingReport } from '../../services/reports'
import type { BillingStatus } from '../../types/billing'
import type { Customer } from '../../types/customer'
import type { BillingReport, PeriodBasis, ReportFilters } from '../../types/report'

const emptyReport: BillingReport = {
  data: [],
  totals: { count: 0, original_total: 0, interest_total: 0, updated_total: 0, received_total: 0, pending_total: 0 },
  filters: { date_from: '', date_to: '', period_basis: 'issue_date' },
  meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
}

function initialFilters(): ReportFilters {
  const now = new Date()
  const today = localDate(now)
  return { date_from: `${today.slice(0, 8)}01`, date_to: today, period_basis: 'issue_date', sort: 'due_date', direction: 'desc', page: 1 }
}

export function BillingReportModule() {
  const [draft, setDraft] = useState<ReportFilters>(initialFilters)
  const [applied, setApplied] = useState<ReportFilters>(initialFilters)
  const [report, setReport] = useState<BillingReport>(emptyReport)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null)

  useEffect(() => {
    let ignore = false
    getBillingReport(applied)
      .then((response) => { if (!ignore) setReport(response) })
      .catch((requestError) => { if (!ignore) setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível carregar o relatório.') })
      .finally(() => { if (!ignore) setIsLoading(false) })

    return () => { ignore = true }
  }, [applied])
  useEffect(() => { listCustomers({ per_page: 100, sort: 'name' }).then((response) => setCustomers(response.data)).catch(() => setCustomers([])) }, [])

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setApplied({ ...draft, page: 1 })
  }

  function sortBy(sort: ReportFilters['sort']) {
    setIsLoading(true)
    setError('')
    setApplied((current) => ({ ...current, page: 1, sort, direction: current.sort === sort && current.direction === 'asc' ? 'desc' : 'asc' }))
  }

  async function searchCustomers() {
    setError('')
    try {
      const response = await listCustomers({ per_page: 100, sort: 'name', search: customerSearch || undefined })
      setCustomers(response.data)
    } catch {
      setError('Não foi possível buscar os clientes.')
    }
  }

  async function download(format: 'csv' | 'pdf') {
    setIsExporting(format)
    setError('')
    try {
      const { blob, filename } = await exportBillingReport(format, applied)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível exportar o relatório.')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <section className="panel report-panel">
      <div className="panel__heading"><div><span className="eyebrow">Análise</span><h2>Relatório de faturamento</h2><p>Valores calculados para o período e os filtros selecionados.</p></div><div className="report-actions"><button className="button button--secondary" disabled={isExporting !== null || isLoading} onClick={() => void download('csv')}>{isExporting === 'csv' ? 'Gerando CSV...' : 'Exportar CSV'}</button><button className="button" disabled={isExporting !== null || isLoading} onClick={() => void download('pdf')}>{isExporting === 'pdf' ? 'Gerando PDF...' : 'Exportar PDF'}</button></div></div>

      <form className="report-filters" onSubmit={applyFilters}>
        <label className="field">Data inicial<input type="date" value={draft.date_from} onChange={(event) => setDraft((current) => ({ ...current, date_from: event.target.value }))} required /></label>
        <label className="field">Data final<input type="date" value={draft.date_to} onChange={(event) => setDraft((current) => ({ ...current, date_to: event.target.value }))} required /></label>
        <label className="field">Período baseado em<select value={draft.period_basis} onChange={(event) => setDraft((current) => ({ ...current, period_basis: event.target.value as PeriodBasis }))}><option value="issue_date">Data de emissão</option><option value="due_date">Data de vencimento</option><option value="payment_date">Data de pagamento</option></select></label>
        <label className="field field--wide">Cliente<span className="customer-picker"><input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void searchCustomers() } }} placeholder="Buscar cliente" aria-label="Buscar cliente no relatório" /><button className="button button--secondary" type="button" onClick={() => void searchCustomers()}>Buscar clientes</button></span><select value={draft.customer_id ?? ''} onChange={(event) => setDraft((current) => ({ ...current, customer_id: event.target.value ? Number(event.target.value) : undefined }))}><option value="">Todos os clientes</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
        <label className="field">Status<select value={draft.status ?? ''} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as BillingStatus | '' }))}><option value="">Todos os status</option><option value="pending">Pendente</option><option value="overdue">Vencida</option><option value="paid">Paga</option></select></label>
        <button className="button report-filter-button" type="submit" disabled={isLoading}>{isLoading ? 'Carregando...' : 'Aplicar filtros'}</button>
      </form>

      {error && <div className="alert alert--error" role="alert">{error}</div>}

      <div className="totals-grid" aria-label="Totalizadores do relatório">
        <Total label="Cobranças" value={String(report.totals.count)} />
        <Total label="Valor original" value={money(report.totals.original_total)} />
        <Total label="Juros" value={money(report.totals.interest_total)} />
        <Total label="Valor atualizado" value={money(report.totals.updated_total)} />
        <Total label="Total recebido" value={money(report.totals.received_total)} tone="positive" />
        <Total label="Total pendente" value={money(report.totals.pending_total)} tone="warning" />
      </div>

      {isLoading ? <div className="empty-state" role="status">Calculando relatório...</div> : report.data.length === 0 ? <div className="empty-state">Nenhuma cobrança encontrada no período.</div> : (
        <div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Descrição</th><Sortable label="Emissão" onClick={() => sortBy('issue_date')} /><Sortable label="Vencimento" onClick={() => sortBy('due_date')} /><Sortable label="Status" onClick={() => sortBy('status')} /><Sortable label="Original" onClick={() => sortBy('original_amount')} /><th>Juros</th><th>Atualizado</th><th>Pago</th></tr></thead><tbody>{report.data.map((billing) => <tr key={billing.id}><td>{billing.customer.name}</td><td>{billing.description}</td><td>{date(billing.issue_date)}</td><td>{date(billing.due_date)}</td><td><span className={`status status--${billing.status}`}>{statusLabel(billing.status)}</span></td><td>{money(Number(billing.original_amount))}</td><td>{money(Number(billing.interest_amount))}</td><td><strong>{money(Number(billing.updated_amount))}</strong></td><td>{money(Number(billing.paid_amount ?? 0))}</td></tr>)}</tbody></table></div>
      )}

      <div className="pagination"><button className="button button--secondary" disabled={report.meta.current_page <= 1 || isLoading} onClick={() => { setIsLoading(true); setError(''); setApplied((current) => ({ ...current, page: (current.page ?? 1) - 1 })) }}>Anterior</button><span>Página {report.meta.current_page} de {report.meta.last_page}</span><button className="button button--secondary" disabled={report.meta.current_page >= report.meta.last_page || isLoading} onClick={() => { setIsLoading(true); setError(''); setApplied((current) => ({ ...current, page: (current.page ?? 1) + 1 })) }}>Próxima</button></div>
    </section>
  )
}

function Total({ label, value, tone = '' }: { label: string; value: string; tone?: 'positive' | 'warning' | '' }) { return <div className={`total-card ${tone ? `total-card--${tone}` : ''}`}><span>{label}</span><strong>{value}</strong></div> }
function Sortable({ label, onClick }: { label: string; onClick: () => void }) { return <th><button className="sort-button" onClick={onClick}>{label} ↕</button></th> }
function money(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) }
function date(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') }
function localDate(value: Date) { const offset = value.getTimezoneOffset(); return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 10) }
function statusLabel(status: BillingStatus) { return { pending: 'Pendente', overdue: 'Vencida', paid: 'Paga' }[status] }
