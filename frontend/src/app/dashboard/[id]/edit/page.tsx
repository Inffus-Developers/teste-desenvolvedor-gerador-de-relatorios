'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Select, Card, Loading } from '@/components';

interface Charge {
  id: number;
  client_name: string;
  description: string;
  original_amount: number;
  issue_date: string;
  due_date: string;
  status: string;
  interest_rate: number;
}

export default function EditCharge() {
  const params = useParams();
  const chargeId = params.id as string;
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Charge>({
    id: 0,
    client_name: '',
    description: '',
    original_amount: 0,
    issue_date: '',
    due_date: '',
    status: 'pendente',
    interest_rate: 0,
  });

  useEffect(() => {
    fetchCharge();
  }, [chargeId]);

  const fetchCharge = async () => {
    try {
      const res = await api.get(`/charges/${chargeId}`);
      setFormData(res.data.data || res.data);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao carregar cobrança';
      addToast(message, 'error', 'Erro');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['original_amount', 'interest_rate'].includes(name) ? parseFloat(value) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.client_name.trim()) newErrors.client_name = 'Cliente é obrigatório';
    if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória';
    if (!formData.original_amount || formData.original_amount <= 0) newErrors.original_amount = 'Valor deve ser maior que 0';
    if (!formData.issue_date) newErrors.issue_date = 'Data de emissão é obrigatória';
    if (!formData.due_date) newErrors.due_date = 'Data de vencimento é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      await api.put(`/charges/${formData.id}`, formData);
      addToast('Cobrança atualizada com sucesso!', 'success', 'Sucesso');
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao atualizar cobrança';
      addToast(message, 'error', 'Erro');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

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
        <h1 style={{ margin: 0 }}>Editar Cobrança</h1>
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
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'pendente', label: 'Pendente' },
                { value: 'paga', label: 'Paga' },
                { value: 'atrasada', label: 'Atrasada' },
                { value: 'cancelada', label: 'Cancelada' },
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
            <Button variant="primary" type="submit" loading={saving}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
