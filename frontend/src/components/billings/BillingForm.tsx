import { type FormEvent, useEffect, useState } from 'react'
import { ApiError } from '../../services/api'
import { createBilling, updateBilling } from '../../services/billings'
import { listCustomers } from '../../services/customers'
import type { Billing, BillingPayload } from '../../types/billing'
import type { Customer } from '../../types/customer'

type Props = {
  billing?: Billing
  onCancel: () => void
  onSaved: (message: string) => void
}

function emptyBilling(): BillingPayload {
  const today = new Date().toISOString().slice(0, 10)
  return { customer_id: 0, description: '', original_amount: '', issue_date: today, due_date: today, monthly_interest_rate: '0', status: 'pending' }
}

export function BillingForm({ billing, onCancel, onSaved }: Props) {
  const [form, setForm] = useState<BillingPayload>(billing ? {
    customer_id: billing.customer.id,
    description: billing.description,
    original_amount: billing.original_amount,
    issue_date: billing.issue_date,
    due_date: billing.due_date,
    monthly_interest_rate: billing.monthly_interest_rate,
    status: 'pending',
  } : emptyBilling())
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    listCustomers({ per_page: 100, sort: 'name', status: 'active' })
      .then((response) => setCustomers(response.data))
      .catch(() => setGeneralError('Não foi possível carregar os clientes ativos.'))
  }, [])

  function updateField<Key extends keyof BillingPayload>(key: Key, value: BillingPayload[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: [] }))
  }

  async function searchCustomers() {
    setGeneralError('')
    try {
      const response = await listCustomers({ per_page: 100, sort: 'name', status: 'active', search: customerSearch || undefined })
      setCustomers(response.data)
    } catch {
      setGeneralError('Não foi possível buscar os clientes ativos.')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setGeneralError('')

    try {
      if (billing) await updateBilling(billing.id, form)
      else await createBilling(form)
      onSaved(billing ? 'Cobrança atualizada com sucesso.' : 'Cobrança cadastrada com sucesso.')
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setErrors(requestError.errors)
        setGeneralError(Object.keys(requestError.errors).length ? '' : requestError.message)
      } else setGeneralError('Não foi possível conectar ao servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <div className="panel__heading"><div><span className="eyebrow">Cobranças</span><h2>{billing ? 'Editar cobrança' : 'Cadastrar cobrança'}</h2></div><button className="button button--secondary" onClick={onCancel}>Voltar</button></div>
      {generalError && <div className="alert alert--error" role="alert">{generalError}</div>}
      <form className="entity-form" onSubmit={handleSubmit}>
        <label className="field field--wide">Cliente
          <span className="customer-picker">
            <input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void searchCustomers() } }} placeholder="Buscar por nome, documento ou e-mail" aria-label="Buscar cliente para cobrança" />
            <button className="button button--secondary" type="button" onClick={() => void searchCustomers()}>Buscar clientes</button>
          </span>
          <select value={form.customer_id} onChange={(event) => updateField('customer_id', Number(event.target.value))} required>
            <option value={0}>Selecione um cliente</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>{errors.customer_id?.[0] && <span className="field__error">{errors.customer_id[0]}</span>}
        </label>
        <label className="field field--wide">Descrição<input value={form.description} onChange={(event) => updateField('description', event.target.value)} required />{errors.description?.[0] && <span className="field__error">{errors.description[0]}</span>}</label>
        <label className="field">Valor original (R$)<input type="number" min="0.01" step="0.01" value={form.original_amount} onChange={(event) => updateField('original_amount', event.target.value)} required />{errors.original_amount?.[0] && <span className="field__error">{errors.original_amount[0]}</span>}</label>
        <label className="field">Juros ao mês (%)<input type="number" min="0" max="100" step="0.0001" value={form.monthly_interest_rate} onChange={(event) => updateField('monthly_interest_rate', event.target.value)} required />{errors.monthly_interest_rate?.[0] && <span className="field__error">{errors.monthly_interest_rate[0]}</span>}</label>
        <label className="field">Data de emissão<input type="date" value={form.issue_date} onChange={(event) => updateField('issue_date', event.target.value)} required />{errors.issue_date?.[0] && <span className="field__error">{errors.issue_date[0]}</span>}</label>
        <label className="field">Data de vencimento<input type="date" value={form.due_date} onChange={(event) => updateField('due_date', event.target.value)} required />{errors.due_date?.[0] && <span className="field__error">{errors.due_date[0]}</span>}</label>
        <div className="form-actions"><button className="button button--secondary" type="button" onClick={onCancel}>Cancelar</button><button className="button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar cobrança'}</button></div>
      </form>
    </section>
  )
}
