import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getDashboardPath, useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/utils';
import { digitsOnly } from '@/lib/input-utils';
import type { OtpPurpose } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

type FormData = z.infer<typeof schema>;

export default function OtpVerificationPage() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; purpose?: OtpPurpose; redirect?: string } | null;
  const email = state?.email ?? '';
  const purpose = (state?.purpose ?? 'signup') as OtpPurpose;
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!email) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">No email provided. Please sign up or log in first.</p>
        <Button className="mt-4" asChild>
          <Link to="/login">Go to login</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    try {
      const result = await verifyOtp(email, data.code, purpose);
      if (result.user) {
        toast({ title: 'Welcome back!', description: `Signed in as ${result.user.fullName}` });
        navigate(state?.redirect ?? getDashboardPath(result.user.role));
        return;
      }
      if (purpose === 'signup') {
        toast({ title: 'Email verified', description: 'Your account is verified. Please sign in.' });
        navigate('/login', { state: { email, verified: true } });
        return;
      }
      if (purpose === 'password_reset') {
        toast({ title: 'OTP verified', description: 'Check your email for the reset link.' });
        navigate('/login');
        return;
      }
      toast({ title: 'Verified', description: result.message });
      navigate(state?.redirect ?? '/login');
    } catch (error) {
      toast({ title: 'Verification failed', description: getErrorMessage(error), variant: 'destructive' });
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp(email, purpose);
      toast({ title: 'OTP sent', description: 'A new code has been sent to your email.' });
    } catch (error) {
      toast({ title: 'Failed to resend', description: getErrorMessage(error), variant: 'destructive' });
    } finally {
      setResending(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900">
        {purpose === 'login' ? 'Complete sign in' : 'Verify your email'}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the 6-digit code sent to <strong>{email}</strong>. Check spam or promotions if you do not see it within a minute.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="text-center text-lg tracking-widest"
            {...register('code', {
              onChange: (e) => {
                e.target.value = digitsOnly(e.target.value, 6);
              },
            })}
          />
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Verifying...' : 'Verify'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Button variant="link" onClick={handleResend} disabled={resending}>
          {resending ? 'Sending...' : 'Resend code'}
        </Button>
      </div>
    </div>
  );
}
