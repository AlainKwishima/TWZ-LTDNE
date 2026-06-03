import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, extractData, setAuthToken, getAuthToken } from './api';
import type { ApiResponse, AuthTokenResponse, LoginResponse, OtpPurpose, User, UserRole } from './types';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  loginWithGoogle: (credential: string, role?: UserRole) => Promise<AuthTokenResponse>;
  signup: (data: { email: string; password: string; firstName: string; lastName: string; phoneNumber?: string; role: UserRole }) => Promise<{ requiresOtp: boolean; email: string; role: UserRole; message: string }>;
  verifyOtp: (email: string, code: string, purpose: OtpPurpose) => Promise<LoginResponse>;
  resendOtp: (email: string, purpose: OtpPurpose) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  updateProfile: (data: { firstName?: string; lastName?: string; phoneNumber?: string }) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'Admin':
      return '/admin/dashboard';
    case 'Inspector':
      return '/inspector/dashboard';
    case 'User':
      return '/user/dashboard';
    default:
      return '/';
  }
}

export { getDashboardPath };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      return null;
    }
    const response = await api.get<ApiResponse<{ user: User; token?: string }>>('/auth/me');
    const data = extractData(response);
    if (data.token) {
      setAuthToken(data.token);
    }
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        if (getAuthToken()) {
          await refreshUser();
        }
      } catch {
        setAuthToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    void init();
  }, [refreshUser]);

  const handleAuthSuccess = useCallback((data: AuthTokenResponse) => {
    setAuthToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
    const data = extractData(response);
    if (data.token && data.user) {
      handleAuthSuccess({ token: data.token, user: data.user });
    }
    return data;
  }, [handleAuthSuccess]);

  const loginWithGoogle = useCallback(async (credential: string, role?: UserRole) => {
    const response = await api.post<ApiResponse<AuthTokenResponse>>('/auth/google', {
      credential,
      ...(role ? { role } : {}),
    });
    return handleAuthSuccess(extractData(response));
  }, [handleAuthSuccess]);

  const signup = useCallback(async (payload: { email: string; password: string; firstName: string; lastName: string; phoneNumber?: string; role: UserRole }) => {
    const response = await api.post<ApiResponse<{ requiresOtp: boolean; email: string; role: UserRole; message: string }>>('/auth/signup', payload);
    return extractData(response);
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string, purpose: OtpPurpose) => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/verify-otp', { email, code, purpose });
    const data = extractData(response);
    if (data.token && data.user) {
      handleAuthSuccess({ token: data.token, user: data.user });
    }
    return data;
  }, [handleAuthSuccess]);

  const resendOtp = useCallback(async (email: string, purpose: OtpPurpose) => {
    await api.post('/auth/resend-otp', { email, purpose });
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: { firstName?: string; lastName?: string; phoneNumber?: string }) => {
    const response = await api.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    const updated = extractData(response).user;
    setUser(updated);
    return updated;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.put('/auth/change-password', { currentPassword, newPassword });
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isLoading,
      isAuthenticated: !!user,
      login,
      loginWithGoogle,
      signup,
      verifyOtp,
      resendOtp,
      logout,
      refreshUser,
      updateProfile,
      changePassword,
    }),
    [user, isLoading, login, loginWithGoogle, signup, verifyOtp, resendOtp, logout, refreshUser, updateProfile, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
