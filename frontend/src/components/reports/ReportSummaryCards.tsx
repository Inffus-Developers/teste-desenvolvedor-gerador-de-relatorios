import { ReportSummary } from '@/types/report';

interface ReportSummaryCardsProps {
  summary: ReportSummary;
}

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6"
      style={{ fontFamily: "'Poppins', 'Segoe UI', sans-serif" }}
    >
      {/* 1. Card Destaque: Volume Total na identidade #3e5954 / #dff6e4 */}
      <div
        className="p-4 rounded-xl shadow-md border border-white/10 flex flex-col justify-between transition-all hover:brightness-105"
        style={{
          backgroundColor: '#3e5954',
          color: '#dff6e4',
        }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider opacity-85">
          Volume Total ({summary.total_count})
        </span>
        <div className="text-xl font-bold mt-2 tracking-tight">
          {formatCurrency(summary.total_amount)}
        </div>
      </div>

      {/* 2. Recebido (Pago) */}
      <div className="p-4 bg-white border border-emerald-200/80 rounded-xl shadow-sm flex flex-col justify-between transition-all hover:border-emerald-300">
        <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
          Recebido (Pago)
        </span>
        <div className="text-xl font-bold text-emerald-800 mt-2 tracking-tight">
          {formatCurrency(summary.paid_amount)}
        </div>
      </div>

      {/* 3. A Vencer (Pendente) */}
      <div className="p-4 bg-white border border-amber-200/80 rounded-xl shadow-sm flex flex-col justify-between transition-all hover:border-amber-300">
        <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
          A Vencer (Pendente)
        </span>
        <div className="text-xl font-bold text-amber-800 mt-2 tracking-tight">
          {formatCurrency(summary.pending_amount)}
        </div>
      </div>

      {/* 4. Inadimplência (Vencido) */}
      <div className="p-4 bg-white border border-red-200/80 rounded-xl shadow-sm flex flex-col justify-between transition-all hover:border-red-300">
        <span className="text-[11px] font-semibold text-red-700 uppercase tracking-wider">
          Inadimplência
        </span>
        <div className="text-xl font-bold text-red-800 mt-2 tracking-tight">
          {formatCurrency(summary.overdue_amount)}
        </div>
      </div>

      {/* 5. Canceladas */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between transition-all hover:border-slate-300">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Canceladas
        </span>
        <div className="text-xl font-bold text-slate-700 mt-2 tracking-tight">
          {formatCurrency(summary.canceled_amount)}
        </div>
      </div>
    </div>
  );
}