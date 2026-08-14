'use client';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem',
        borderTop: '1px solid var(--border)',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={disabled || currentPage === 1}
        className="btn"
        style={{
          backgroundColor: 'var(--surface-hover)',
          opacity: disabled || currentPage === 1 ? 0.5 : 1,
          cursor: disabled || currentPage === 1 ? 'not-allowed' : 'pointer',
        }}
      >
        ← Anterior
      </button>

      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Página {currentPage} de {totalPages}
      </span>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={disabled || currentPage === totalPages}
        className="btn"
        style={{
          backgroundColor: 'var(--surface-hover)',
          opacity: disabled || currentPage === totalPages ? 0.5 : 1,
          cursor: disabled || currentPage === totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        Próxima →
      </button>
    </div>
  );
}
