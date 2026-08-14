'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Button, Card, Loading, Alert, Badge } from '@/components';

interface Client {
  id: number;
  name: string;
  document: string;
  email: string;
  status: string;
}

export default function ClientsPage() {
  const { addToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/clients');
      setClients(res.data.data || res.data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao carregar clientes';
      setError(message);
      addToast(message, 'error', 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja remover este cliente? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeleting(id);
    try {
      await api.delete(`/clients/${id}`);
      addToast('Cliente removido com sucesso!', 'success', 'Sucesso');
      await fetchClients();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao excluir cliente';
      addToast(message, 'error', 'Erro');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const getStatusBadge = (status: string) => {
    return status === 'ativo' ? (
      <Badge variant="success">Ativo</Badge>
    ) : (
      <Badge variant="warning">Inativo</Badge>
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Clientes</h1>
        <Link href="/dashboard/clients/create" style={{ textDecoration: 'none' }}>
          <Button variant="primary">+ Novo Cliente</Button>
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

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <Loading message="Carregando clientes..." />
        ) : clients.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ marginTop: 0 }}>Nenhum cliente encontrado.</p>
            <Link href="/dashboard/clients/create" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">Criar primeiro cliente</Button>
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Nome</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Documento</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>E-mail</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 500, color: 'var(--text-muted)' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>{c.name}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{c.document || '-'}</td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{c.email || '-'}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{getStatusBadge(c.status)}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Link href={`/dashboard/clients/${c.id}`} style={{ textDecoration: 'none' }}>
                        <Button size="sm" variant="secondary">Visualizar</Button>
                      </Link>
                      <Link href={`/dashboard/clients/${c.id}/edit`} style={{ textDecoration: 'none' }}>
                        <Button size="sm" variant="secondary">Editar</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(c.id)}
                        loading={deleting === c.id}
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
