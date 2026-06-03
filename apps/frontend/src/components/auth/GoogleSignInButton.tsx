import { GoogleLogin } from '@react-oauth/google';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDashboardPath, useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/types';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface GoogleSignInButtonProps {
  role?: UserRole;
}

export function GoogleSignInButton({ role }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  if (!googleClientId) {
    return null;
  }

  return (
    <div className="flex w-full justify-center">
      <GoogleLogin
        onSuccess={async (response) => {
          if (!response.credential) {
            toast({
              title: 'Google sign-in failed',
              description: 'No credential received from Google.',
              variant: 'destructive',
            });
            return;
          }
          try {
            const result = await loginWithGoogle(response.credential, role);
            if (result.user) {
              toast({ title: 'Welcome!', description: `Signed in as ${result.user.fullName}` });
              navigate(from ?? getDashboardPath(result.user.role));
            }
          } catch (error) {
            toast({
              title: 'Google sign-in failed',
              description: getErrorMessage(error),
              variant: 'destructive',
            });
          }
        }}
        onError={() => {
          toast({
            title: 'Google sign-in failed',
            description: 'Could not sign in with Google.',
            variant: 'destructive',
          });
        }}
        useOneTap={false}
        theme="outline"
        size="large"
        width="384"
        text="continue_with"
      />
    </div>
  );
}

export function AuthDivider() {
  if (!googleClientId) {
    return null;
  }

  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-white px-2 text-muted-foreground">Or</span>
      </div>
    </div>
  );
}
