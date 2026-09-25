export type Money = string | number;
export type User = { id: number; name: string; email: string };
export type Customer = {
  id: number;
  name: string;
  document: string;
  email: string;
  active: boolean;
};
export type Charge = {
  id: number;
  customer_id: number;
  customer_name: string;
  description: string;
  original_amount: Money;
  monthly_interest_rate: Money;
  issued_at: string;
  due_at: string;
  paid_at: string | null;
  status: "paid" | "pending" | "overdue";
  interest: Money;
  updated_amount: Money;
  paid_amount: Money;
};
export type Page<T> = {
  data: T[];
  next_cursor: string | null;
  prev_cursor: string | null;
};
export type Totals = {
  count: number;
  original_amount: Money;
  interest: Money;
  updated_amount: Money;
  received_amount: Money;
  pending_amount: Money;
};
export type Filters = {
  start_date: string;
  end_date: string;
  date_field: string;
  customer_id: string;
  status: string;
  sort: string;
  direction: string;
};
export type Report = { rows: Page<Charge>; totals: Totals; as_of: string };
export type Export = {
  id: string;
  format: "csv" | "pdf";
  status: "queued" | "processing" | "completed" | "failed" | "expired";
  processed_rows: number;
  totals: Totals | null;
  created_at: string;
  expires_at: string;
  error: string | null;
};
