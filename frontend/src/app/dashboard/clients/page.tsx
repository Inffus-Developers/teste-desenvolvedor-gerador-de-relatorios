'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get('/clients')
      .then(res => {
        if (!mounted) return;
        setClients(res.data.data || res.data);
      })
      .catch(err => {
        console.error(err);
        setError('Erro ao carregar clientes');
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false };
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
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Nome</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Documento</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>E-mail</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td style={{ padding: '0.5rem' }}>{c.name}</td>
                  <td style={{ padding: '0.5rem' }}>{c.document}</td>
                  <td style={{ padding: '0.5rem' }}>{c.email}</td>
                  <td style={{ padding: '0.5rem' }}>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
