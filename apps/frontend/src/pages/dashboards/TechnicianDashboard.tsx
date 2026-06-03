import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Flame } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, extractData } from '@/lib/api';
import type { ApiResponse, TechnicianDashboardAnalytics } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { StatsCard } from '@/components/common/StatsCard';
import { LoadingState, ErrorState } from '@/components/common/States';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TechnicianDashboard() {
  const [analytics, setAnalytics] = useState<TechnicianDashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashRes = await api.get<ApiResponse<TechnicianDashboardAnalytics>>('/analytics/inspector-dashboard');
      setAnalytics(extractData(dashRes));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  if (loading) return <LoadingState message="Loading inspector dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!analytics) return <ErrorState message="No dashboard data available" />;

  const statusData = analytics.charts.requestsByStatus.data.map((d) => ({ name: d.x, count: d.y }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inspector Dashboard"
        description="Assigned maintenance work and field work"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/inspector/reports">Reports</Link>
            </Button>
            <Button asChild>
              <Link to="/inspector/service-requests">View maintenance</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Extinguishers" value={analytics.kpis.totalAssets ?? 0} icon={Flame} accent="blue" />
        <StatsCard label="Assigned" value={analytics.kpis.assignedRequests} icon={ClipboardList} accent="slate" />
        <StatsCard
          label="Completed this month"
          value={analytics.kpis.completedThisMonth}
          icon={ClipboardList}
          accent="emerald"
        />
        <StatsCard label="Pending" value={analytics.kpis.pendingRequests} icon={ClipboardList} accent="amber" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests by status</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm font-medium text-slate-500">No assigned requests yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
