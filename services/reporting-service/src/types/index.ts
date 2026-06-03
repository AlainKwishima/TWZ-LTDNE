export const ACTIVE_REPORT_TYPES = [
  'asset_inventory',
  'expired_assets',
  'expiring_soon',
  'service_requests',
  'notifications',
] as const;

/** Report types each role may generate and export. */
export const ROLE_REPORT_TYPES = {
  Admin: ACTIVE_REPORT_TYPES,
  Inspector: ['asset_inventory', 'expired_assets', 'expiring_soon', 'service_requests'] as const,
  User: ['asset_inventory', 'expired_assets', 'expiring_soon', 'service_requests'] as const,
} as const;

export type ActiveReportType = (typeof ACTIVE_REPORT_TYPES)[number];

export interface ReportFilterInput {
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  productType?: string;
  status?: string;
  technicianId?: string;
}

export interface ReportDataSnapshot {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface ServiceUrls {
  auth: string;
  asset: string;
  serviceRequest: string;
  notification: string;
}

export interface DashboardKpis {
  totalUsers: number;
  totalAssets: number;
  expiredAssets: number;
  expiringSoonAssets: number;
  openServiceRequests: number;
  unreadNotifications: number;
}

export interface ChartSeries {
  label: string;
  data: Array<{ x: string; y: number }>;
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

export const REPORT_TYPE_LABELS: Record<ActiveReportType, string> = {
  asset_inventory: 'Fire Extinguisher Inventory',
  expired_assets: 'Expired Assets Report',
  expiring_soon: 'Expiring Soon Report',
  service_requests: 'Service Requests Report',
  notifications: 'Notifications Report',
};

export type AnalyticsCacheKey = 'admin_dashboard' | `customer:${string}` | `technician:${string}`;
