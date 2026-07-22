import { apiDownload, apiRequest } from './api'
import type { BillingReport, ReportFilters } from '../types/report'

export function getBillingReport(filters: ReportFilters) {
  return apiRequest<BillingReport>(`/reports/billings?${reportParameters(filters)}`)
}

export function exportBillingReport(format: 'csv' | 'pdf', filters: ReportFilters) {
  return apiDownload(`/reports/billings/export/${format}?${reportParameters(filters)}`)
}

function reportParameters(filters: ReportFilters) {
  const parameters = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') parameters.set(key, String(value))
  })

  return parameters.toString()
}
