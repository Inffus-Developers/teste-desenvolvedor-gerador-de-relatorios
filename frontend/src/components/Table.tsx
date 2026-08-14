'use client';

import React from 'react';

export interface TableProps {
  headers: Array<{ key: string; label: string; sortable?: boolean; align?: 'left' | 'center' | 'right' }>;
  rows: Array<Record<string, any>>;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
}

export default function Table({
  headers,
  rows,
  onSort,
  sortKey,
  sortOrder,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado',
}: TableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                style={{
                  padding: '1rem 1.5rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  cursor: header.sortable && onSort ? 'pointer' : 'default',
                  textAlign: header.align || 'left',
                  userSelect: 'none',
                }}
                onClick={() => header.sortable && onSort && onSort(header.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {header.label}
                  {header.sortable && sortKey === header.key && (
                    <span style={{ fontSize: '0.75rem' }}>
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={headers.length}
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                Carregando...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                {headers.map((header) => (
                  <td
                    key={header.key}
                    style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: header.align || 'left',
                    }}
                  >
                    {row[header.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
