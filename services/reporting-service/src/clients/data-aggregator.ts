import { ActiveReportType, ReportFilterInput, ReportDataSnapshot } from '../types/index.js';
import { fetchList, getUrls } from './http.client.js';

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function inDateRange(dateValue: unknown, filters: ReportFilterInput): boolean {
  const date = parseDate(dateValue);
  if (!date) return true;
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    if (date < from) return false;
  }
  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    if (date > to) return false;
  }
  return true;
}

function applyFilters(rows: Record<string, unknown>[], filters: ReportFilterInput): Record<string, unknown>[] {
  return rows.filter((row) => {
    if (filters.customerId && String(row.customerId ?? row.customer_id ?? '') !== filters.customerId) {
      return false;
    }
    if (filters.status && String(row.status ?? '') !== filters.status) {
      return false;
    }
    if (filters.technicianId && String(row.technicianId ?? row.technician_id ?? '') !== filters.technicianId) {
      return false;
    }
    const dateField = row.createdAt ?? row.serviceDate ?? row.date ?? row.registeredAt;
    if (!inDateRange(dateField, filters)) return false;
    return true;
  });
}

function snapshot(columns: string[], rows: Record<string, unknown>[]): ReportDataSnapshot {
  return { columns, rows };
}

export class DataAggregator {
  constructor(private headers: Record<string, string> = {}) {}

  async fetchReportData(
    reportType: ActiveReportType,
    filters: ReportFilterInput = {}
  ): Promise<{ snapshot: ReportDataSnapshot; summary: Record<string, unknown> }> {
    const urls = getUrls();

    switch (reportType) {
      case 'asset_inventory':
        return this.fetchAssets(urls.asset, filters);
      case 'expired_assets':
        return this.fetchAssets(urls.asset, { ...filters, status: filters.status || 'Expired' });
      case 'expiring_soon':
        return this.fetchAssets(urls.asset, { ...filters, status: filters.status || 'ExpiringSoon' });
      case 'service_requests':
        return this.fetchServiceRequests(urls.serviceRequest, filters);
      case 'notifications':
        return this.fetchNotifications(urls.notification, filters);
      default:
        return { snapshot: snapshot([], []), summary: {} };
    }
  }

  private async fetchAssets(baseUrl: string, filters: ReportFilterInput) {
    const assets = await fetchList<Record<string, unknown>>(baseUrl, '/assets', {
      headers: this.headers,
      params: {
        customerId: filters.customerId,
        status: filters.status,
      },
    });

    const rows = applyFilters(
      assets.map((a) => ({
        serialNumber: a.serialNumber ?? a.serial_number ?? a.assetCode ?? a.asset_code,
        assetCode: a.assetCode ?? a.asset_code,
        customerId: a.customerId ?? a.customer_id,
        type: a.type ?? a.productName ?? a.product_name,
        size: a.size ?? a.productId ?? a.product_id,
        status: a.status,
        expirationDate: a.expirationDate ?? a.expiration_date,
        installationDate: a.installationDate ?? a.installation_date ?? a.purchaseDate,
        nextServiceDate: a.nextServiceDate ?? a.next_service_date,
        location: a.location ?? a.installationLocation ?? a.installation_location,
        createdAt: a.createdAt ?? a.created_at,
      })),
      filters
    );

    return {
      snapshot: snapshot(
        ['serialNumber', 'type', 'size', 'status', 'installationDate', 'expirationDate', 'location'],
        rows
      ),
      summary: {
        totalFireExtinguishers: rows.length,
        assetCount: rows.length,
      },
    };
  }

  private serviceRequestPath(): string {
    const role = this.headers['X-User-Role'] ?? this.headers['x-user-role'];
    if (role === 'Inspector') return '/services/requests/assigned';
    if (role === 'User') return '/services/requests/my';
    return '/services/requests';
  }

  private async fetchServiceRequests(baseUrl: string, filters: ReportFilterInput) {
    const requests = await fetchList<Record<string, unknown>>(baseUrl, this.serviceRequestPath(), {
      headers: this.headers,
      params: {
        customerId: filters.customerId,
        status: filters.status,
        technicianId: filters.technicianId,
      },
    });

    const rows = applyFilters(
      requests.map((r) => {
        const assignment = (r.assignment ?? r.assignment) as Record<string, unknown> | undefined;
        const completion = (r.completion ?? r.completion) as Record<string, unknown> | undefined;
        return {
          id: r.id,
          requestNumber: r.requestNumber ?? r.request_number,
          customerId: r.customerId ?? r.customer_id,
          assetId: r.assetId ?? r.asset_id,
          type: r.type ?? r.serviceType ?? r.service_type,
          status: r.status,
          priority: r.priority,
          description: r.description,
          scheduledDate: r.scheduledDate ?? r.scheduled_date,
          inspectorId: assignment?.technicianId ?? r.technicianId ?? r.technician_id,
          inspectorName: assignment?.technicianName,
          assignedAt: assignment?.assignedAt,
          completedAt: completion?.completedAt,
          completionSummary: completion?.summary,
          createdAt: r.createdAt ?? r.created_at,
        };
      }),
      filters
    );

    return {
      snapshot: snapshot(
        [
          'requestNumber',
          'type',
          'status',
          'priority',
          'inspectorName',
          'scheduledDate',
          'completionSummary',
          'createdAt',
        ],
        rows
      ),
      summary: { requestCount: rows.length },
    };
  }

  private async fetchNotifications(baseUrl: string, filters: ReportFilterInput) {
    const notifications = await fetchList<Record<string, unknown>>(baseUrl, '/notifications', {
      headers: this.headers,
      params: { customerId: filters.customerId, status: filters.status },
    });

    const rows = applyFilters(
      notifications.map((n) => ({
        id: n.id,
        customerId: n.customerId ?? n.customer_id,
        channel: n.channel,
        status: n.status,
        subject: n.subject,
        createdAt: n.createdAt ?? n.created_at,
      })),
      filters
    );

    return {
      snapshot: snapshot(['id', 'channel', 'status', 'subject', 'createdAt'], rows),
      summary: { notificationCount: rows.length },
    };
  }
}
