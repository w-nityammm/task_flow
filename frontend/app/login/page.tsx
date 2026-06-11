'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/inputs';
import { Button } from '@/components/ui/button';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormData = z.infer<typeof schema>;

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await login(data.email, data.password);
      window.location.href = searchParams.get('from') ?? '/';
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} id="login-email" autoComplete="email" {...register('email')} />
      <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} id="login-password" autoComplete="current-password" {...register('password')} />
      {apiError && (
        <div style={{ padding: '10px 14px', borderRadius: 9, background: 'hsl(var(--danger) / 0.1)', border: '1px solid hsl(var(--danger) / 0.3)', fontSize: 13, color: 'hsl(var(--danger))' }}>
          {apiError}
        </div>
      )}
      <Button type="submit" loading={isSubmitting} size="lg" style={{ width: '100%', marginTop: 4 }} id="login-submit">Sign In</Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 18, padding: 32,
          boxShadow: '0 30px 70px rgba(0,0,0,0.35)',
          animation: 'fade-in .2s ease both',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'hsl(var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 14H2L8 2Z" fill="white" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'hsl(var(--text))' }}>TaskFlow</div>
              <div style={{ fontSize: 11, color: 'hsl(var(--text-dim))' }}>Welcome back</div>
            </div>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--text))', marginBottom: 6 }}>Sign in</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', marginBottom: 22 }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: 'hsl(var(--accent))', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
          </p>

          <Suspense fallback={<div style={{ height: 140, borderRadius: 9, background: 'hsl(var(--surface-elevated))' }} />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
