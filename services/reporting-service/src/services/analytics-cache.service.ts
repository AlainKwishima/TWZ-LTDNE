import { EventType } from '@fems/shared';
import {
  AnalyticsCacheKey,
  CustomerDashboardAnalytics,
  DashboardAnalytics,
  TechnicianDashboardAnalytics,
} from '../types/index.js';

interface CacheEntry<T> {
  data: T;
  updatedAt: number;
}

const TTL_MS = 5 * 60 * 1000;

export class AnalyticsCacheService {
  private cache = new Map<string, CacheEntry<unknown>>();
  private invalidationEvents = new Set<EventType>([
    EventType.ASSET_CREATED,
    EventType.ASSET_EXPIRED,
    EventType.ASSET_EXPIRING_SOON,
    EventType.SERVICE_REQUESTED,
    EventType.TECHNICIAN_ASSIGNED,
    EventType.SERVICE_COMPLETED,
    EventType.TECHNICIAN_ASSIGNED,
    EventType.NOTIFICATION_SENT,
    EventType.NOTIFICATION_ACKNOWLEDGED,
    EventType.REPORT_GENERATED,
    EventType.USER_REGISTERED,
  ]);

  shouldInvalidate(eventType: EventType): boolean {
    return this.invalidationEvents.has(eventType);
  }

  invalidate(key?: AnalyticsCacheKey | 'all'): void {
    if (!key || key === 'all') {
      this.cache.clear();
      return;
    }
    this.cache.delete(key);
    if (key === 'admin_dashboard') {
      for (const k of this.cache.keys()) {
        if (k.startsWith('customer:') || k.startsWith('technician:')) {
          this.cache.delete(k);
        }
      }
    }
  }

  invalidateCustomer(customerId: string): void {
    this.cache.delete(`customer:${customerId}`);
    this.cache.delete('admin_dashboard');
  }

  invalidateTechnician(technicianId: string): void {
    this.cache.delete(`technician:${technicianId}`);
    this.cache.delete('admin_dashboard');
  }

  getDashboard(): { data: DashboardAnalytics | null; stale: boolean } {
    return this.get<DashboardAnalytics>('admin_dashboard');
  }

  setDashboard(data: DashboardAnalytics): void {
    this.set('admin_dashboard', { ...data, cacheHit: true });
  }

  getCustomerDashboard(customerId: string): { data: CustomerDashboardAnalytics | null; stale: boolean } {
    return this.get<CustomerDashboardAnalytics>(`customer:${customerId}`);
  }

  setCustomerDashboard(customerId: string, data: CustomerDashboardAnalytics): void {
    this.set(`customer:${customerId}`, { ...data, cacheHit: true });
  }

  getTechnicianDashboard(technicianId: string): { data: TechnicianDashboardAnalytics | null; stale: boolean } {
    return this.get<TechnicianDashboardAnalytics>(`technician:${technicianId}`);
  }

  setTechnicianDashboard(technicianId: string, data: TechnicianDashboardAnalytics): void {
    this.set(`technician:${technicianId}`, { ...data, cacheHit: true });
  }

  handleEvent(eventType: EventType, payload: Record<string, unknown>): void {
    if (!this.shouldInvalidate(eventType)) return;

    this.invalidate('admin_dashboard');

    const customerId = payload.customerId as string | undefined;
    const technicianId = payload.technicianId as string | undefined;

    if (customerId) this.invalidateCustomer(customerId);
    if (technicianId) this.invalidateTechnician(technicianId);
  }

  private get<T>(key: string): { data: T | null; stale: boolean } {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return { data: null, stale: true };
    const stale = Date.now() - entry.updatedAt > TTL_MS;
    return { data: entry.data, stale };
  }

  private set<T>(key: string, data: T): void {
    this.cache.set(key, { data, updatedAt: Date.now() });
  }
}
