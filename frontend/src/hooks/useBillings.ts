'use client';

import { useState, useEffect, useCallback } from 'react';
import { billingService, BillingPayload } from '@/services/billing';
import { customerService } from '@/services/customer';
import { Billing, BillingFilters, BillingStatus } from '@/types/billing';
import { Customer, PaginatedResponse } from '@/types/customer';

export function useBillings() {
  const [data, setData] = useState<PaginatedResponse<Billing> | null>(null);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);

  const [filters, setFilters] = useState<BillingFilters>({
    search: '',
    status: '',
    customer_id: '',
    page: 1,
    per_page: 10,
  });

  const fetchBillings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await billingService.list(filters);
      setData(response);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar cobranças.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  // Carrega clientes para o dropdown de vinculação
  useEffect(() => {
    customerService.list({ per_page: 100 })
      .then((res) => setCustomersList(res.data))
      .catch(() => {});
  }, []);

  function handleSearchChange(search: string) {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  }

  function handleStatusChange(status: BillingStatus | '') {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }

  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  function openCreateModal() {
    setSelectedBilling(null);
    setIsFormOpen(true);
  }

  function openEditModal(billing: Billing) {
    setSelectedBilling(billing);
    setIsFormOpen(true);
  }

  function openDetailModal(billing: Billing) {
    setSelectedBilling(billing);
    setIsDetailOpen(true);
  }

  function closeModals() {
    setIsFormOpen(false);
    setIsDetailOpen(false);
    setSelectedBilling(null);
  }

  async function handleSave(payload: BillingPayload) {
    if (selectedBilling) {
      await billingService.update(selectedBilling.id, payload);
    } else {
      await billingService.create(payload);
    }
    closeModals();
    await fetchBillings();
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Confirma a remoção desta cobrança?')) return;
    try {
      await billingService.delete(id);
      fetchBillings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir cobrança.');
    }
  }

  return {
    billings: data?.data || [],
    customersList,
    pagination: {
      currentPage: data?.current_page || 1,
      lastPage: data?.last_page || 1,
      total: data?.total || 0,
      from: data?.from || 0,
      to: data?.to || 0,
    },
    filters,
    loading,
    error,
    modals: {
      isFormOpen,
      isDetailOpen,
      selectedBilling,
    },
    actions: {
      handleSearchChange,
      handleStatusChange,
      handlePageChange,
      handleDelete,
      handleSave,
      openCreateModal,
      openEditModal,
      openDetailModal,
      closeModals,
      refresh: fetchBillings,
    },
  };
}