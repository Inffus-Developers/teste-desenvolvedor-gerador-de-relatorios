import { type FormEvent, useState } from 'react'
import { ApiError } from '../../services/api'
import { payBilling } from '../../services/billings'
import type { Billing } from '../../types/billing'

export function PaymentForm({ billing, onCancel, onPaid }: { billing: Billing; onCancel: () => void; onPaid: (message: string) => void }) {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [paidAmount, setPaidAmount] = useState(billing.updated_amount)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      await payBilling(billing.id, paymentDate, paidAmount)
      onPaid('Pagamento registrado com sucesso.')
    } catch (requestError) {
      if (requestError instanceof ApiError) setError(requestError.errors.payment_date?.[0] ?? requestError.errors.billing?.[0] ?? requestError.message)
      else setError('Não foi possível registrar o pagamento.')
    } finally { setIsSubmitting(false) }
  }

  return (
    <section className="panel">
      <div className="panel__heading"><div><span className="eyebrow">Pagamento</span><h2>{billing.description}</h2><p>Valor atualizado hoje: {money(billing.updated_amount)}</p></div><button className="button button--secondary" onClick={onCancel}>Voltar</button></div>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      <form className="entity-form" onSubmit={handleSubmit}>
        <label className="field">Data do pagamento<input type="date" max={new Date().toISOString().slice(0, 10)} value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} required /></label>
        <label className="field">Valor efetivamente pago (R$)<input type="number" min="0.01" step="0.01" value={paidAmount} onChange={(event) => setPaidAmount(event.target.value)} required /></label>
        <div className="form-actions"><button className="button button--secondary" type="button" onClick={onCancel}>Cancelar</button><button className="button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Registrando...' : 'Confirmar pagamento'}</button></div>
      </form>
    </section>
  )
}

function money(value: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
}
