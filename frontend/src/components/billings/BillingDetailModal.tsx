import { Billing } from '@/types/billing';
import { formatDate } from '@/utils/date';

interface BillingDetailModalProps {
  isOpen: boolean;
  billing: Billing | null;
  onClose: () => void;
  onEdit: (billing: Billing) => void;
}

export function BillingDetailModal({
  isOpen,
  billing,
  onClose,
  onEdit,
}: BillingDetailModalProps) {
  if (!isOpen || !billing) return null;

  const formatCurrency = (val: number | string | undefined) =>
    Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const calc = billing.calculation;
  const isOverdue = calc?.is_overdue ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        <header className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Detalhes da Cobrança #{billing.id}</h2>
            <p className="text-xs text-slate-500">Vinculada a {billing.customer?.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">
            ×
          </button>
        </header>

        <div className="p-6 space-y-4 text-sm text-slate-700">
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase">Descrição</span>
            <span className="font-medium text-slate-900">{billing.description}</span>
          </div>

          {/* Card com os valores e a memória de cálculo */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200">
              <span>Valor Original:</span>
              <span className="font-semibold text-slate-700">{formatCurrency(billing.original_amount)}</span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 pb-2 border-b border-slate-200">
              <span>Taxa Mensal Contratada:</span>
              <span className="font-semibold text-slate-700">{billing.interest_rate}% a.m.</span>
            </div>

            {isOverdue && calc ? (
              <>
                <div className="flex justify-between items-center text-xs text-amber-700 pb-2 border-b border-slate-200">
                  <span>Dias em Atraso:</span>
                  <span className="font-bold">{calc.days_overdue} dias</span>
                </div>

                <div className="flex justify-between items-center text-xs text-amber-700 pb-2 border-b border-slate-200">
                  <span>Taxa Diária Equivalente:</span>
                  <span className="font-semibold">{calc.daily_interest_rate_percent}% a.d.</span>
                </div>

                <div className="flex justify-between items-center text-xs text-red-600 pb-2 border-b border-slate-200">
                  <span>Acréscimo de Juros Compostos:</span>
                  <span className="font-bold">+{formatCurrency(calc.interest_amount)}</span>
                </div>

                <div className="flex justify-between items-center text-sm pt-1">
                  <span className="font-bold text-slate-900">Total Atualizado:</span>
                  <span className="text-xl font-extrabold text-red-600">{formatCurrency(calc.final_amount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center text-sm pt-1">
                <span className="font-bold text-slate-900">Total sem Juros:</span>
                <span className="text-lg font-bold text-emerald-600">{formatCurrency(billing.original_amount)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div>
              <span className="block font-semibold text-slate-400">Emissão</span>
              <span>{formatDate(billing.issue_date)}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-400">Vencimento</span>
              <span>{formatDate(billing.due_date)}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-400">Pagamento</span>
              <span>{billing.payment_date ? formatDate(billing.payment_date) : 'Em aberto'}</span>
            </div>
          </div>
        </div>

        <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(billing);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Editar Cobrança
          </button>
        </footer>
      </div>
    </div>
  );
}