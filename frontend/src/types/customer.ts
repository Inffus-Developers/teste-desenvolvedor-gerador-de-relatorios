export type CustomerStatus = 'active' | 'inactive'

export type Customer = {
  id: number
  name: string
  document: string
  email: string
  status: CustomerStatus
  created_at: string
  updated_at: string
}

export type CustomerPayload = Pick<Customer, 'name' | 'document' | 'email' | 'status'>

export type CustomerPage = {
  data: Customer[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
