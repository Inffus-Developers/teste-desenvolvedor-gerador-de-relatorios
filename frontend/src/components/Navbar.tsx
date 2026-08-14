'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    try {
      await logout();
      addToast('Desconectado com sucesso', 'success');
      router.push('/');
    } catch (error) {
      addToast('Erro ao desconectar', 'error');
    }
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navItems = [
    { href: '/dashboard', label: 'Cobranças' },
    { href: '/dashboard/clients', label: 'Clientes' },
    { href: '/dashboard/reports', label: 'Relatórios' },
  ];

  return (
    <nav
      style={{
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '4rem',
        }}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--primary)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          💰 Faturamento
        </Link>

        {/* Menu Desktop */}
        <div
          className="navbar-desktop"
          style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: isActive(item.href) ? 'var(--primary)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: isActive(item.href) ? 600 : 500,
                borderBottom: isActive(item.href) ? '2px solid var(--primary)' : '2px solid transparent',
                paddingBottom: '0.5rem',
                transition: 'all 0.2s',
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Info + Logout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
              {user?.email || 'Usuário'}
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleLogout}
            style={{ minWidth: '100px' }}
          >
            Sair
          </Button>

          {/* Menu Mobile Button */}
          <button
            className="navbar-mobile-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text)',
              fontSize: '1.5rem',
              cursor: 'pointer',
            }}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {menuOpen && (
        <div
          className="navbar-mobile-menu"
          style={{
            borderTop: '1px solid var(--border)',
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '0.75rem 1rem',
                color: isActive(item.href) ? 'var(--primary)' : 'var(--text)',
                textDecoration: 'none',
                borderLeft: isActive(item.href) ? '3px solid var(--primary)' : 'none',
                borderRadius: '0.25rem',
              }}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
