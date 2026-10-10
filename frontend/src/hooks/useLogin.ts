'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';

export function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');

    // Lê os valores reais do formulário (resolve a falha de autofill do navegador)
    const formData = new FormData(e.currentTarget);
    const resolvedEmail = (formData.get('email') as string) || email;
    const resolvedPassword = (formData.get('password') as string) || password;

    if (!resolvedEmail || !resolvedPassword) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setLoading(true);

    try {
      await authService.login({ email: resolvedEmail, password: resolvedPassword });
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na autenticação.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return {
    fields: {
      email,
      setEmail,
      password,
      setPassword,
    },
    status: {
      loading,
      errorMessage,
    },
    actions: {
      handleSubmit,
    },
  };
}