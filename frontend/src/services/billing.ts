import { apiFetch } from '@/services/api';
import { Billing, BillingFilters } from '@/types/billing';
import { PaginatedResponse } from '@/types/customer';

export interface BillingPayload {
  customer_id: number;
  description: string;
  original_amount: number;
  issue_date: string;
  due_date: string;
  payment_date?: string | null;
  interest_rate: number;
  status: Billing['status'];
}

export const billingService = {
  async list(filters: BillingFilters = {}): Promise<PaginatedResponse<Billing>> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.customer_id) params.append('customer_id', String(filters.customer_id));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.per_page) params.append('per_page', String(filters.per_page));

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiFetch(`/billings${queryString}`, { method: 'GET' });
  },

  async create(payload: BillingPayload): Promise<{ data: Billing; message: string }> {
    return apiFetch('/billings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async update(id: number, payload: BillingPayload): Promise<{ data: Billing; message: string }> {
    return apiFetch(`/billings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async delete(id: number): Promise<{ message: string }> {
    return apiFetch(`/billings/${id}`, { method: 'DELETE' });
  },
};