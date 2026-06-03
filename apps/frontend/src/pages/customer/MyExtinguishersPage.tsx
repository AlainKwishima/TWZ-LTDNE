import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, extractList } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getPortalCustomerId } from '@/lib/portal-customer';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/States';
import { ComplianceBadge, mapAssetStatusToCompliance } from '@/components/common/ComplianceBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Flame, ShoppingCart, Trash2 } from 'lucide-react';
import type { PaginationMeta } from '@/lib/types';
import type { FireExtinguisherAsset } from '@/lib/asset';

type Asset = FireExtinguisherAsset & { serviceDate?: string | null };

function isExpiringWindow(status?: string, expirationDate?: string): boolean {
  if (status === 'ExpiringSoon' || status === 'Expired') return true;
  if (!expirationDate) return false;
  const days = Math.ceil((new Date(expirationDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return days <= 60;
}

export default function MyExtinguishersPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/assets', {
        params: { page, limit: 12 },
      });
      const { items, meta: m } = extractList<Asset>(response);
      setAssets(items);
      setMeta(m);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, getPortalCustomerId(user)]);

  useEffect(() => {
    void (async () => {
      await refreshUser().catch(() => undefined);
      await fetchAssets();
    })();
  }, [fetchAssets, refreshUser]);

  const removeAsset = async (asset: Asset) => {
    if (
      !window.confirm(
        `Remove fire extinguisher ${asset.serialNumber} from your account? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/assets/${asset.id}`);
      toast({ title: 'Extinguisher removed' });
      void fetchAssets();
    } catch (err) {
      toast({ title: 'Remove failed', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const bookRefill = async (assetId: string) => {
    setBookingId(assetId);
    try {
      await api.post(`/assets/${assetId}/book-refill`);
      toast({
        title: 'Refill booked',
        description: 'Mark the expiry notification as read to stop further reminders.',
      });
      void fetchAssets();
      navigate('/user/notifications');
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setBookingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Extinguishers"
        description="Automatic expiry reminders begin 2 months before the expiry date"
      />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={fetchAssets} /> : assets.length === 0 ? (
        <EmptyState
          title="No extinguishers registered"
          description="Extinguishers assigned to your account appear here. Ask an administrator to register assets under your user email."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => {
              const showRefill = isExpiringWindow(asset.status, asset.expirationDate) && !asset.refillBookedAt;
              return (
                <Card key={asset.id} className="relative overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-md">
                  <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-600" aria-hidden />
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-blue-100 bg-blue-50">
                        <Flame className="h-6 w-6 text-blue-600" />
                      </div>
                      <ComplianceBadge status={mapAssetStatusToCompliance(asset.status)} label={asset.status ?? 'Unknown'} />
                    </div>
                    <h3 className="mt-4 font-mono font-extrabold text-slate-900">{asset.serialNumber}</h3>
                    <p className="text-sm text-muted-foreground">
                      {asset.type} · {asset.size}
                    </p>
                    {asset.location && <p className="mt-2 text-sm">📍 {asset.location}</p>}
                    {asset.expirationDate && (
                      <p className="mt-1 text-sm text-muted-foreground">Expires: {formatDate(asset.expirationDate)}</p>
                    )}
                    {asset.refillBookedAt && (
                      <p className="mt-1 text-sm text-emerald-600">Refill booked: {formatDate(asset.refillBookedAt)}</p>
                    )}
                    {asset.serviceDate && (
                      <p className="text-sm text-muted-foreground">Last service: {formatDate(asset.serviceDate)}</p>
                    )}
                    <div className="mt-4 flex flex-col gap-2">
                      {showRefill && (
                        <Button
                          className="w-full"
                          size="sm"
                          disabled={bookingId === asset.id}
                          onClick={() => void bookRefill(asset.id)}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Book refill
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive"
                        onClick={() => void removeAsset(asset)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link to="/user/notifications">View expiry notifications</Link>
            </Button>
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

