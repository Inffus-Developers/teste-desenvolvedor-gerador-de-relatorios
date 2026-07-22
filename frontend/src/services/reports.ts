import { apiRequest } from './api'
import type { BillingReport, ReportFilters } from '../types/report'

export function getBillingReport(filters: ReportFilters) {
  const parameters = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') parameters.set(key, String(value))
  })

  return apiRequest<BillingReport>(`/reports/billings?${parameters.toString()}`)
}
