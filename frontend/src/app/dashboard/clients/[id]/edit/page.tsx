'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', document: '', email: '', status: 'active' });

  useEffect(() => {
    const id = params?.id;
    if (!id) return;

    api.get(`/clients/${id}`).then((res) => {
      const client = res.data;
      setForm({
        name: client.name || '',
        document: client.document || '',
        email: client.email || '',
        status: client.status || 'active',
      });
    }).catch((err) => console.error(err));
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/clients/${params?.id}`, form);
      router.push('/dashboard/clients');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/dashboard/clients" style={{ color: 'var(--text-muted)' }}>← Voltar</Link>
        <h1 style={{ margin: 0 }}>Editar Cliente</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Nome</label>
              <input required className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Documento</label>
              <input className="input-field" value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">E-mail</label>
              <input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar Alterações'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
