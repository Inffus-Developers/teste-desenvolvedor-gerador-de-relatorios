import { Billing } from '@/types/billing';
import { formatDate } from '@/utils/date';

interface BillingTableProps {
  billings: Billing[];
  loading: boolean;
  onView: (billing: Billing) => void;
  onEdit: (billing: Billing) => void;
  onDelete: (id: number) => void;
}

const statusMap: Record<Billing['status'], { label: string; badgeClass: string }> = {
  pending: { label: 'Pendente', badgeClass: 'bg-amber-100 text-amber-800 border border-amber-200' },
  paid: { label: 'Pago', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
  overdue: { label: 'Vencido', badgeClass: 'bg-red-100 text-red-800 border border-red-200' },
  canceled: { label: 'Cancelado', badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200' },
};

export function BillingTable({
  billings,
  loading,
  onView,
  onEdit,
  onDelete,
}: BillingTableProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-slate-500 font-medium">
        Carregando faturas...
      </div>
    );
  }

  if (billings.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-lg">
        Nenhuma cobrança encontrada.
      </div>
    );
  }

  const formatCurrency = (val: number | string | undefined) =>
    Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="overflow-x-auto bg-white border border-slate-200 rounded-lg shadow-sm">
      <table className="w-full text-left text-sm text-slate-700">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Descrição</th>
            <th className="px-4 py-3">Valor Original</th>
            <th className="px-4 py-3">Valor Atualizado</th>
            <th className="px-4 py-3">Vencimento</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-center min-w-[220px]">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {billings.map((billing) => {
            const statusConfig = statusMap[billing.status] || {
              label: billing.status,
              badgeClass: 'bg-slate-100 text-slate-700 border border-slate-200',
            };
            const calc = billing.calculation;
            const hasInterest = calc && calc.is_overdue && calc.interest_amount > 0;

            return (
              <tr key={billing.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-semibold text-slate-900 leading-tight">
                    {billing.customer?.name || '—'}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                    {billing.customer?.document || '—'}
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[180px] truncate text-slate-600">
                  {billing.description}
                </td>
                <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                  {formatCurrency(billing.original_amount)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {hasInterest ? (
                    <div>
                      <div className="font-bold text-red-600 leading-tight">
                        {formatCurrency(calc.final_amount)}
                      </div>
                      <div className="text-[10px] text-red-500 font-medium">
                        +{formatCurrency(calc.interest_amount)} ({calc.days_overdue}d)
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-900 font-medium">
                      {formatCurrency(billing.original_amount)}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {formatDate(billing.due_date)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusConfig.badgeClass}`}
                  >
                    {statusConfig.label}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <div className="inline-flex items-center justify-center gap-1.5">
                    {/* Botão Visualizar */}
                    <button
                      type="button"
                      onClick={() => onView(billing)}
                      title="Visualizar cobrança"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs hover:border-slate-300 active:scale-95"
                    >
                      <svg
                        className="w-3 h-3 text-slate-500 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Ver
                    </button>

                    {/* Botão Editar */}
                    <button
                      type="button"
                      onClick={() => onEdit(billing)}
                      title="Editar cobrança"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all shadow-2xs hover:brightness-110 active:scale-95"
                      style={{
                        backgroundColor: '#3e5954',
                        color: '#dff6e4',
                      }}
                    >
                      <svg
                        className="w-3 h-3 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Editar
                    </button>

                    {/* Botão Cancelar */}
                    <button
                      type="button"
                      onClick={() => onDelete(billing.id)}
                      title="Cancelar cobrança"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border border-red-200 bg-red-50/80 hover:bg-red-100 text-red-700 transition-all shadow-2xs active:scale-95"
                    >
                      <svg
                        className="w-3 h-3 text-red-600 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}