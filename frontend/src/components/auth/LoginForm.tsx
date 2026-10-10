'use client';

import { useLogin } from '@/hooks/useLogin';

export function LoginForm() {
  const { fields, status, actions } = useLogin();

  return (
    <div
      className="w-full max-w-md rounded-2xl shadow-2xl p-8 border border-white/10 backdrop-blur-md"
      style={{
        backgroundColor: '#3e5954',
        color: '#dff6e4',
        fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      }}
    >
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Teste Técnico Gerador de Relatórios</h1>
        <p className="text-sm mt-1 opacity-80">Aplicação simples de faturamento com autenticação e um módulo de relatórios preparado para trabalhar com grandes volumes de dados.</p>
      </header>

      {status.errorMessage && (
        <div role="alert" className="mb-4 p-3 bg-red-950/70 border border-red-500/50 text-red-200 text-sm rounded-lg">
          {status.errorMessage}
        </div>
      )}

      <form onSubmit={actions.handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={fields.email}
            onChange={(e) => fields.setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-white/20 bg-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dff6e4]/50 focus:border-[#dff6e4] text-[#dff6e4] placeholder:text-[#dff6e4]/50"
            placeholder="Digite seu e-mail"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            value={fields.password}
            onChange={(e) => fields.setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-white/20 bg-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dff6e4]/50 focus:border-[#dff6e4] text-[#dff6e4] placeholder:text-[#dff6e4]/50"
            placeholder="Digite sua senha"
          />
        </div>

        <button
          type="submit"
          disabled={status.loading}
          className="w-full mt-3 py-2.5 px-4 font-semibold text-sm rounded-lg shadow-md transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-50"
          style={{
            backgroundColor: '#dff6e4',
            color: '#3e5954',
          }}
        >
          {status.loading ? 'Autenticando...' : 'Entrar no Sistema'}
        </button>
      </form>
    </div>
  );
}