export interface Customer {
  id: number;
  name: string;
  document: string;
  email: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CustomerFilters {
  search?: string;
  status?: 'active' | 'inactive' | '';
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}