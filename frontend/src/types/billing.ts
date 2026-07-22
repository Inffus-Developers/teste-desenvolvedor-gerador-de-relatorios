export type BillingStatus = 'pending' | 'overdue' | 'paid'

export type Billing = {
  id: number
  customer: { id: number; name: string }
  description: string
  original_amount: string
  issue_date: string
  due_date: string
  payment_date: string | null
  monthly_interest_rate: string
  status: BillingStatus
  stored_status: 'pending' | 'paid'
  days_overdue: number
  interest_amount: string
  updated_amount: string
  paid_amount: string | null
  interest_paid: string | null
  created_at: string
  updated_at: string
}

export type BillingPayload = {
  customer_id: number
  description: string
  original_amount: string
  issue_date: string
  due_date: string
  monthly_interest_rate: string
  status: 'pending'
}

export type BillingPage = {
  data: Billing[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
