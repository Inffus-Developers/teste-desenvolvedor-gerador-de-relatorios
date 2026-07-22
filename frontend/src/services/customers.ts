import { apiRequest } from './api'
import type { Customer, CustomerPage, CustomerPayload, CustomerStatus } from '../types/customer'

export type CustomerQuery = {
  page?: number
  per_page?: number
  search?: string
  status?: CustomerStatus | ''
  sort?: 'name' | 'document' | 'email' | 'status' | 'created_at'
  direction?: 'asc' | 'desc'
}

export function listCustomers(query: CustomerQuery = {}) {
  const parameters = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      parameters.set(key, String(value))
    }
  })

  const suffix = parameters.size > 0 ? `?${parameters.toString()}` : ''
  return apiRequest<CustomerPage>(`/customers${suffix}`)
}

export function getCustomer(id: number) {
  return apiRequest<{ data: Customer }>(`/customers/${id}`)
}

export function createCustomer(payload: CustomerPayload) {
  return apiRequest<{ data: Customer }>('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCustomer(id: number, payload: CustomerPayload) {
  return apiRequest<{ data: Customer }>(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
