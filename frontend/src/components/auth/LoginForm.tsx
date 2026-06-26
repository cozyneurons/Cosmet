'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations';
import { z } from 'zod';

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setSubmitError('');
    try {
      await login(data.email, data.password);
      router.push('/analyze');
    } catch (err: any) {
      setSubmitError(err?.message || 'Invalid email or password');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-zinc-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
        <CardDescription className="text-center">
          Enter your email and password to access your ingredient safety analyzer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              required
              className={`bg-zinc-50 border-zinc-200 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {errors.email && (
              <p className="text-xs font-semibold text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              required
              className={`bg-zinc-50 border-zinc-200 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {errors.password && (
              <p className="text-xs font-semibold text-red-500">{errors.password.message}</p>
            )}
          </div>
          {submitError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
              {submitError}
            </div>
          )}
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Sign In'}
          </Button>
          <div className="text-center text-sm text-zinc-500 mt-4">
            Don't have an account?{' '}
            <a href="/register" className="text-indigo-600 hover:underline font-medium">
              Create one
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
