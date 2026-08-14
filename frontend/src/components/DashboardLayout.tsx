'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import ToastContainer from './ToastContainer';
import Loading from './Loading';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    } else if (!isLoading) {
      setIsReady(true);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isReady) {
    return <Loading fullscreen message="Carregando aplicação..." />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {children}
      </main>
      <ToastContainer />
    </div>
  );
}
