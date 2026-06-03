import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, ClipboardList, Flame } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, extractData, extractList } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getPortalCustomerId } from '@/lib/portal-customer';
import type { ApiResponse, CustomerDashboardAnalytics } from '@/lib/types';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { ComplianceBadge, mapAssetStatusToCompliance } from '@/components/common/ComplianceBadge';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Asset {
  id: string;
  serialNumber: string;
  type: string;
  size: string;
  status?: string;
  expirationDate?: string;
  location?: string | null;
}

export default function CustomerDashboard() {
  const { user, refreshUser } = useAuth();
  const [analytics, setAnalytics] = useState<CustomerDashboardAnalytics | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let portalUser = user;
      if (!getPortalCustomerId(portalUser)) {
        portalUser = (await refreshUser()) ?? user;
      }

      const ownerUserId = getPortalCustomerId(portalUser);
      if (!ownerUserId) {
        setError('Your account scope is still being set up. Sign out and sign in again, or contact support.');
        return;
      }

      const params = { customerId: ownerUserId, refresh: 'true' };
      const [dashRes, assetsRes] = await Promise.all([
        api.get<ApiResponse<CustomerDashboardAnalytics>>('/analytics/user-dashboard', { params }),
        api.get<ApiResponse<Asset[]>>('/assets', { params: { limit: 5 } }),
      ]);
      setAnalytics(extractData(dashRes));
      setAssets(extractList(assetsRes).items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.customerId, refreshUser]);

  useEffect(() => {
    if (user) {
      void fetchData();
    }
  }, [user?.id, fetchData]);

  if (loading) return <LoadingState message="Loading your dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const serviceHistory =
    analytics?.charts.serviceRequestHistory.data.map((d) => ({ name: d.x, requests: d.y })) ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome, ${user?.firstName ?? 'User'}`}
        description="Your extinguishers, maintenance requests, and compliance at a glance"
        actions={
          <Button asChild variant="outline">
            <Link to="/user/extinguishers">My Extinguishers</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Extinguishers" value={analytics?.kpis.totalAssets ?? 0} icon={Flame} accent="blue" />
        <StatsCard
          label="Active"
          value={analytics?.kpis.activeAssets ?? 0}
          icon={Flame}
          accent="emerald"
          badge="Compliant"
        />
        <StatsCard label="Expired" value={analytics?.kpis.expiredAssets ?? 0} icon={AlertTriangle} accent="rose" />
        <StatsCard
          label="Pending Service"
          value={analytics?.kpis.pendingServiceRequests ?? 0}
          icon={ClipboardList}
          accent="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-blue-600" />
              Maintenance request activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serviceHistory.length === 0 ? (
              <EmptyState
                title="No maintenance requests yet"
                action={
                  <Button asChild size="sm">
                    <Link to="/user/service-requests">Request maintenance</Link>
                  </Button>
                }
              />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={serviceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="requests" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-blue-600" />
              My Extinguishers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <EmptyState
                title="No registered extinguishers"
                description="Contact your administrator to register assets for your account."
              />
            ) : (
              <ul className="space-y-3">
                {assets.map((asset) => (
                  <li
                    key={asset.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors duration-200 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-mono text-sm font-extrabold text-slate-900">
                        {asset.type} {asset.size} ({asset.serialNumber})
                      </p>
                      {asset.expirationDate && (
                        <p className="font-mono text-[11px] font-bold text-slate-400">
                          Expires {formatDate(asset.expirationDate)}
                        </p>
                      )}
                    </div>
                    <ComplianceBadge status={mapAssetStatusToCompliance(asset.status)} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-blue-600" />
              Quick links
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="azure">
              <Link to="/user/service-requests">Maintenance requests</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/user/notifications">Notifications</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/user/extinguishers">All extinguishers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
