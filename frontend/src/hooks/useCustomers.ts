'use client';

import { useState, useEffect, useCallback } from 'react';
import { customerService, CustomerPayload } from '@/services/customer';
import { Customer, CustomerFilters, PaginatedResponse } from '@/types/customer';

export function useCustomers() {
  const [data, setData] = useState<PaginatedResponse<Customer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados dos Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: '',
    page: 1,
    per_page: 10,
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await customerService.list(filters);
      setData(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar clientes.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function handleSearchChange(search: string) {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  }

  function handleStatusChange(status: 'active' | 'inactive' | '') {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }

  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }

  // Modais Handlers
  function openCreateModal() {
    setSelectedCustomer(null);
    setIsFormModalOpen(true);
  }

  function openEditModal(customer: Customer) {
    setSelectedCustomer(customer);
    setIsFormModalOpen(true);
  }

  function openDetailModal(customer: Customer) {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  }

  function closeModals() {
    setIsFormModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedCustomer(null);
  }

  async function handleSave(payload: CustomerPayload) {
    if (selectedCustomer) {
      await customerService.update(selectedCustomer.id, payload);
    } else {
      await customerService.create(payload);
    }
    closeModals();
    await fetchCustomers();
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja remover este cliente?')) return;

    try {
      await customerService.delete(id);
      fetchCustomers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir cliente.');
    }
  }

  return {
    customers: data?.data || [],
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
      isFormOpen: isFormModalOpen,
      isDetailOpen: isDetailModalOpen,
      selectedCustomer,
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
      refresh: fetchCustomers,
    },
  };
}