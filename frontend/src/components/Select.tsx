'use client';

import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ value: string; label: string }>;
  children?: React.ReactNode;
}

export default function Select({
  label,
  error,
  options,
  id,
  className = '',
  children,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="input-group" style={{ marginBottom: error ? '0.5rem' : '1rem' }}>
      {label && (
        <label className="input-label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <select
        id={selectId}
        className="input-field"
        style={{
          borderColor: error ? 'var(--danger)' : undefined,
          backgroundColor: error ? 'rgba(220, 38, 38, 0.05)' : undefined,
        }}
        {...props}
      >
        {options ? options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        )) : children}
      </select>
      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          {error}
        </p>
      )}
    </div>
  );
}
