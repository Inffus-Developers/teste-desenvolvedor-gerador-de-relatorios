'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateCharge() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    description: '',
    original_amount: '',
    issue_date: '',
    due_date: '',
    status: 'pendente',
    interest_rate: '0'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/charges', formData);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar a cobrança. Verifique os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/dashboard" style={{ color: 'var(--text-muted)' }}>← Voltar</Link>
        <h1 style={{ margin: 0 }}>Nova Cobrança</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Nome do Cliente</label>
              <input type="text" className="input-field" required 
                value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Valor Original (R$)</label>
              <input type="number" step="0.01" className="input-field" required 
                value={formData.original_amount} onChange={e => setFormData({...formData, original_amount: e.target.value})} />
            </div>

            <div className="input-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
              <label className="input-label">Descrição da Cobrança</label>
              <input type="text" className="input-field" required 
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Data de Emissão</label>
              <input type="date" className="input-field" required 
                value={formData.issue_date} onChange={e => setFormData({...formData, issue_date: e.target.value})} />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Data de Vencimento</label>
              <input type="date" className="input-field" required 
                value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Status Inicial</label>
              <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="pendente">Pendente</option>
                <option value="paga">Paga</option>
                <option value="atrasada">Atrasada</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Taxa de Juros ao Dia (%)</label>
              <input type="number" step="0.01" className="input-field" required 
                value={formData.interest_rate} onChange={e => setFormData({...formData, interest_rate: e.target.value})} />
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Cobrança'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
