import { BillingStatus } from '@/types/billing';

interface BillingFiltersProps {
  search: string;
  status: BillingStatus | '';
  onSearchChange: (value: string) => void;
  onStatusChange: (value: BillingStatus | '') => void;
}

export function BillingFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: BillingFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por descrição ou nome/documento do cliente..."
          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
        />
      </div>

      <div className="w-full sm:w-56">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as BillingStatus | '')}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
          <option value="overdue">Vencido</option>
          <option value="canceled">Cancelado</option>
        </select>
      </div>
    </div>
  );
}