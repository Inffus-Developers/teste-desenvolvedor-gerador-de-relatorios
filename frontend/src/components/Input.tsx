'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="input-group" style={{ marginBottom: error ? '0.5rem' : '1rem' }}>
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className="input-field"
        style={{
          borderColor: error ? 'var(--danger)' : undefined,
          backgroundColor: error ? 'rgba(220, 38, 38, 0.05)' : undefined,
        }}
        {...props}
      />
      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          {helperText}
        </p>
      )}
    </div>
  );
}
