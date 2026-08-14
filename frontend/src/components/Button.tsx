'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = variant === 'primary' ? 'btn btn-primary' : variant === 'danger' ? 'btn' : variant === 'success' ? 'btn' : 'btn';
  
  const sizeStyles = {
    sm: { padding: '0.45rem 0.8rem', fontSize: '0.875rem' },
    md: { padding: '0.6rem 1rem', fontSize: '1rem' },
    lg: { padding: '0.8rem 1.5rem', fontSize: '1.125rem' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--primary)', color: 'white' },
    secondary: { background: 'var(--surface-hover)', color: 'var(--text)' },
    danger: { background: 'var(--danger-bg)', color: 'var(--danger)' },
    success: { background: 'var(--success-bg)', color: 'var(--success)' },
    warning: { background: 'var(--warning-bg)', color: 'var(--warning)' },
  };

  return (
    <button
      className={variantClass}
      disabled={disabled || loading}
      style={{
        ...sizeStyles[size],
        ...variantStyles[variant],
        opacity: disabled || loading ? 0.6 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}
      {...props}
    >
      {loading && (
        <div
          style={{
            width: '1rem',
            height: '1rem',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      )}
      {children}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
}
