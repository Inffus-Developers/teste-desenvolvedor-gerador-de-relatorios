import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../../services/api'
import { getBilling, listBillings, type BillingQuery } from '../../services/billings'
import type { Billing, BillingPage, BillingStatus } from '../../types/billing'
import { BillingForm } from './BillingForm'
import { PaymentForm } from './PaymentForm'

type View = 'list' | 'create' | 'detail' | 'edit' | 'payment'
const initialPage: BillingPage = { data: [], meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 } }

export function BillingModule() {
  const [view, setView] = useState<View>('list')
  const [page, setPage] = useState<BillingPage>(initialPage)
  const [selected, setSelected] = useState<Billing | null>(null)
  const [query, setQuery] = useState<BillingQuery>({ page: 1, sort: 'due_date', direction: 'desc' })
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true); setError('')
    try { setPage(await listBillings(query)) }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível carregar as cobranças.') }
    finally { setIsLoading(false) }
  }, [query])

  useEffect(() => { if (view === 'list') void load() }, [load, view])

  async function open(billing: Billing, target: 'detail' | 'edit' | 'payment') {
    setIsLoading(true); setError('')
    try { const response = await getBilling(billing.id); setSelected(response.data); setView(target) }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível carregar a cobrança.') }
    finally { setIsLoading(false) }
  }

  function back(message = '') { setFeedback(message); setSelected(null); setView('list') }
  function searchList() { setQuery((current) => ({ ...current, page: 1, search })) }

  if (view === 'create' || (view === 'edit' && selected)) return <BillingForm billing={view === 'edit' ? selected ?? undefined : undefined} onCancel={() => back()} onSaved={back} />
  if (view === 'payment' && selected) return <PaymentForm billing={selected} onCancel={() => setView('detail')} onPaid={back} />

  if (view === 'detail' && selected) return (
    <section className="panel">
      <div className="panel__heading"><div><span className="eyebrow">Cobrança</span><h2>{selected.description}</h2><p>{selected.customer.name}</p></div><div className="inline-actions"><button className="button button--secondary" onClick={() => back()}>Voltar</button>{selected.status !== 'paid' && <><button className="button button--secondary" onClick={() => setView('edit')}>Editar</button><button className="button" onClick={() => setView('payment')}>Registrar pagamento</button></>}</div></div>
      <dl className="detail-grid">
        <Detail label="Valor original" value={money(selected.original_amount)} /><Detail label="Juros calculados" value={money(selected.interest_amount)} /><Detail label="Valor atualizado" value={money(selected.updated_amount)} /><Detail label="Taxa mensal" value={`${Number(selected.monthly_interest_rate).toLocaleString('pt-BR')}%`} /><Detail label="Emissão" value={date(selected.issue_date)} /><Detail label="Vencimento" value={date(selected.due_date)} /><Detail label="Status" value={statusLabel(selected.status)} /><Detail label="Dias em atraso" value={String(selected.days_overdue)} />
        {selected.payment_date && <><Detail label="Data do pagamento" value={date(selected.payment_date)} /><Detail label="Valor pago" value={money(selected.paid_amount ?? '0')} /><Detail label="Juros no pagamento" value={money(selected.interest_paid ?? '0')} /></>}
      </dl>
    </section>
  )

  return (
    <section className="panel">
      <div className="panel__heading"><div><span className="eyebrow">Gestão</span><h2>Cobranças</h2><p>{page.meta.total} cobrança(s) encontrada(s)</p></div><button className="button" onClick={() => { setFeedback(''); setView('create') }}>Nova cobrança</button></div>
      {feedback && <div className="alert alert--success" role="status">{feedback}</div>}{error && <div className="alert alert--error" role="alert">{error}</div>}
      <div className="filters"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') searchList() }} placeholder="Buscar pela descrição" aria-label="Buscar cobranças" /><select value={query.status ?? ''} onChange={(event) => setQuery((current) => ({ ...current, page: 1, status: event.target.value as BillingStatus | '' }))}><option value="">Todos os status</option><option value="pending">Pendentes</option><option value="overdue">Vencidas</option><option value="paid">Pagas</option></select><button className="button button--secondary" onClick={searchList}>Buscar</button></div>
      {isLoading ? <div className="empty-state" role="status">Carregando cobranças...</div> : page.data.length === 0 ? <div className="empty-state">Nenhuma cobrança encontrada.</div> : <div className="table-scroll"><table><thead><tr><th>Cliente</th><th>Descrição</th><th>Vencimento</th><th>Status</th><th>Original</th><th>Atualizado</th><th>Ações</th></tr></thead><tbody>{page.data.map((billing) => <tr key={billing.id}><td>{billing.customer.name}</td><td><strong>{billing.description}</strong></td><td>{date(billing.due_date)}</td><td><span className={`status status--${billing.status}`}>{statusLabel(billing.status)}</span></td><td>{money(billing.original_amount)}</td><td>{money(billing.updated_amount)}</td><td><div className="table-actions"><button onClick={() => void open(billing, 'detail')}>Ver</button>{billing.status !== 'paid' && <><button onClick={() => void open(billing, 'edit')}>Editar</button><button onClick={() => void open(billing, 'payment')}>Pagar</button></>}</div></td></tr>)}</tbody></table></div>}
      <div className="pagination"><button className="button button--secondary" disabled={page.meta.current_page <= 1 || isLoading} onClick={() => setQuery((current) => ({ ...current, page: (current.page ?? 1) - 1 }))}>Anterior</button><span>Página {page.meta.current_page} de {page.meta.last_page}</span><button className="button button--secondary" disabled={page.meta.current_page >= page.meta.last_page || isLoading} onClick={() => setQuery((current) => ({ ...current, page: (current.page ?? 1) + 1 }))}>Próxima</button></div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div> }
function money(value: string) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)) }
function date(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') }
function statusLabel(status: BillingStatus) { return { pending: 'Pendente', overdue: 'Vencida', paid: 'Paga' }[status] }
