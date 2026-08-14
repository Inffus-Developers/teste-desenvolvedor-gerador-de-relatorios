'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Button, Loading } from '@/components';

interface ReportData { id: number; client_name: string; description: string; issue_date: string; due_date: string; status: string; original_amount: number; interest_amount: number; final_amount: number; paid_amount?: number | null; }
interface Totals { count: number; total_original: number; total_interest: number; total_updated: number; total_received: number; total_pending: number; }
type ExportFormat = 'csv' | 'pdf';

const emptyTotals: Totals = { count: 0, total_original: 0, total_interest: 0, total_updated: 0, total_received: 0, total_pending: 0 };

export default function Reports() {
  const { addToast } = useToast();
  const [data, setData] = useState<ReportData[]>([]);
  const [totals, setTotals] = useState<Totals>(emptyTotals);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({ start_date: '', end_date: '', client: '', status: '', period: 'issue_date' });

  const queryString = (pageToFetch?: number) => {
    const params = new URLSearchParams();
    if (pageToFetch) params.set('page', String(pageToFetch));
    if (filters.start_date) params.set('start_date', filters.start_date);
    if (filters.end_date) params.set('end_date', filters.end_date);
    if (filters.client) params.set('client', filters.client);
    if (filters.status) params.set('status', filters.status);
    params.set('period', filters.period);
    if (sortKey) { params.set('sort', sortKey); params.set('order', sortOrder); }
    return params.toString();
  };

  const fetchReports = async (pageToFetch: number) => {
    setLoading(true);
    try {
      const response = await api.get(`/report/charges?${queryString(pageToFetch)}`);
      setData(response.data.data ?? []);
      setTotals(response.data.totals ?? emptyTotals);
      setTotalPages(response.data.pagination?.last_page ?? 1);
    } catch (error) {
      console.error(error);
      addToast('Erro ao carregar relatório', 'error', 'Erro');
    } finally { setLoading(false); }
  };

  useEffect(() => { void fetchReports(page); }, [page, sortKey, sortOrder]);

  const submitFilters = (event: React.FormEvent) => { event.preventDefault(); setPage(1); void fetchReports(1); };
  const sort = (key: string) => { if (sortKey === key) setSortOrder((current) => current === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortOrder('asc'); } setPage(1); };
  const exportReport = async (format: ExportFormat) => {
    setExporting(true);
    try {
      const response = await api.get(`/report/charges/export/${format}?${queryString()}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a'); link.href = url; link.download = `relatorio-faturamento.${format}`; link.click(); URL.revokeObjectURL(url);
      addToast(`Relatório exportado em ${format.toUpperCase()} com sucesso!`, 'success', 'Sucesso');
    } catch (error) { console.error(error); addToast(`Erro ao exportar ${format.toUpperCase()}`, 'error', 'Erro'); }
    finally { setExporting(false); }
  };
  const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
  const date = (value: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '-';

  return <div className="animate-fade-in">
    <h1 style={{ marginBottom: '0.25rem' }}>Relatório de Faturamento</h1>
    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Filtros, ordenação, paginação e exportação pelo servidor.</p>
    <form className="card" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '1rem' }} onSubmit={submitFilters}>
      <Field label="Data inicial"><input type="date" className="input-field" value={filters.start_date} onChange={(event) => setFilters({ ...filters, start_date: event.target.value })} /></Field>
      <Field label="Data final"><input type="date" className="input-field" value={filters.end_date} onChange={(event) => setFilters({ ...filters, end_date: event.target.value })} /></Field>
      <Field label="Cliente"><input className="input-field" value={filters.client} onChange={(event) => setFilters({ ...filters, client: event.target.value })} placeholder="Nome do cliente" /></Field>
      <Field label="Status"><select className="input-field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">Todos</option><option value="pendente">Pendente</option><option value="paga">Paga</option><option value="atrasada">Atrasada</option><option value="cancelada">Cancelada</option></select></Field>
      <Field label="Base do período"><select className="input-field" value={filters.period} onChange={(event) => setFilters({ ...filters, period: event.target.value })}><option value="issue_date">Emissão</option><option value="due_date">Vencimento</option><option value="payment_date">Pagamento</option></select></Field>
      <div style={{ gridColumn: 'span 5', display: 'flex', justifyContent: 'space-between' }}><Button type="submit">Aplicar filtros</Button><div style={{ display: 'flex', gap: '0.5rem' }}><Button type="button" variant="secondary" size="sm" loading={exporting} onClick={() => void exportReport('csv')}>CSV</Button><Button type="button" variant="secondary" size="sm" loading={exporting} onClick={() => void exportReport('pdf')}>PDF</Button></div></div>
    </form>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', marginBottom: '2rem' }}>{Object.entries({ Quantidade: totals.count, 'Valor original': currency(totals.total_original), Juros: currency(totals.total_interest), 'Valor atualizado': currency(totals.total_updated), 'Total recebido': currency(totals.total_received), 'Total pendente': currency(totals.total_pending) }).map(([label, value]) => <div className="card" key={label}><p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</p><h2 style={{ margin: '0.5rem 0 0' }}>{value}</h2></div>)}</div>
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>{loading ? <Loading message="Gerando relatório..." /> : <><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}><thead><tr>{[['Cliente', 'client_name'], ['Descrição', 'description'], ['Emissão', 'issue_date'], ['Vencimento', 'due_date'], ['Status', 'status'], ['Original', 'original_amount']].map(([label, key]) => <th key={key} onClick={() => sort(key)} style={{ padding: '1rem', cursor: 'pointer' }}>{label}{sortKey === key ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : ''}</th>)}<th>Juros</th><th>Atualizado</th><th>Pago</th></tr></thead><tbody>{data.length === 0 ? <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center' }}>Nenhuma cobrança encontrada.</td></tr> : data.map((item) => <tr key={item.id}><td>{item.client_name}</td><td>{item.description}</td><td>{date(item.issue_date)}</td><td>{date(item.due_date)}</td><td>{item.status}</td><td>{currency(item.original_amount)}</td><td>{currency(item.interest_amount)}</td><td>{currency(item.final_amount)}</td><td>{currency(item.paid_amount ?? 0)}</td></tr>)}</tbody></table><div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between' }}><Button type="button" variant="secondary" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button><span>Página {page} de {totalPages}</span><Button type="button" variant="secondary" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div></>}</div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="input-group" style={{ marginBottom: 0 }}><label className="input-label">{label}</label>{children}</div>; }
