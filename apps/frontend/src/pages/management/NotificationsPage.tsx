import { useCallback, useEffect, useState } from 'react';
import { api, extractList } from '@/lib/api';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import type { PaginationMeta } from '@/lib/types';

interface Notification {
  id: string;
  subject?: string;
  body?: string;
  status?: string;
  category?: string;
  channel?: string;
  seenAt?: string | null;
  createdAt?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/notifications', { params: { page, limit: 10 } });
      const { items, meta: m } = extractList<Notification>(response);
      setNotifications(items);
      setMeta(m);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void fetchNotifications(); }, [fetchNotifications]);

  const markSeen = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/seen`);
      toast({ title: 'Marked as seen' });
      void fetchNotifications();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader title="Notifications" description="System notifications and alerts" />
      <Card >
        <CardContent className="pt-6">
          {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={fetchNotifications} /> : notifications.length === 0 ? <EmptyState title="No notifications" /> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div className="font-medium">{n.subject ?? 'Notification'}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{n.body}</div>
                      </TableCell>
                      <TableCell>{n.category ?? '—'}</TableCell>
                      <TableCell>{n.channel ?? '—'}</TableCell>
                      <TableCell><Badge variant={n.seenAt ? 'secondary' : 'default'}>{n.seenAt ? 'Seen' : 'Unread'}</Badge></TableCell>
                      <TableCell>{n.createdAt ? formatDate(n.createdAt) : '—'}</TableCell>
                      <TableCell className="text-right">
                        {!n.seenAt && (
                          <Button variant="ghost" size="sm" onClick={() => markSeen(n.id)}>Mark seen</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination meta={meta} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
