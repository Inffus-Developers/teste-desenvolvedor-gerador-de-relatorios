'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Se já estiver autenticado, redireciona para o dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Enquanto verifica o token salvo, mostra tela de loading
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}
      >
        <div style={{ color: 'var(--text-muted)' }}>Verificando sessão...</div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Erro ao realizar login. Tente novamente.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center animate-fade-in"
      style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo / Header */}
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'var(--primary-glow)',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 700 }}>
              I
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
            Inffus
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sistema de Faturamento
          </p>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              borderLeft: '3px solid var(--danger)',
            }}
          >
            {error}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">
              E-mail Corporativo
            </label>
            <input
              id="email"
              type="email"
              className="input-field"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            id="btn-login"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={submitting}
          >
            {submitting ? 'Verificando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}
