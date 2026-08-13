'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ReportData {
  id: number;
  client_name: string;
  original_amount: number;
  final_amount: number;
  status: string;
}

export default function Reports() {
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = async (pageToFetch: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/report/charges?page=${pageToFetch}`);
      setData(res.data.data);
      setTotalPages(res.data.last_page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(page);
  }, [page]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Calcula totais
  const totalOriginal = data.reduce((acc, curr) => acc + curr.original_amount, 0);
  const totalFinal = data.reduce((acc, curr) => acc + curr.final_amount, 0);

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.25rem' }}>Relatórios Consolidados</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Visualização preparada para grandes volumes de dados (paginada).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Registros na Página</p>
          <h2 style={{ margin: '0.5rem 0 0' }}>{data.length}</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Soma Original (Página)</p>
          <h2 style={{ margin: '0.5rem 0 0', color: 'var(--primary)' }}>{formatCurrency(totalOriginal)}</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Soma Final Atualizada (Página)</p>
          <h2 style={{ margin: '0.5rem 0 0', color: 'var(--warning)' }}>{formatCurrency(totalFinal)}</h2>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Gerando relatório...</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>ID</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Cliente</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Original</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Final</th>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1.5rem', color: 'var(--text-muted)' }}>#{item.id}</td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>{item.client_name}</td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>{item.status}</td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>{formatCurrency(item.original_amount)}</td>
                    <td style={{ padding: '0.75rem 1.5rem', color: 'var(--warning)' }}>{formatCurrency(item.final_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="btn"
                style={{ backgroundColor: 'var(--surface-hover)' }}
              >
                Anterior
              </button>
              <span style={{ color: 'var(--text-muted)' }}>Página {page} de {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="btn"
                style={{ backgroundColor: 'var(--surface-hover)' }}
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
