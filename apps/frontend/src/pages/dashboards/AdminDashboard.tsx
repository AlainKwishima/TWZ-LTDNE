import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Bell, Box, ClipboardList, Users } from 'lucide-react';
import { api, extractData } from '@/lib/api';
import type { ApiResponse, DashboardAnalytics } from '@/lib/types';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { LoadingState, ErrorState } from '@/components/common/States';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CHART_BLUE = '#2563eb';
const CHART_SLATE = '#475569';
const CHART_AMBER = '#d97706';

export default function AdminDashboard({
  title = 'Admin Dashboard',
  description = 'Fire extinguisher operations, inspections, and maintenance overview',
}: {
  title?: string;
  description?: string;
}) {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<DashboardAnalytics>>('/analytics/dashboard');
      setData(extractData(response));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading dashboard analytics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!data) return <ErrorState message="No dashboard data available" />;

  const assetStatusData = data.charts.assetStatusBreakdown.data.map((d) => ({ name: d.x, count: d.y }));
  const requestStatusData = data.charts.serviceRequestsByStatus.data.map((d) => ({ name: d.x, count: d.y }));
  const maintenanceData = data.charts.maintenanceTrend.data.map((d) => ({ name: d.x, count: d.y }));

  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard label="Registered Users" value={data.kpis.totalUsers} icon={Users} accent="slate" />
        <StatsCard label="Total Assets" value={data.kpis.totalAssets} icon={Box} accent="blue" />
        <StatsCard
          label="Expiring Soon"
          value={data.kpis.expiringSoonAssets}
          icon={AlertTriangle}
          accent="amber"
        />
        <StatsCard
          label="Expired Assets"
          value={data.kpis.expiredAssets}
          icon={AlertTriangle}
          accent="rose"
          badge={data.kpis.expiredAssets > 0 ? 'Action Required' : undefined}
        />
        <StatsCard
          label="Open Maintenance Requests"
          value={data.kpis.openServiceRequests}
          icon={ClipboardList}
          accent="blue"
        />
        <StatsCard label="Unread Notifications" value={data.kpis.unreadNotifications} icon={Bell} accent="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {assetStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_BLUE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm font-medium text-slate-500">No assets yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance requests by status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {requestStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={requestStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={CHART_AMBER} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm font-medium text-slate-500">No maintenance requests yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming maintenance (by month)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {maintenanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={maintenanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke={CHART_SLATE} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm font-medium text-slate-500">No maintenance schedule data</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="font-mono text-[11px] font-bold text-slate-400">
        Last updated: {new Date(data.generatedAt).toLocaleString()}
        {data.cacheHit && ' (cached)'}
      </p>
    </div>
  );
}
