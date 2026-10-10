'use client';

import { useBillings } from '@/hooks/useBillings';
import { BillingFilters } from '@/components/billings/BillingFilters';
import { BillingTable } from '@/components/billings/BillingTable';
import { BillingModal } from '@/components/billings/BillingModal';
import { BillingDetailModal } from '@/components/billings/BillingDetailModal';
import { CustomerPagination } from '@/components/customers/CustomerPagination';
import { AppLayout } from '@/components/layout/AppLayout';

export default function BillingsPage() {
  const {
    billings,
    pagination,
    filters,
    loading,
    error,
    modals,
    actions,
  } = useBillings();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Cabeçalho na identidade visual #3e5954 e Poppins */}
        <header
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ fontFamily: "'Poppins', 'Segoe UI', sans-serif" }}
        >
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: '#3e5954' }}
            >
              Cobranças
            </h1>
            <p
              className="text-sm mt-1 font-medium"
              style={{ color: '#3e5954', opacity: 0.8 }}
            >
              Controle de cobranças, vencimentos e status de cobranças
            </p>
          </div>

          {/* Botão Nova Cobrança no padrão #3e5954 / #dff6e4 */}
          <button
            type="button"
            onClick={actions.openCreateModal}
            className="px-4 py-2.5 font-semibold text-sm rounded-lg shadow-md transition-all hover:brightness-110 active:scale-[0.98] self-start sm:self-auto"
            style={{
              backgroundColor: '#3e5954',
              color: '#dff6e4',
            }}
          >
            + Nova Cobrança
          </button>
        </header>

        {error && (
          <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <BillingFilters
            search={filters.search || ''}
            status={filters.status || ''}
            onSearchChange={actions.handleSearchChange}
            onStatusChange={actions.handleStatusChange}
          />

          <BillingTable
            billings={billings}
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

        <BillingModal
          isOpen={modals.isFormOpen}
          billing={modals.selectedBilling}
          onClose={actions.closeModals}
          onSave={actions.handleSave}
        />

        <BillingDetailModal
          isOpen={modals.isDetailOpen}
          billing={modals.selectedBilling}
          onClose={actions.closeModals}
          onEdit={actions.openEditModal}
        />
      </div>
    </AppLayout>
  );
}