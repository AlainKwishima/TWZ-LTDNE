import { fetchList, fetchListTotal, getUrls } from '../clients/http.client.js';
import { AnalyticsCacheService } from './analytics-cache.service.js';
import {
  ChartSeries,
  CustomerDashboardAnalytics,
  DashboardAnalytics,
  TechnicianDashboardAnalytics,
} from '../types/index.js';

function groupCount(items: Record<string, unknown>[], field: string): ChartSeries {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = String(item[field] ?? 'unknown');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return {
    label: field,
    data: Array.from(counts.entries()).map(([x, y]) => ({ x, y })),
  };
}

function monthlyTrend(items: Record<string, unknown>[], dateField: string): ChartSeries {
  const buckets = new Map<string, number>();
  for (const item of items) {
    const raw = item[dateField];
    if (!raw) continue;
    const month = new Date(String(raw)).toISOString().slice(0, 7);
    buckets.set(month, (buckets.get(month) ?? 0) + 1);
  }
  const sorted = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
  return { label: 'trend', data: sorted.map(([x, y]) => ({ x, y })) };
}

export class AnalyticsService {
  constructor(
    private cache: AnalyticsCacheService,
    private headers: Record<string, string> = {}
  ) {}

  async getAdminDashboard(forceRefresh = false): Promise<DashboardAnalytics> {
    const cached = this.cache.getDashboard();
    if (!forceRefresh && cached.data && !cached.stale) {
      return { ...cached.data, cacheHit: true };
    }

    const urls = getUrls();
    const [totalUsers, assets, serviceRequests, notifications] = await Promise.all([
      fetchListTotal(urls.auth, '/users', { headers: this.headers }).catch(() => 0),
      fetchList<Record<string, unknown>>(urls.asset, '/assets', { headers: this.headers }),
      fetchList<Record<string, unknown>>(urls.serviceRequest, '/services/requests', { headers: this.headers }),
      fetchList<Record<string, unknown>>(urls.notification, '/notifications', { headers: this.headers }),
    ]);

    const statusKey = (a: Record<string, unknown>) => String(a.status ?? '');
    const expiredAssets = assets.filter((a) => statusKey(a).toLowerCase() === 'expired').length;
    const expiringSoonAssets = assets.filter((a) => {
      const s = statusKey(a);
      return s === 'ExpiringSoon' || s.toLowerCase() === 'expiring_soon' || s.toLowerCase() === 'expiringsoon';
    }).length;
    const openServiceRequests = serviceRequests.filter(
      (r) => !['completed', 'cancelled'].includes(String(r.status).toLowerCase())
    ).length;
    const unreadNotifications = notifications.filter(
      (n) => String(n.status).toLowerCase() !== 'read'
    ).length;

    const result: DashboardAnalytics = {
      kpis: {
        totalUsers,
        totalAssets: assets.length,
        expiredAssets,
        expiringSoonAssets,
        openServiceRequests,
        unreadNotifications,
      },
      charts: {
        assetStatusBreakdown: groupCount(assets, 'status'),
        serviceRequestsByStatus: groupCount(serviceRequests, 'status'),
        maintenanceTrend: monthlyTrend(
          assets.filter((a) => a.nextServiceDate ?? a.next_service_date),
          'nextServiceDate'
        ),
      },
      generatedAt: new Date().toISOString(),
      cacheHit: false,
    };

    this.cache.setDashboard(result);
    return result;
  }

  async getCustomerDashboard(customerId: string, forceRefresh = false): Promise<CustomerDashboardAnalytics> {
    const cached = this.cache.getCustomerDashboard(customerId);
    if (!forceRefresh && cached.data && !cached.stale) {
      return { ...cached.data, cacheHit: true };
    }

    const urls = getUrls();
    const headers = this.headers;

    const [assets, serviceRequests] = await Promise.all([
      fetchList<Record<string, unknown>>(urls.asset, '/assets', { headers }),
      fetchList<Record<string, unknown>>(urls.serviceRequest, '/services/requests/my', {
        headers,
      }),
    ]);

    const activeAssets = assets.filter((a) => String(a.status).toLowerCase() === 'active').length;
    const expiredAssets = assets.filter((a) => String(a.status).toLowerCase() === 'expired').length;
    const pendingServiceRequests = serviceRequests.filter(
      (r) => !['completed', 'cancelled'].includes(String(r.status).toLowerCase())
    ).length;

    const result: CustomerDashboardAnalytics = {
      customerId,
      kpis: {
        totalAssets: assets.length,
        activeAssets,
        expiredAssets,
        pendingServiceRequests,
      },
      charts: {
        assetStatus: groupCount(assets, 'status'),
        serviceRequestHistory: monthlyTrend(serviceRequests, 'createdAt'),
      },
      generatedAt: new Date().toISOString(),
      cacheHit: false,
    };

    this.cache.setCustomerDashboard(customerId, result);
    return result;
  }

  async getTechnicianDashboard(technicianId: string, forceRefresh = false): Promise<TechnicianDashboardAnalytics> {
    const cached = this.cache.getTechnicianDashboard(technicianId);
    if (!forceRefresh && cached.data && !cached.stale) {
      return { ...cached.data, cacheHit: true };
    }

    const urls = getUrls();
    const [assets, requests] = await Promise.all([
      fetchList<Record<string, unknown>>(urls.asset, '/assets', { headers: this.headers }),
      fetchList<Record<string, unknown>>(urls.serviceRequest, '/services/requests/assigned', {
        headers: this.headers,
      }),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const assignedRequests = requests.length;
    const completedThisMonth = requests.filter((r) => {
      if (String(r.status).toLowerCase() !== 'completed') return false;
      const completedAt = r.completedAt ?? r.completed_at ?? r.updatedAt ?? r.updated_at;
      if (!completedAt) return false;
      return new Date(String(completedAt)) >= monthStart;
    }).length;
    const pendingRequests = requests.filter(
      (r) => !['completed', 'cancelled'].includes(String(r.status).toLowerCase())
    ).length;

    const result: TechnicianDashboardAnalytics = {
      technicianId,
      kpis: {
        totalAssets: assets.length,
        assignedRequests,
        completedThisMonth,
        pendingRequests,
      },
      charts: {
        completionsByType: groupCount(
          requests.filter((r) => String(r.status).toLowerCase() === 'completed'),
          'serviceType'
        ),
        requestsByStatus: groupCount(requests, 'status'),
      },
      generatedAt: new Date().toISOString(),
      cacheHit: false,
    };

    this.cache.setTechnicianDashboard(technicianId, result);
    return result;
  }

  withHeaders(headers: Record<string, string>): AnalyticsService {
    return new AnalyticsService(this.cache, headers);
  }
}
