'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Charge {
  id: number;
  client_name: string;
  description: string;
  original_amount: number;
  final_amount: number;
  interest_amount: number;
  due_date: string;
  status: string;
  paid_amount?: number | null;
  paid_interest?: number | null;
}

export default function Dashboard() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharge, setSelectedCharge] = useState<Charge | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: '',
    paid_amount: '',
    paid_interest: '',
  });

  useEffect(() => {
    fetchCharges();
  }, []);

  const fetchCharges = async () => {
    try {
      const res = await api.get('/charges');
      setCharges(res.data.data ?? res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paga': return <span className="badge badge-success">Paga</span>;
      case 'pendente': return <span className="badge badge-warning">Pendente</span>;
      case 'atrasada': return <span className="badge badge-danger">Atrasada</span>;
      default: return <span className="badge" style={{ background: 'var(--border)' }}>{status}</span>;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val || 0));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharge) return;

    try {
      await api.post(`/charges/${selectedCharge.id}/pay`, {
        payment_date: paymentForm.payment_date || undefined,
        paid_amount: paymentForm.paid_amount ? Number(paymentForm.paid_amount) : undefined,
        paid_interest: paymentForm.paid_interest ? Number(paymentForm.paid_interest) : undefined,
      });

      setSelectedCharge(null);
      setPaymentForm({ payment_date: '', paid_amount: '', paid_interest: '' });
      await fetchCharges();
      alert('Pagamento registrado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar pagamento.');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Cobranças</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gerencie os faturamentos dos seus clientes.</p>
        </div>
        <Link href="/dashboard/create" className="btn btn-primary">
          + Nova Cobrança
        </Link>
      </div>

      {selectedCharge && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Registrar pagamento</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            {selectedCharge.client_name} — {formatCurrency(selectedCharge.final_amount)}
          </p>
          <form onSubmit={handlePaymentSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Data do pagamento</label>
              <input type="date" className="input-field" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Valor efetivamente pago</label>
              <input type="number" step="0.01" className="input-field" value={paymentForm.paid_amount} onChange={(e) => setPaymentForm({ ...paymentForm, paid_amount: e.target.value })} placeholder={String(selectedCharge.final_amount)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Juros no pagamento</label>
              <input type="number" step="0.01" className="input-field" value={paymentForm.paid_interest} onChange={(e) => setPaymentForm({ ...paymentForm, paid_interest: e.target.value })} placeholder={String(selectedCharge.interest_amount || 0)} />
            </div>
            <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn" onClick={() => setSelectedCharge(null)} style={{ background: 'var(--surface-hover)' }}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Salvar pagamento</button>
            </div>
          </form>
        </div>
      )}

      <div className="card mt-4" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Carregando dados...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Cliente</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Vencimento</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Original</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Valor Atualizado</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {charges.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma cobrança encontrada.</td>
                </tr>
              ) : charges.map(charge => (
                <tr key={charge.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{charge.client_name}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{new Date(charge.due_date).toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{getStatusBadge(charge.status)}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{formatCurrency(charge.original_amount)}</td>
                  <td style={{ padding: '1rem 1.5rem', color: charge.final_amount > charge.original_amount ? 'var(--warning)' : 'inherit' }}>
                    {formatCurrency(charge.final_amount)}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.45rem 0.8rem' }}
                      onClick={() => setSelectedCharge(charge)}
                      disabled={charge.status === 'paga'}
                    >
                      {charge.status === 'paga' ? 'Paga' : 'Registrar pagamento'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
