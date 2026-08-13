'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Charge {
  id: number;
  client_name: string;
  original_amount: number;
  final_amount: number;
  due_date: string;
  status: string;
}

export default function Dashboard() {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharges();
  }, []);

  const fetchCharges = async () => {
    try {
      const res = await api.get('/charges');
      setCharges(res.data.data); // data.data due to pagination
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
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
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Valor Original</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Valor Final</th>
              </tr>
            </thead>
            <tbody>
              {charges.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma cobrança encontrada.</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
