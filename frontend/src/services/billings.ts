import { apiRequest } from './api'
import type { Billing, BillingPage, BillingPayload, BillingStatus } from '../types/billing'

export type BillingQuery = {
  page?: number
  search?: string
  customer_id?: number
  status?: BillingStatus | ''
  sort?: 'issue_date' | 'due_date' | 'original_amount' | 'status' | 'created_at'
  direction?: 'asc' | 'desc'
}

export function listBillings(query: BillingQuery = {}) {
  const parameters = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') parameters.set(key, String(value))
  })

  const suffix = parameters.size ? `?${parameters.toString()}` : ''
  return apiRequest<BillingPage>(`/billings${suffix}`)
}

export function getBilling(id: number) {
  return apiRequest<{ data: Billing }>(`/billings/${id}`)
}

export function createBilling(payload: BillingPayload) {
  return apiRequest<{ data: Billing }>('/billings', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateBilling(id: number, payload: BillingPayload) {
  return apiRequest<{ data: Billing }>(`/billings/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function payBilling(id: number, paymentDate: string, paidAmount: string) {
  return apiRequest<{ data: Billing }>(`/billings/${id}/payment`, {
    method: 'POST',
    body: JSON.stringify({ payment_date: paymentDate, paid_amount: paidAmount }),
  })
}
