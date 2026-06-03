export type UserRole = 'Admin' | 'Inspector' | 'User';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  errors?: unknown[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber?: string | null;
  role: UserRole;
  customerId?: string | null;
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
}

export interface AuthTokenResponse {
  token: string;
  user: User;
}

export interface LoginResponse {
  requiresOtp?: boolean;
  purpose?: string;
  email?: string;
  message?: string;
  verified?: boolean;
  token?: string;
  user?: User;
}

export interface DashboardKpis {
  totalUsers: number;
  totalAssets: number;
  expiredAssets: number;
  expiringSoonAssets: number;
  openServiceRequests: number;
  unreadNotifications: number;
}

export interface ChartPoint {
  x: string;
  y: number;
}

export interface ChartSeries {
  label: string;
  data: ChartPoint[];
}

export interface DashboardAnalytics {
  kpis: DashboardKpis;
  charts: {
    assetStatusBreakdown: ChartSeries;
    serviceRequestsByStatus: ChartSeries;
    maintenanceTrend: ChartSeries;
  };
  generatedAt: string;
  cacheHit: boolean;
}

export interface CustomerDashboardAnalytics {
  customerId: string;
  kpis: {
    totalAssets: number;
    activeAssets: number;
    expiredAssets: number;
    pendingServiceRequests: number;
  };
  charts: {
    assetStatus: ChartSeries;
    serviceRequestHistory: ChartSeries;
  };
  generatedAt: string;
  cacheHit: boolean;
}

export type OtpPurpose = 'signup' | 'login' | 'password_reset' | 'sensitive_action';

export type ReportType =
  | 'asset_inventory'
  | 'expired_assets'
  | 'expiring_soon'
  | 'service_requests'
  | 'notifications';

export const ROLE_REPORT_TYPES: Record<UserRole, ReportType[]> = {
  Admin: ['asset_inventory', 'expired_assets', 'expiring_soon', 'service_requests', 'notifications'],
  Inspector: ['asset_inventory', 'expired_assets', 'expiring_soon', 'service_requests'],
  User: ['asset_inventory', 'expired_assets', 'expiring_soon', 'service_requests'],
};

export type ExportFormat = 'pdf' | 'csv' | 'xlsx';

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  asset_inventory: 'Fire Extinguisher Inventory',
  expired_assets: 'Expired Assets Report',
  expiring_soon: 'Expiring Soon Report',
  service_requests: 'Maintenance Requests Report',
  notifications: 'Notifications Report',
};

export interface TechnicianDashboardAnalytics {
  technicianId: string;
  kpis: {
    totalAssets: number;
    assignedRequests: number;
    completedThisMonth: number;
    pendingRequests: number;
  };
  charts: {
    completionsByType: ChartSeries;
    requestsByStatus: ChartSeries;
  };
  generatedAt: string;
  cacheHit: boolean;
}

export const SIGNUP_ROLE_OPTIONS: Array<{ value: UserRole; label: string; description: string }> = [
  { value: 'User', label: 'User', description: 'Track extinguishers and request field service' },
  { value: 'Inspector', label: 'Inspector', description: 'Handle assigned maintenance work in the field' },
  { value: 'Admin', label: 'Admin', description: 'Full system administration access' },
];

export const OTP_PURPOSES = {
  SIGNUP: 'signup',
  LOGIN: 'login',
  PASSWORD_RESET: 'password_reset',
  SENSITIVE_ACTION: 'sensitive_action',
} as const;
