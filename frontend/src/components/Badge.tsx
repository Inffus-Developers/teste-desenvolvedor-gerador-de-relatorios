'use client';

export interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  children: React.ReactNode;
}

export default function Badge({ variant = 'default', children }: BadgeProps) {
  const variantClass = {
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    info: 'badge',
    default: 'badge',
  }[variant];

  return <span className={variantClass}>{children}</span>;
}
