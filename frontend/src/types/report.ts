import { Billing } from './billing';
import { PaginatedResponse } from './customer';

export interface ReportSummary {
  total_count: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  overdue_amount: number;
  canceled_amount: number;
}

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  customer_id?: number | '';
  page?: number;
  per_page?: number;
}

export interface BillingReportResponse {
  summary: ReportSummary;
  report: PaginatedResponse<Billing>;
}