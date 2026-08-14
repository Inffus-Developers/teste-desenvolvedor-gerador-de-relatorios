'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Button, Card, Loading, Badge } from '@/components';

interface Client {
  id: number;
  name: string;
  document: string;
  email: string;
  status: string;
  created_at?: string;
}

export default function ClientDetails() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const res = await api.get(`/clients/${clientId}`);
      setClient(res.data.data || res.data);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao carregar cliente';
      addToast(message, 'error', 'Erro');
      router.push('/dashboard/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja deletar este cliente? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/clients/${client!.id}`);
      addToast('Cliente removido com sucesso!', 'success', 'Sucesso');
      router.push('/dashboard/clients');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao deletar cliente';
      addToast(message, 'error', 'Erro');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'ativo' ? (
      <Badge variant="success">Ativo</Badge>
    ) : (
      <Badge variant="warning">Inativo</Badge>
    );
  };

  if (loading) {
    return <Loading />;
  }

  if (!client) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        Cliente não encontrado
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link
          href="/dashboard/clients"
          style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
          }}
        >
          ← Voltar
        </Link>
        <h1 style={{ margin: 0 }}>Detalhes do Cliente</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Nome
              </p>
              <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 500 }}>
                {client.name}
              </p>
            </div>

            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                E-mail
              </p>
              <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 500 }}>
                {client.email}
              </p>
            </div>

            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Documento
              </p>
              <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 500 }}>
                {client.document || '-'}
              </p>
            </div>

            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Status
              </p>
              <div>{getStatusBadge(client.status)}</div>
            </div>

            {client.created_at && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Criado em
                </p>
                <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 500 }}>
                  {new Date(client.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link href={`/dashboard/clients/${client.id}/edit`} style={{ textDecoration: 'none' }}>
              <Button variant="primary">Editar</Button>
            </Link>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Deletar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
