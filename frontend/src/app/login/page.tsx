import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login - Teste Gerador de Relatórios',
  description: 'Autenticação no sistema gerador de relatórios',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-cover bg-center bg-no-repeat bg-fixed relative flex items-center justify-center bg-slate-100 p-4" style={{ backgroundImage: "url('/login-background.png')" }}>
<div className="relative z-10 w-full min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Primeira metade (esquerda) - livre para a imagem de fundo */}
        <div className="hidden md:block" />

        {/* Segunda metade (direita) - card centralizado exatamente no meio dela */}
        <div className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}