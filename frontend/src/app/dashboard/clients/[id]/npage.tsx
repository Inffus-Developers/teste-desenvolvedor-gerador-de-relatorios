'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    api.get(`/clients/${id}`)
      .then((res) => setClient(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [params]);

  if (loading) return <p>Carregando...</p>;
  if (!client) return <p>Cliente não encontrado.</p>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/dashboard/clients" style={{ color: 'var(--text-muted)' }}>← Voltar</Link>
        <h1 style={{ margin: 0 }}>Detalhes do Cliente</h1>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p style={{ color: 'var(--text-muted)' }}>Nome</p>
            <h3>{client.name}</h3>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }}>Status</p>
            <h3>{client.status}</h3>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }}>Documento</p>
            <h3>{client.document || '-'}</h3>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)' }}>E-mail</p>
            <h3>{client.email || '-'}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
