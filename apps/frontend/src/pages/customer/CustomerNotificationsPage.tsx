import { useCallback, useEffect, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import { Bell, Flame, ShoppingCart } from 'lucide-react';

import { api, extractList } from '@/lib/api';

import { formatDate, getErrorMessage } from '@/lib/utils';

import { PageHeader } from '@/components/common/PageHeader';

import { Pagination } from '@/components/common/Pagination';

import { LoadingState, ErrorState, EmptyState } from '@/components/common/States';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { Card, CardContent } from '@/components/ui/card';

import { toast } from '@/hooks/use-toast';

import type { PaginationMeta } from '@/lib/types';



interface Notification {

  id: string;

  subject?: string;

  body?: string;

  category?: string;

  seenAt?: string | null;

  createdAt?: string;

  eventPayload?: { assetId?: string; assetCode?: string; expirationDate?: string } | null;

}



function categoryVariant(category?: string): 'default' | 'secondary' | 'destructive' | 'warning' {

  switch (category?.toLowerCase()) {

    case 'expiry':

      return 'warning';

    case 'asset':

      return 'default';

    default:

      return 'secondary';

  }

}



function getAssetId(notification: Notification): string | undefined {

  const payload = notification.eventPayload;

  return payload && typeof payload.assetId === 'string' ? payload.assetId : undefined;

}



export default function CustomerNotificationsPage() {

  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [meta, setMeta] = useState<PaginationMeta>();

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [bookingId, setBookingId] = useState<string | null>(null);



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



  useEffect(() => {

    void fetchNotifications();

  }, [fetchNotifications]);



  const markSeen = async (id: string) => {

    try {

      await api.patch(`/notifications/${id}/seen`);

      toast({ title: 'Marked as read' });

      void fetchNotifications();

    } catch (err) {

      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });

    }

  };



  const bookRefill = async (assetId: string) => {

    setBookingId(assetId);

    try {

      await api.post(`/assets/${assetId}/book-refill`);

      toast({

        title: 'Refill booked',

        description: 'Reminders stop once you also mark the expiry alert as read.',

      });

      navigate('/user/shop');

    } catch (err) {

      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });

    } finally {

      setBookingId(null);

    }

  };



  const unreadCount = notifications.filter((n) => !n.seenAt).length;



  return (

    <div>

      <PageHeader

        title="Notifications"

        description="Expiry reminders start 2 months before your extinguisher expires and repeat until you mark them read and book a refill"

        actions={

          unreadCount > 0 ? (

            <Badge variant="warning">{unreadCount} unread</Badge>

          ) : undefined

        }

      />



      <Card >

        <CardContent className="pt-6">

          {loading ? (

            <LoadingState />

          ) : error ? (

            <ErrorState message={error} onRetry={fetchNotifications} />

          ) : notifications.length === 0 ? (

            <EmptyState

              title="No notifications yet"

              description="You will receive automatic email and in-app alerts starting 2 months before an extinguisher expires."

              action={

                <Button asChild variant="outline">

                  <Link to="/user/extinguishers">

                    <Flame className="mr-2 h-4 w-4" />

                    View my extinguishers

                  </Link>

                </Button>

              }

            />

          ) : (

            <>

              <div className="space-y-3">

                {notifications.map((n) => {

                  const unread = !n.seenAt;

                  const assetId = getAssetId(n);

                  const isExpiry = n.category?.toLowerCase() === 'expiry';

                  return (

                    <div

                      key={n.id}

                      className={`rounded-lg border p-4 transition-colors ${

                        unread ? 'border-blue-200 bg-blue-50/50' : 'bg-background'

                      }`}

                    >

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                        <div className="flex gap-3">

                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">

                            <Bell className="h-4 w-4" />

                          </div>

                          <div>

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="font-medium">{n.subject ?? 'Notification'}</p>

                              {n.category && (

                                <Badge variant={categoryVariant(n.category)}>{n.category}</Badge>

                              )}

                              {unread && <Badge variant="warning">New</Badge>}

                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>

                            <p className="mt-2 text-xs text-muted-foreground">

                              {n.createdAt ? formatDate(n.createdAt) : '—'}

                            </p>

                          </div>

                        </div>

                        <div className="flex flex-wrap gap-2">

                          {isExpiry && assetId && (

                            <Button

                              size="sm"

                              disabled={bookingId === assetId}

                              onClick={() => void bookRefill(assetId)}

                            >

                              <ShoppingCart className="mr-2 h-4 w-4" />

                              Book refill

                            </Button>

                          )}

                          {unread && (

                            <Button variant="outline" size="sm" onClick={() => void markSeen(n.id)}>

                              Mark as read

                            </Button>

                          )}

                        </div>

                      </div>

                    </div>

                  );

                })}

              </div>

              <Pagination meta={meta} onPageChange={setPage} />

            </>

          )}

        </CardContent>

      </Card>

    </div>

  );

}


