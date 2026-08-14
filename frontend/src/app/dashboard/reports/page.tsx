'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface ReportData {
  id: number;
  client_name: string;
  description: string;
  issue_date: string;
  due_date: string;
  payment_date?: string | null;
  status: string;
  original_amount: number;
  interest_amount: number;
  final_amount: number;
  paid_amount?: number | null;
}

interface Totals {
  count: number;
  total_original: number;
  total_interest: number;
  total_updated: number;
  total_received: number;
  total_pending: number;
}

export default function Reports() {
  const [data, setData] = useState<ReportData[]>([]);
  const [totals, setTotals] = useState<Totals>({
    count: 0, total_original: 0, total_interest: 0, total_updated: 0, total_received: 0, total_pending: 0,
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    client: '',
    status: '',
    period: 'issue_date',
  });

  const fetchReports = async (pageToFetch: number, nextFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageToFetch) });
      if (nextFilters.start_date) params.set('start_date', nextFilters.start_date);
      if (nextFilters.end_date) params.set('end_date', nextFilters.end_date);
      if (nextFilters.client) params.set('client', nextFilters.client);
      if (nextFilters.status) params.set('status', nextFilters.status);
      if (nextFilters.period) params.set('period', nextFilters.period);

      const res = await api.get(`/report/charges?${params.toString()}`);
      setData(res.data.data ?? []);
      setTotals(res.data.totals ?? { count: 0, total_original: 0, total_interest: 0, total_updated: 0, total_received: 0, total_pending: 0 });
      setTotalPages(res.data.pagination?.last_page ?? 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(page);
  }, [page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports(1, filters);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val || 0));
  };

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.25rem' }}>Relatório de Faturamento</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Filtros por período, cliente, status e base de cálculo.
      </p>

      <form className="card" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '1rem' }} onSubmit={handleFilterSubmit}>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">Data inicial</label>
          <input type="date" className="input-field" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
        </div>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">Data final</label>
          <input type="date" className="input-field" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
        </div>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">Cliente</label>
          <input type="text" className="input-field" value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })} placeholder="Nome do cliente" />
        </div>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">Status</label>
          <select className="input-field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="paga">Paga</option>
            <option value="atrasada">Atrasada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label className="input-label">Base do período</label>
          <select className="input-field" value={filters.period} onChange={(e) => setFilters({ ...filters, period: e.target.value })}>
            <option value="issue_date">Data de emissão</option>
            <option value="due_date">Data de vencimento</option>
            <option value="payment_date">Data de pagamento</option>
          </select>
        </div>
        <div style={{ gridColumn: 'span 5', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary">Aplicar filtros</button>
        </div>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Quantidade</p>
          <h2 style={{ margin: '0.5rem 0 0' }}>{totals.count}</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Valor Original</p>
          <h2 style={{ margin: '0.5rem 0 0', color: 'var(--primary)' }}>{formatCurrency(totals.total_original)}</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Juros</p>
          <h2 style={{ margin: '0.5rem 0 0', color: 'var(--warning)' }}>{formatCurrency(totals.total_interest)}</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Valor Atualizado</p>
          <h2 style={{ margin: '0.5rem 0 0' }}>{formatCurrency(totals.total_updated)}</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Recebido</p>
          <h2 style={{ margin: '0.5rem 0 0', color: 'var(--success)' }}>{formatCurrency(totals.total_received)}</h2>
        </div>
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Pendente</p>
          <h2 style={{ margin: '0.5rem 0 0', color: 'var(--danger)' }}>{formatCurrency(totals.total_pending)}</h2>
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
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Cliente</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Descrição</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Emissão</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Vencimento</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Original</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Juros</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Atualizado</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Pago</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma cobrança encontrada para os filtros selecionados.</td>
                  </tr>
                ) : data.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1.5rem' }}>{item.client_name}</td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>{item.description}</td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>{item.issue_date ? new Date(item.issue_date).toLocaleDateString('pt-BR') : '-'}</td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>{item.due_date ? new Date(item.due_date).toLocaleDateString('pt-BR') : '-'}</td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>{item.status}</td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>{formatCurrency(item.original_amount)}</td>
                    <td style={{ padding: '0.75rem 1.5rem', color: 'var(--warning)' }}>{formatCurrency(item.interest_amount)}</td>
                    <td style={{ padding: '0.75rem 1.5rem', color: 'var(--primary)' }}>{formatCurrency(item.final_amount)}</td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>{formatCurrency(item.paid_amount ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn" style={{ backgroundColor: 'var(--surface-hover)' }}>
                Anterior
              </button>
              <span style={{ color: 'var(--text-muted)' }}>Página {page} de {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn" style={{ backgroundColor: 'var(--surface-hover)' }}>
                Próxima
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
