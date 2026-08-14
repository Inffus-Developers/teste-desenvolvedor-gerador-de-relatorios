'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Select, Card } from '@/components';

export default function CreateCharge() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    client_name: '',
    description: '',
    original_amount: '',
    issue_date: '',
    due_date: '',
    status: 'pendente',
    interest_rate: '0'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.client_name.trim()) newErrors.client_name = 'Cliente é obrigatório';
    if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória';
    if (!formData.original_amount || parseFloat(formData.original_amount) <= 0) newErrors.original_amount = 'Valor deve ser maior que 0';
    if (!formData.issue_date) newErrors.issue_date = 'Data de emissão é obrigatória';
    if (!formData.due_date) newErrors.due_date = 'Data de vencimento é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.post('/charges', formData);
      addToast('Cobrança criada com sucesso!', 'success', 'Sucesso');
      router.push('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao salvar a cobrança. Verifique os dados.';
      addToast(message, 'error', 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link
          href="/dashboard"
          style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
          }}
        >
          ← Voltar
        </Link>
        <h1 style={{ margin: 0 }}>Nova Cobrança</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <Input
              label="Cliente"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              error={errors.client_name}
              required
            />

            <Input
              label="Valor Original (R$)"
              name="original_amount"
              type="number"
              step="0.01"
              value={formData.original_amount}
              onChange={handleChange}
              error={errors.original_amount}
              required
            />

            <div style={{ gridColumn: 'span 2' }}>
              <Input
                label="Descrição da Cobrança"
                name="description"
                value={formData.description}
                onChange={handleChange}
                error={errors.description}
                required
              />
            </div>

            <Input
              label="Data de Emissão"
              name="issue_date"
              type="date"
              value={formData.issue_date}
              onChange={handleChange}
              error={errors.issue_date}
              required
            />

            <Input
              label="Data de Vencimento"
              name="due_date"
              type="date"
              value={formData.due_date}
              onChange={handleChange}
              error={errors.due_date}
              required
            />

            <Select
              label="Status Inicial"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'pendente', label: 'Pendente' },
                { value: 'paga', label: 'Paga' },
                { value: 'atrasada', label: 'Atrasada' },
              ]}
            />

            <Input
              label="Taxa de Juros ao Dia (%)"
              name="interest_rate"
              type="number"
              step="0.01"
              value={formData.interest_rate}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link href="/dashboard" style={{ textDecoration: 'none' }}>
              <Button variant="secondary">Cancelar</Button>
            </Link>
            <Button type="submit" variant="primary" loading={loading}>
              Salvar Cobrança
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
