'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Client {
  id: number;
  name: string;
  document: string;
  email: string;
  status: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.data || res.data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja remover este cliente?')) return;

    try {
      await api.delete(`/clients/${id}`);
      await fetchClients();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir cliente');
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Clientes</h1>
        <Link href="/dashboard/clients/create" className="btn btn-primary">+ Novo Cliente</Link>
      </div>

      <div className="card">
        {loading ? (
          <p>Carregando...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Nome</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Documento</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>E-mail</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td style={{ padding: '0.75rem' }}>{c.name}</td>
                  <td style={{ padding: '0.75rem' }}>{c.document || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{c.email || '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{c.status}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link href={`/dashboard/clients/${c.id}`} className="btn" style={{ padding: '0.45rem 0.8rem', background: 'var(--primary-glow)', color: 'var(--primary)' }}>Visualizar</Link>
                      <Link href={`/dashboard/clients/${c.id}/edit`} className="btn" style={{ padding: '0.45rem 0.8rem', background: 'var(--surface-hover)', color: 'var(--text)' }}>Editar</Link>
                      <button onClick={() => handleDelete(c.id)} className="btn" style={{ padding: '0.45rem 0.8rem', background: 'var(--danger-bg)', color: 'var(--danger)' }}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
