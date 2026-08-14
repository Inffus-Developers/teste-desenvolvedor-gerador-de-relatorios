'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Card, Loading, Alert } from '@/components';

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
  const { addToast } = useToast();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/charges');
      setCharges(res.data.data ?? res.data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao carregar cobranças';
      setError(message);
      addToast(message, 'error', 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paga: '#22c55e',
      pendente: '#f97316',
      atrasada: '#dc2626',
      cancelada: '#6b7280',
    };
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '0.25rem',
        backgroundColor: colors[status] + '20',
        color: colors[status],
        fontSize: '0.875rem',
        fontWeight: 500,
      }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val || 0));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharge) return;

    setPaymentLoading(true);
    try {
      await api.post(`/charges/${selectedCharge.id}/pay`, {
        payment_date: paymentForm.payment_date || undefined,
        paid_amount: paymentForm.paid_amount ? Number(paymentForm.paid_amount) : undefined,
        paid_interest: paymentForm.paid_interest ? Number(paymentForm.paid_interest) : undefined,
      });

      setSelectedCharge(null);
      setPaymentForm({ payment_date: '', paid_amount: '', paid_interest: '' });
      await fetchCharges();
      addToast('Pagamento registrado com sucesso!', 'success', 'Sucesso');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao registrar pagamento';
      addToast(message, 'error', 'Erro');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Cobranças</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gerencie os faturamentos dos seus clientes.</p>
        </div>
        <Link href="/dashboard/create" style={{ textDecoration: 'none' }}>
          <Button variant="primary">+ Nova Cobrança</Button>
        </Link>
      </div>

      {error && (
        <Alert
          variant="error"
          title="Erro"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {selectedCharge && (
        <Card style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Registrar Pagamento</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            <strong>{selectedCharge.client_name}</strong> — Valor: <strong>{formatCurrency(selectedCharge.final_amount)}</strong>
          </p>
          <form onSubmit={handlePaymentSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1.5rem' }}>
            <Input
              label="Data do Pagamento"
              type="date"
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
            />
            <Input
              label="Valor Efetivamente Pago"
              type="number"
              step="0.01"
              value={paymentForm.paid_amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, paid_amount: e.target.value })}
              placeholder={String(selectedCharge.final_amount)}
            />
            <Input
              label="Juros no Pagamento"
              type="number"
              step="0.01"
              value={paymentForm.paid_interest}
              onChange={(e) => setPaymentForm({ ...paymentForm, paid_interest: e.target.value })}
              placeholder={String(selectedCharge.interest_amount || 0)}
            />
            <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <Button variant="secondary" type="button" onClick={() => setSelectedCharge(null)}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" loading={paymentLoading}>
                Salvar Pagamento
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Carregando cobranças..." />
        ) : charges.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ marginTop: 0 }}>Nenhuma cobrança encontrada.</p>
            <Link href="/dashboard/create" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">Criar primeira cobrança</Button>
            </Link>
          </div>
        ) : (
          <div style={{ overflow: 'x auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Cliente</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Descrição</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Vencimento</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Original</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Atualizado</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {charges.map(charge => (
                  <tr key={charge.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{charge.client_name}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{charge.description}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>{new Date(charge.due_date).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '1rem 1.5rem' }}>{getStatusBadge(charge.status)}</td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{formatCurrency(charge.original_amount)}</td>
                    <td style={{ padding: '1rem 1.5rem', color: charge.final_amount > charge.original_amount ? 'var(--warning)' : 'inherit', fontWeight: 500 }}>
                      {formatCurrency(charge.final_amount)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link href={`/dashboard/${charge.id}/edit`} style={{ textDecoration: 'none' }}>
                        <Button size="sm" variant="secondary">Editar</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setSelectedCharge(charge)}
                        disabled={charge.status === 'paga'}
                      >
                        {charge.status === 'paga' ? 'Pago' : 'Pagamento'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
