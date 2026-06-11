'use client';

import { forwardRef } from 'react';

const inputBase = {
  width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13,
  background: 'hsl(var(--surface-elevated))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--text))',
  outline: 'none', transition: 'border-color .15s',
  fontFamily: 'inherit',
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--text-muted))' }}>{label}</label>}
      <input ref={ref}
        style={{ ...inputBase, borderColor: error ? 'hsl(var(--danger))' : 'hsl(var(--border))', ...style }}
        onFocus={e => (e.target.style.borderColor = 'hsl(var(--primary))')}
        onBlur={e => (e.target.style.borderColor = error ? 'hsl(var(--danger))' : 'hsl(var(--border))')}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: 'hsl(var(--danger))' }}>{error}</span>}
    </div>
  )
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--text-muted))' }}>{label}</label>}
      <textarea ref={ref} rows={3}
        style={{ ...inputBase, resize: 'none', borderColor: error ? 'hsl(var(--danger))' : 'hsl(var(--border))', ...style } as React.CSSProperties}
        onFocus={e => (e.target.style.borderColor = 'hsl(var(--primary))')}
        onBlur={e => (e.target.style.borderColor = error ? 'hsl(var(--danger))' : 'hsl(var(--border))')}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: 'hsl(var(--danger))' }}>{error}</span>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, style, ...props }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--text-muted))' }}>{label}</label>}
      <select ref={ref}
        style={{ ...inputBase, appearance: 'none', borderColor: error ? 'hsl(var(--danger))' : 'hsl(var(--border))', ...style } as React.CSSProperties}
        onFocus={e => (e.target.style.borderColor = 'hsl(var(--primary))')}
        onBlur={e => (e.target.style.borderColor = error ? 'hsl(var(--danger))' : 'hsl(var(--border))')}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: 'hsl(var(--surface-elevated))' }}>{o.label}</option>
        ))}
      </select>
      {error && <span style={{ fontSize: 11, color: 'hsl(var(--danger))' }}>{error}</span>}
    </div>
  )
);
Select.displayName = 'Select';
