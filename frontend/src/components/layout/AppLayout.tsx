'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authService, UserSession } from '@/services/auth';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(authService.getStoredUser());
  }, [router]);

  async function handleLogout() {
    await authService.logout();
    router.push('/login');
  }

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-900"
        style={{
          backgroundColor: '#3e5954',
          color: '#dff6e4',
          fontFamily: "'Poppins', 'Segoe UI', sans-serif",
        }}
      >
        <p className="font-medium animate-pulse">Verificando autenticação...</p>
      </div>
    );
  }

  const navLinks = [
    { label: 'Painel', href: '/dashboard' },
    { label: 'Clientes', href: '/customers' },
    { label: 'Cobranças', href: '/billings' },
    { label: 'Relatórios', href: '/reports' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{
        backgroundImage: "url('/simple-background.png')",
        fontFamily: "'Poppins', 'Segoe UI', sans-serif",
      }}
    >
      {/* Top Navbar com estilo do login */}
      <header
        className="border-b border-white/10 sticky top-0 z-40 backdrop-blur-md shadow-md"
        style={{
          backgroundColor: 'rgba(62, 89, 84, 0.95)',
          color: '#dff6e4',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Logo / Título */}
            <Link
              href="/dashboard"
              className="text-lg font-bold tracking-tight transition-opacity hover:opacity-90"
              style={{ color: '#dff6e4' }}
            >
              Teste Técnico Gerador de Relatórios
            </Link>

            {/* Links de Navegação */}
            <nav className="hidden md:flex gap-1.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'font-semibold shadow-sm'
                        : 'opacity-80 hover:opacity-100 hover:bg-black/15'
                    }`}
                    style={
                      isActive
                        ? {
                            backgroundColor: '#dff6e4',
                            color: '#3e5954',
                          }
                        : {
                            color: '#dff6e4',
                          }
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Dados do Usuário e Botão Sair */}
          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{user.name}</p>
              <p className="text-xs mt-1 opacity-75">{user.email}</p>
            </div>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-red-400/40 bg-red-950/40 hover:bg-red-900/60 text-red-200 transition-all active:scale-[0.98]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {children}
      </div>
    </div>
  );
}