interface CustomerPaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (page: number) => void;
}

export function CustomerPagination({
  currentPage,
  lastPage,
  total,
  from,
  to,
  onPageChange,
}: CustomerPaginationProps) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <div className="text-sm text-slate-600">
        Mostrando <span className="font-medium">{from}</span> até{' '}
        <span className="font-medium">{to}</span> de{' '}
        <span className="font-medium">{total}</span> registros
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Anterior
        </button>

        <span className="text-sm text-slate-600 px-2">
          Página {currentPage} de {lastPage}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
          className="px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}