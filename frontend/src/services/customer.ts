import { apiFetch } from '@/services/api';
import { Customer, CustomerFilters, PaginatedResponse } from '@/types/customer';

export interface CustomerPayload {
  name: string;
  document: string;
  email: string;
  status: 'active' | 'inactive';
}

export interface CustomerOption {
  id: number;
  name: string;
  document: string;
}

export const customerService = {
  async list(filters: CustomerFilters = {}): Promise<PaginatedResponse<Customer>> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.per_page) params.append('per_page', String(filters.per_page));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/customers${queryString}`, { method: 'GET' });
  },

  async getById(id: number): Promise<{ data: Customer }> {
    return apiFetch(`/customers/${id}`, { method: 'GET' });
  },

  async create(payload: CustomerPayload): Promise<{ data: Customer; message: string }> {
    return apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id: number, payload: CustomerPayload): Promise<{ data: Customer; message: string }> {
    return apiFetch(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id: number): Promise<{ message: string }> {
    return apiFetch(`/customers/${id}`, { method: 'DELETE' });
  },

  async getActiveOptions(search = ''): Promise<CustomerOption[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiFetch(`/customers/active-options${query}`, { method: 'GET' });
  },
};