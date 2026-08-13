'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
    }
  }, [router]);

  if (!mounted) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '2rem 1.5rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--primary)', margin: 0 }}>Inffus</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Workspace</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <Link href="/dashboard" style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--primary-glow)',
            color: 'var(--primary)',
            fontWeight: 500,
            transition: 'var(--transition)'
          }}>
            Cobranças
          </Link>
          <Link href="/dashboard/reports" style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
            fontWeight: 500,
            transition: 'var(--transition)'
          }}>
            Relatórios
          </Link>
        </nav>

        <button 
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            textAlign: 'left',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Sair da conta
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        <div className="container animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
