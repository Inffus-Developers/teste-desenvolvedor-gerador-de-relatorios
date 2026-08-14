'use client';

export interface LoadingProps {
  fullscreen?: boolean;
  message?: string;
}

export default function Loading({ fullscreen = false, message = 'Carregando...' }: LoadingProps) {
  if (fullscreen) {
    return (
      <div
        className="flex items-center justify-center"
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--background)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{message}</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      <div
        style={{
          width: '2rem',
          height: '2rem',
          border: '2px solid var(--border)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem',
        }}
      />
      <p>{message}</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
