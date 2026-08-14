'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { Button, Input, Select, Card } from '@/components';

export default function CreateClient() {
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    status: 'ativo',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.post('/clients', formData);
      addToast('Cliente criado com sucesso!', 'success', 'Sucesso');
      router.push('/dashboard/clients');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erro ao criar cliente';
      addToast(message, 'error', 'Erro');
    } finally {
      setLoading(false);
    }
  };

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
        <h1 style={{ margin: 0 }}>Novo Cliente</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <Input
              label="Nome completo"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            <Input
              label="Documento (CPF/CNPJ)"
              name="document"
              value={formData.document}
              onChange={handleChange}
            />
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'ativo', label: 'Ativo' },
                { value: 'inativo', label: 'Inativo' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <Link href="/dashboard/clients" style={{ textDecoration: 'none' }}>
              <Button variant="secondary">Cancelar</Button>
            </Link>
            <Button variant="primary" type="submit" loading={loading}>
              Salvar Cliente
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
