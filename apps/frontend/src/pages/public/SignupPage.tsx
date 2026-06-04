import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/utils';
import { isValidPhone, phoneOnly } from '@/lib/input-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { OTP_PURPOSES, SIGNUP_ROLE_OPTIONS, type UserRole } from '@/lib/types';
import { AuthDivider, GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z
    .string()
    .optional()
    .refine((value) => isValidPhone(value), 'Phone must contain numbers only (optional leading +)'),
  role: z.enum(['Admin', 'Inspector', 'User']),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'User' },
  });

  const selectedRole = watch('role');
  const selectedRoleInfo = SIGNUP_ROLE_OPTIONS.find((option) => option.value === selectedRole);

  const onSubmit = async (data: FormData) => {
    try {
      const result = await signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || undefined,
        role: data.role as UserRole,
      });
      toast({
        title: result.message.toLowerCase().includes('pending') ? 'Verification code sent' : 'Account created',
        description: result.message,
      });
      navigate('/verify-otp', { state: { email: data.email, purpose: OTP_PURPOSES.SIGNUP, redirect: '/login' } });
    } catch (error) {
      const message = getErrorMessage(error);
      const isPendingResend = message.toLowerCase().includes('pending account');
      if (isPendingResend) {
        toast({ title: 'Verification code sent', description: message });
        navigate('/verify-otp', {
          state: { email: data.email, purpose: OTP_PURPOSES.SIGNUP, redirect: '/login' },
        });
        return;
      }
      const isAlreadyRegistered = message.toLowerCase().includes('already registered');
      if (isAlreadyRegistered) {
        toast({
          title: 'Email already in use',
          description: message,
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-slate-900">Create account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Choose your role and get started with TWZ LTD</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" placeholder="John" {...register('firstName')} />
            {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" placeholder="Doe" {...register('lastName')} />
            {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone (optional)</Label>
          <Input
            id="phoneNumber"
            inputMode="tel"
            placeholder="+250 788 000 000"
            {...register('phoneNumber', {
              onChange: (e) => {
                e.target.value = phoneOnly(e.target.value);
              },
            })}
          />
          {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="new-password" {...register('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput id="confirmPassword" autoComplete="new-password" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <AuthDivider />
      <GoogleSignInButton role={selectedRole as UserRole} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
