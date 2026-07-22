import type { Billing, BillingStatus } from './billing'

export type PeriodBasis = 'issue_date' | 'due_date' | 'payment_date'

export type ReportFilters = {
  date_from: string
  date_to: string
  period_basis: PeriodBasis
  customer_id?: number
  status?: BillingStatus | ''
  sort?: 'issue_date' | 'due_date' | 'payment_date' | 'original_amount' | 'status' | 'created_at'
  direction?: 'asc' | 'desc'
  page?: number
}

export type ReportTotals = {
  count: number
  original_total: number
  interest_total: number
  updated_total: number
  received_total: number
  pending_total: number
}

export type BillingReport = {
  data: Billing[]
  totals: ReportTotals
  filters: Pick<ReportFilters, 'date_from' | 'date_to' | 'period_basis' | 'customer_id' | 'status'>
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
