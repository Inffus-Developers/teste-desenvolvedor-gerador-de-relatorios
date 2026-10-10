'use client';

import { useCustomers } from '@/hooks/useCustomers';
import { CustomerFilters } from '@/components/customers/CustomerFilters';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { CustomerPagination } from '@/components/customers/CustomerPagination';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { CustomerDetailModal } from '@/components/customers/CustomerDetailModal';
import { AppLayout } from '@/components/layout/AppLayout';

export default function CustomersPage() {
  const { customers, pagination, filters, loading, error, modals, actions } = useCustomers();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Cabeçalho com tipografia Poppins e paleta verde */}
        <header
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ fontFamily: "'Poppins', 'Segoe UI', sans-serif" }}
        >
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: '#3e5954' }}
            >
              Clientes
            </h1>
            <p
              className="text-sm mt-1 font-medium"
              style={{ color: '#3e5954', opacity: 0.8 }}
            >
              Cadastre, edite, consulte e gerencie a base cadastral de clientes
            </p>
          </div>

          {/* Botão Novo Cliente no padrão #3e5954 / #dff6e4 */}
          <button
            type="button"
            onClick={actions.openCreateModal}
            className="px-4 py-2.5 font-semibold text-sm rounded-lg shadow-md transition-all hover:brightness-110 active:scale-[0.98] self-start sm:self-auto"
            style={{
              backgroundColor: '#3e5954',
              color: '#dff6e4',
            }}
          >
            + Novo Cliente
          </button>
        </header>

        {error && (
          <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <CustomerFilters
            search={filters.search || ''}
            status={filters.status || ''}
            onSearchChange={actions.handleSearchChange}
            onStatusChange={actions.handleStatusChange}
          />

          <CustomerTable
            customers={customers}
            loading={loading}
            onView={actions.openDetailModal}
            onEdit={actions.openEditModal}
            onDelete={actions.handleDelete}
          />

          <CustomerPagination
            currentPage={pagination.currentPage}
            lastPage={pagination.lastPage}
            total={pagination.total}
            from={pagination.from}
            to={pagination.to}
            onPageChange={actions.handlePageChange}
          />
        </div>

        <CustomerModal
          isOpen={modals.isFormOpen}
          customer={modals.selectedCustomer}
          onClose={actions.closeModals}
          onSave={actions.handleSave}
        />

        <CustomerDetailModal
          isOpen={modals.isDetailOpen}
          customer={modals.selectedCustomer}
          onClose={actions.closeModals}
          onEdit={actions.openEditModal}
        />
      </div>
    </AppLayout>
  );
}