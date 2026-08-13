'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function CreateClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', document: '', email: '', status: 'active' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/clients', form);
      router.push('/dashboard/clients');
    } catch (err) {
      console.error(err);
      alert('Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/dashboard/clients" style={{ color: 'var(--text-muted)' }}>← Voltar</Link>
        <h1 style={{ margin: 0 }}>Novo Cliente</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Nome</label>
              <input required className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>

            <div className="input-group">
              <label className="input-label">Documento</label>
              <input className="input-field" value={form.document} onChange={e => setForm({...form, document: e.target.value})} />
            </div>

            <div className="input-group">
              <label className="input-label">E-mail</label>
              <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>

            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="input-field" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
