'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@/lib/validations';
import { z } from 'zod';

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const { register: signup, isLoading } = useAuth();
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      age_group: '',
      sex: 'Prefer not to say',
      country: '',
      password: '',
      confirmPassword: '',
    },
  });

  const ageGroupValue = watch('age_group');
  const sexValue = watch('sex');

  const onSubmit = async (data: RegisterFormValues) => {
    setSubmitError('');
    try {
      await signup({
        name: data.name,
        email: data.email,
        age_group: data.age_group,
        sex: data.sex,
        country: data.country || undefined,
        password: data.password,
      });
      router.push('/analyze');
    } catch (err: any) {
      setSubmitError(err?.message || 'Registration failed. Please check your credentials or try again.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-zinc-200">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
        <CardDescription className="text-center">
          Sign up to analyze cosmetic ingredient safety profiles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Alex Johnson"
              {...register('name')}
              required
              className={`bg-zinc-50 border-zinc-200 ${errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {errors.name && (
              <p className="text-xs font-semibold text-red-500">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age_group">Age Group</Label>
              <Select value={ageGroupValue} onValueChange={(value) => setValue('age_group', value || '')}>
                <SelectTrigger className={`bg-zinc-50 border-zinc-200 ${errors.age_group ? 'border-red-500 focus-visible:ring-red-500' : ''}`}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<18">Under 18</SelectItem>
                  <SelectItem value="18-25">18-25</SelectItem>
                  <SelectItem value="26-35">26-35</SelectItem>
                  <SelectItem value="36-45">36-45</SelectItem>
                  <SelectItem value="46-55">46-55</SelectItem>
                  <SelectItem value="56+">56+</SelectItem>
                </SelectContent>
              </Select>
              {errors.age_group && (
                <p className="text-xs font-semibold text-red-500">{errors.age_group.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sex">Biological Sex</Label>
              <Select value={sexValue} onValueChange={(value) => setValue('sex', value || 'Prefer not to say')}>
                <SelectTrigger className="bg-zinc-50 border-zinc-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              placeholder="United States"
              {...register('country')}
              className="bg-zinc-50 border-zinc-200"
            />
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
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              required
              className={`bg-zinc-50 border-zinc-200 ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {errors.confirmPassword && (
              <p className="text-xs font-semibold text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          {submitError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
              {submitError}
            </div>
          )}
          
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>

          <div className="text-center text-sm text-zinc-500 mt-4">
            Already have an account?{' '}
            <a href="/login" className="text-indigo-600 hover:underline font-medium">
              Sign in
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
