'use client';

import { useBillingReport } from '@/hooks/useBillingReport';
import { ReportSummaryCards } from '@/components/reports/ReportSummaryCards';
import { CustomerPagination } from '@/components/customers/CustomerPagination';
import { AppLayout } from '@/components/layout/AppLayout';
import { formatDate } from '@/utils/date';
import { BillingStatus } from '@/types/billing';

const statusMap: Record<BillingStatus, { label: string; badgeClass: string }> = {
  pending: { label: 'Pendente', badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200' },
  paid: { label: 'Pago', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  overdue: { label: 'Vencido', badgeClass: 'bg-red-100 text-red-800 border border-red-200' },
  canceled: { label: 'Cancelado', badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200' },
};

export default function ReportsPage() {
  const {
    reportData,
    summary,
    pagination,
    filters,
    loading,
    exporting,
    exportingPdf,
    error,
    actions,
  } = useBillingReport();

  const formatCurrency = (val: number | string | undefined) =>
    Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Cabeçalho no padrão #3e5954 e Poppins */}
        <header
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ fontFamily: "'Poppins', 'Segoe UI', sans-serif" }}
        >
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: '#3e5954' }}
            >
              Relatório de Faturamento
            </h1>
            <p
              className="text-sm mt-1 font-medium"
              style={{ color: '#3e5954', opacity: 0.8 }}
            >
              Visão consolidada com apuração de juros compostos e exportação
            </p>
          </div>

          {/* Botões lado a lado e alinhados à direita com tons de verde distintos */}
          <div className="flex items-center gap-3 self-end sm:self-auto justify-end">
            {/* Tom Verde Claro (#dff6e4) com texto escuro */}
            <button
              type="button"
              onClick={actions.handleExportCsv}
              disabled={exporting || loading}
              className="px-4 py-2.5 font-semibold text-xs rounded-lg shadow-sm border border-[#3e5954]/20 transition-all hover:brightness-95 active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: '#dff6e4',
                color: '#3e5954',
              }}
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {exporting ? 'Gerando CSV...' : 'Exportar CSV'}
            </button>

            {/* Tom Verde Escuro (#3e5954) com texto claro */}
            <button
              type="button"
              onClick={actions.handleExportPdf}
              disabled={exportingPdf || loading}
              className="px-4 py-2.5 font-semibold text-xs rounded-lg shadow-md transition-all hover:brightness-110 active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: '#3e5954',
                color: '#dff6e4',
              }}
            >
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              {exportingPdf ? 'Gerando PDF...' : 'Exportar PDF'}
            </button>
          </div>
        </header>

        {error && (
          <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <ReportSummaryCards summary={summary} />

        {/* Filtros de Alta Performance */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Vencimento Inicial
              </label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => actions.handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3e5954]/30 focus:border-[#3e5954]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Vencimento Final
              </label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => actions.handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#3e5954]/30 focus:border-[#3e5954]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => actions.handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3e5954]/30 focus:border-[#3e5954]"
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="overdue">Vencido</option>
                <option value="canceled">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Tabela de Relatório */}
          {loading ? (
            <div className="py-16 text-center text-slate-500 font-medium">
              Compilando dados do relatório...
            </div>
          ) : reportData.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-lg">
              Nenhum registro para os filtros informados.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Cliente</th>
                    <th className="px-4 py-3.5">Descrição</th>
                    <th className="px-4 py-3.5">Valor Original</th>
                    <th className="px-4 py-3.5">Valor c/ Juros</th>
                    <th className="px-4 py-3.5">Vencimento</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportData.map((billing) => {
                    const calc = billing.calculation;
                    const hasInterest = calc && calc.is_overdue && calc.interest_amount > 0;
                    const statusConfig = statusMap[billing.status] || {
                      label: billing.status,
                      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
                    };

                    return (
                      <tr key={billing.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                          {billing.customer?.name || '—'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                          {billing.description}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                          {formatCurrency(billing.original_amount)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {hasInterest ? (
                            <span className="font-bold text-red-600">
                              {formatCurrency(calc.final_amount)}
                            </span>
                          ) : (
                            <span className="text-slate-800 font-medium">
                              {formatCurrency(billing.original_amount)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                          {formatDate(billing.due_date)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusConfig.badgeClass}`}
                          >
                            {statusConfig.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <CustomerPagination
            currentPage={pagination.currentPage}
            lastPage={pagination.lastPage}
            total={pagination.total}
            from={pagination.from}
            to={pagination.to}
            onPageChange={actions.handlePageChange}
          />
        </div>
      </div>
    </AppLayout>
  );
}