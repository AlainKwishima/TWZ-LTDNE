import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getDashboardPath, useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

const schema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const loginState = location.state as { email?: string; verified?: boolean } | null;
  const prefilledEmail = loginState?.email ?? '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: prefilledEmail, password: '' } });

  useEffect(() => {
    if (prefilledEmail) {
      setValue('email', prefilledEmail);
    }
    if (loginState?.verified) {
      toast({ title: 'Email verified', description: 'Sign in with your password to continue.' });
    }
  }, [prefilledEmail, loginState?.verified, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login(data.email, data.password);
      if (result.requiresOtp) {
        navigate('/verify-otp', {
          state: { email: result.email ?? data.email, purpose: result.purpose ?? 'signup', redirect: '/login' },
        });
        toast({ title: 'Verification required', description: result.message });
        return;
      }
      if (result.user) {
        toast({ title: 'Welcome back!', description: `Signed in as ${result.user.fullName}` });
        navigate(from ?? getDashboardPath(result.user.role));
      }
    } catch (error) {
      toast({ title: 'Login failed', description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900">Welcome back</h1>
      <p className="mt-2 text-sm font-medium text-slate-500">Sign in to your TWZ LTD account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput id="password" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <AuthDivider />
      <GoogleSignInButton />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/signup" className="font-medium text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
