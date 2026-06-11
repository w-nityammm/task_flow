'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/inputs';
import { Button } from '@/components/ui/button';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await signup(data.email, data.password);
      window.location.href = '/';
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Signup failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, animation: 'fade-in .18s ease both' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'hsl(var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 14H2L8 2Z" fill="white" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'hsl(var(--text))' }}>TaskFlow</span>
        </div>

        {/* Card */}
        <div style={{
          background: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 14, padding: 28,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'hsl(var(--text))', marginBottom: 4 }}>Create account</h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', marginBottom: 22 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'hsl(var(--accent))', textDecoration: 'none' }}>Sign in</Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              id="signup-email"
              autoComplete="email"
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              error={errors.password?.message}
              id="signup-password"
              autoComplete="new-password"
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter password"
              error={errors.confirmPassword?.message}
              id="signup-confirm-password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />

            {apiError && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'hsl(var(--danger) / 0.1)', border: '1px solid hsl(var(--danger) / 0.25)', fontSize: 13, color: 'hsl(var(--danger))' }}>
                {apiError}
              </div>
            )}

            <Button type="submit" loading={isSubmitting} size="lg" style={{ width: '100%', marginTop: 4 }} id="signup-submit">
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
