import { useEffect, useState } from 'react'
import { ApiError } from '../../services/api'
import { getCustomer, listCustomers, type CustomerQuery } from '../../services/customers'
import type { Customer, CustomerPage, CustomerStatus } from '../../types/customer'
import { CustomerForm } from './CustomerForm'

type View = 'list' | 'create' | 'detail' | 'edit'

const initialPage: CustomerPage = {
  data: [],
  meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
}

export function CustomerModule() {
  const [view, setView] = useState<View>('list')
  const [page, setPage] = useState<CustomerPage>(initialPage)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [query, setQuery] = useState<CustomerQuery>({ page: 1, sort: 'name', direction: 'asc' })
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (view !== 'list') return undefined

    let ignore = false
    listCustomers(query)
      .then((response) => { if (!ignore) setPage(response) })
      .catch((requestError) => { if (!ignore) setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível carregar os clientes.') })
      .finally(() => { if (!ignore) setIsLoading(false) })

    return () => { ignore = true }
  }, [query, view])

  async function openCustomer(customer: Customer, targetView: 'detail' | 'edit') {
    setIsLoading(true)
    setError('')

    try {
      const response = await getCustomer(customer.id)
      setSelectedCustomer(response.data)
      setView(targetView)
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Não foi possível carregar o cliente.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearch() {
    setIsLoading(true)
    setError('')
    setQuery((current) => ({ ...current, page: 1, search }))
  }

  function handleSort(sort: CustomerQuery['sort']) {
    setIsLoading(true)
    setError('')
    setQuery((current) => ({
      ...current,
      page: 1,
      sort,
      direction: current.sort === sort && current.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  function returnToList(message = '') {
    setFeedback(message)
    setIsLoading(true)
    setError('')
    setView('list')
    setSelectedCustomer(null)
  }

  if (view === 'create' || (view === 'edit' && selectedCustomer)) {
    return <CustomerForm customer={view === 'edit' ? selectedCustomer ?? undefined : undefined} onCancel={() => returnToList()} onSaved={(_, message) => returnToList(message)} />
  }

  if (view === 'detail' && selectedCustomer) {
    return (
      <section className="panel">
        <div className="panel__heading">
          <div><span className="eyebrow">Cliente</span><h2>{selectedCustomer.name}</h2></div>
          <div className="inline-actions">
            <button className="button button--secondary" onClick={() => returnToList()}>Voltar</button>
            <button className="button" onClick={() => setView('edit')}>Editar</button>
          </div>
        </div>
        <dl className="detail-grid">
          <div><dt>Documento</dt><dd>{selectedCustomer.document}</dd></div>
          <div><dt>E-mail</dt><dd>{selectedCustomer.email}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge status={selectedCustomer.status} /></dd></div>
          <div><dt>Cadastrado em</dt><dd>{new Date(selectedCustomer.created_at).toLocaleDateString('pt-BR')}</dd></div>
        </dl>
      </section>
    )
  }

  return (
    <section className="panel">
      <div className="panel__heading">
        <div><span className="eyebrow">Gestão</span><h2>Clientes</h2><p>{page.meta.total} cliente(s) encontrado(s)</p></div>
        <button className="button" onClick={() => { setFeedback(''); setView('create') }}>Novo cliente</button>
      </div>

      {feedback && <div className="alert alert--success" role="status">{feedback}</div>}
      {error && <div className="alert alert--error" role="alert">{error}</div>}

      <div className="filters">
        <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') handleSearch() }} placeholder="Buscar por nome, documento ou e-mail" aria-label="Buscar clientes" />
        <select value={query.status ?? ''} onChange={(event) => { setIsLoading(true); setError(''); setQuery((current) => ({ ...current, page: 1, status: event.target.value as CustomerStatus | '' })) }} aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
        <button className="button button--secondary" onClick={handleSearch}>Buscar</button>
      </div>

      {isLoading ? <div className="empty-state" role="status">Carregando clientes...</div> : page.data.length === 0 ? <div className="empty-state">Nenhum cliente encontrado.</div> : (
        <div className="table-scroll">
          <table>
            <thead><tr>
              <SortableHeader label="Nome" onClick={() => handleSort('name')} />
              <SortableHeader label="Documento" onClick={() => handleSort('document')} />
              <SortableHeader label="E-mail" onClick={() => handleSort('email')} />
              <SortableHeader label="Status" onClick={() => handleSort('status')} />
              <th>Ações</th>
            </tr></thead>
            <tbody>{page.data.map((customer) => (
              <tr key={customer.id}>
                <td><strong>{customer.name}</strong></td><td>{customer.document}</td><td>{customer.email}</td><td><StatusBadge status={customer.status} /></td>
                <td><div className="table-actions"><button onClick={() => void openCustomer(customer, 'detail')}>Ver</button><button onClick={() => void openCustomer(customer, 'edit')}>Editar</button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <div className="pagination">
        <button className="button button--secondary" disabled={page.meta.current_page <= 1 || isLoading} onClick={() => { setIsLoading(true); setError(''); setQuery((current) => ({ ...current, page: (current.page ?? 1) - 1 })) }}>Anterior</button>
        <span>Página {page.meta.current_page} de {page.meta.last_page}</span>
        <button className="button button--secondary" disabled={page.meta.current_page >= page.meta.last_page || isLoading} onClick={() => { setIsLoading(true); setError(''); setQuery((current) => ({ ...current, page: (current.page ?? 1) + 1 })) }}>Próxima</button>
      </div>
    </section>
  )
}

function StatusBadge({ status }: { status: CustomerStatus }) {
  return <span className={`status status--${status}`}>{status === 'active' ? 'Ativo' : 'Inativo'}</span>
}

function SortableHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return <th><button className="sort-button" onClick={onClick}>{label} ↕</button></th>
}
