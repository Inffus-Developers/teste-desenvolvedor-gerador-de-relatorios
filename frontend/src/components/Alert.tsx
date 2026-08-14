'use client';

export interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
}

export default function Alert({ variant = 'info', title, message, onClose }: AlertProps) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    success: { bg: 'rgba(34, 197, 94, 0.1)', text: 'var(--success)', border: 'var(--success)' },
    error: { bg: 'rgba(220, 38, 38, 0.1)', text: 'var(--danger)', border: 'var(--danger)' },
    warning: { bg: 'rgba(251, 146, 60, 0.1)', text: 'var(--warning)', border: 'var(--warning)' },
    info: { bg: 'rgba(59, 130, 246, 0.1)', text: 'var(--primary)', border: 'var(--primary)' },
  };

  const color = colors[variant];

  return (
    <div
      style={{
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <div>
        {title && (
          <p style={{ color: color.text, fontWeight: 600, margin: '0 0 0.25rem' }}>
            {title}
          </p>
        )}
        <p style={{ color: color.text, margin: 0 }}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: color.text,
            cursor: 'pointer',
            fontSize: '1.25rem',
            padding: 0,
            marginLeft: '1rem',
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
