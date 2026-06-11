'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const maxWidths = { sm: 400, md: 520, lg: 700 };

  return (
    <div ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        position: 'relative', width: '100%', maxWidth: maxWidths[size],
        background: 'hsl(var(--surface))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 16, boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        animation: 'fade-in .18s ease both',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--text))' }}>{title}</h2>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 7, border: 'none', background: 'none',
            cursor: 'pointer', color: 'hsl(var(--text-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all .15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--surface-elevated))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--text))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--text-dim))'; }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}
