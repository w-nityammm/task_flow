'use client';

import { Loader2 } from 'lucide-react';
import type { CSSProperties } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const styles: Record<string, CSSProperties> = {
  base: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    fontWeight: 500, borderRadius: 9, cursor: 'pointer',
    transition: 'all .15s', userSelect: 'none', fontFamily: 'inherit',
    outline: 'none',
  },
  primary: { background: 'hsl(var(--accent))', color: '#fff', border: 'none' },
  secondary: { background: 'hsl(var(--surface-elevated))', color: 'hsl(var(--text))', border: '1px solid hsl(var(--border))' },
  ghost: { background: 'transparent', color: 'hsl(var(--text-muted))', border: '1px solid transparent' },
  danger: { background: 'hsl(var(--danger) / 0.12)', color: 'hsl(var(--danger))', border: '1px solid hsl(var(--danger) / 0.3)' },
  sm: { height: 30, padding: '0 10px', fontSize: 12 },
  md: { height: 36, padding: '0 14px', fontSize: 13 },
  lg: { height: 42, padding: '0 20px', fontSize: 14 },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  style,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const combined: CSSProperties = {
    ...styles.base,
    ...styles[variant],
    ...styles[size],
    opacity: (disabled || loading) ? 0.5 : 1,
    cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
    ...style,
  };

  return (
    <button style={combined} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 size={13} style={{ animation: 'spin .65s linear infinite' }} /> : icon}
      {children}
    </button>
  );
}
