import { type FormEvent, useState } from 'react'
import { ApiError } from '../../services/api'
import { createCustomer, updateCustomer } from '../../services/customers'
import type { Customer, CustomerPayload } from '../../types/customer'

type CustomerFormProps = {
  customer?: Customer
  onCancel: () => void
  onSaved: (customer: Customer, message: string) => void
}

const emptyCustomer: CustomerPayload = {
  name: '',
  document: '',
  email: '',
  status: 'active',
}

export function CustomerForm({ customer, onCancel, onSaved }: CustomerFormProps) {
  const [form, setForm] = useState<CustomerPayload>(customer ?? emptyCustomer)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField<Key extends keyof CustomerPayload>(key: Key, value: CustomerPayload[Key]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: [] }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    setGeneralError('')

    try {
      const response = customer
        ? await updateCustomer(customer.id, form)
        : await createCustomer(form)
      onSaved(response.data, customer ? 'Cliente atualizado com sucesso.' : 'Cliente cadastrado com sucesso.')
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setErrors(requestError.errors)
        setGeneralError(Object.keys(requestError.errors).length ? '' : requestError.message)
      } else {
        setGeneralError('Não foi possível conectar ao servidor.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="panel">
      <div className="panel__heading">
        <div>
          <span className="eyebrow">Clientes</span>
          <h2>{customer ? 'Editar cliente' : 'Cadastrar cliente'}</h2>
        </div>
        <button className="button button--secondary" type="button" onClick={onCancel}>Voltar</button>
      </div>

      {generalError && <div className="alert alert--error" role="alert">{generalError}</div>}

      <form className="entity-form" onSubmit={handleSubmit}>
        <label className="field field--wide">
          Nome
          <input value={form.name} onChange={(event) => updateField('name', event.target.value)} required />
          {errors.name?.[0] && <span className="field__error">{errors.name[0]}</span>}
        </label>

        <label className="field">
          Documento
          <input value={form.document} onChange={(event) => updateField('document', event.target.value)} required />
          {errors.document?.[0] && <span className="field__error">{errors.document[0]}</span>}
        </label>

        <label className="field">
          E-mail
          <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
          {errors.email?.[0] && <span className="field__error">{errors.email[0]}</span>}
        </label>

        <label className="field">
          Status
          <select value={form.status} onChange={(event) => updateField('status', event.target.value as CustomerPayload['status'])}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
          {errors.status?.[0] && <span className="field__error">{errors.status[0]}</span>}
        </label>

        <div className="form-actions">
          <button className="button button--secondary" type="button" onClick={onCancel}>Cancelar</button>
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar cliente'}
          </button>
        </div>
      </form>
    </section>
  )
}
