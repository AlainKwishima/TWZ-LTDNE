import { useCallback, useEffect, useState } from 'react';
import { Eye, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api, extractData, extractList } from '@/lib/api';
import { getPortalCustomerId } from '@/lib/portal-customer';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/States';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import type { PaginationMeta } from '@/lib/types';

type PageMode = 'admin' | 'Inspector' | 'User';

const SERVICE_TYPES = [
  { value: 'Inspection', label: 'Inspection' },
  { value: 'Refill', label: 'Refill' },
  { value: 'Replacement', label: 'Replacement' },
  { value: 'TechnicianVisit', label: 'Technician visit' },
] as const;

interface ServiceRequestActivity {
  id: string;
  eventType: string;
  description: string;
  actorRole?: string;
  oldStatus?: string;
  newStatus?: string;
  createdAt: string;
}

interface ServiceRequest {
  id: string;
  requestNumber?: string;
  type?: string;
  status?: string;
  description?: string;
  scheduledDate?: string;
  assetId?: string;
  customerId?: string;
  assignment?: { technicianId?: string; technicianName?: string; assignedAt?: string };
  activities?: ServiceRequestActivity[];
  notes?: { id: string; content: string; authorRole?: string; createdAt: string }[];
  completion?: { summary?: string; completedAt?: string; workPerformed?: string };
}

interface InspectorOption {
  id: string;
  fullName: string;
  email: string;
}

interface AssetOption {
  id: string;
  serialNumber?: string;
  assetCode?: string;
  type?: string;
  size?: string;
  location?: string | null;
}

function statusVariant(status?: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'InProgress':
    case 'Assigned':
      return 'default';
    case 'Cancelled':
      return 'destructive';
    default:
      return 'warning';
  }
}

export default function ServiceRequestsPage({ mode }: { mode: PageMode }) {
  const { user, refreshUser } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    assetId: '',
    type: 'Inspection' as (typeof SERVICE_TYPES)[number]['value'],
    description: '',
    scheduledDate: '',
    priority: 'normal',
  });

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<ServiceRequest | null>(null);
  const [selectedInspectorId, setSelectedInspectorId] = useState('');
  const [inspectors, setInspectors] = useState<InspectorOption[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<ServiceRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [completeForm, setCompleteForm] = useState({ summary: '', workPerformed: '' });

  const listPath =
    mode === 'User'
      ? '/services/requests/my'
      : mode === 'Inspector'
        ? '/services/requests/assigned'
        : '/services/requests';

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(listPath, { params: { page, limit: 10 } });
      const { items, meta: m } = extractList<ServiceRequest>(response);
      setRequests(items);
      setMeta(m);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [listPath, page]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const loadInspectors = useCallback(async () => {
    if (mode !== 'admin') return;
    try {
      const response = await api.get('/auth/users', { params: { role: 'Inspector', limit: 100 } });
      const { items } = extractList<{ id: string; fullName: string; email: string; role: string }>(response);
      setInspectors(
        items
          .filter((u) => u.role === 'Inspector')
          .map((u) => ({ id: u.id, fullName: u.fullName, email: u.email }))
      );
    } catch {
      setInspectors([]);
    }
  }, [mode]);

  useEffect(() => {
    void loadInspectors();
  }, [loadInspectors]);

  const openDetail = async (request: ServiceRequest) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailRequest(request);
    try {
      const response = await api.get(`/services/requests/${request.id}`);
      setDetailRequest(extractData<ServiceRequest>(response));
    } catch (err) {
      toast({ title: 'Could not load request', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setDetailLoading(false);
    }
  };

  const openAssign = (request: ServiceRequest) => {
    setAssignTarget(request);
    setSelectedInspectorId(request.assignment?.technicianId ?? '');
    setAssignOpen(true);
  };

  const loadAssetsForCustomer = async (portalUser = user) => {
    const customerId = getPortalCustomerId(portalUser);
    if (!customerId) {
      setAssets([]);
      return;
    }
    setAssetsLoading(true);
    try {
      const response = await api.get('/assets', { params: { limit: 50 } });
      const { items } = extractList<AssetOption>(response);
      setAssets(items);
      setCreateForm((f) => ({
        ...f,
        assetId: items.length > 0 ? (f.assetId && items.some((a) => a.id === f.assetId) ? f.assetId : items[0].id) : '',
      }));
      if (items.length === 0) {
        toast({
          title: 'No extinguishers found',
          description:
            'Register an asset under My Extinguishers first, or ask an administrator to assign one to your account.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      setAssets([]);
      toast({ title: 'Could not load assets', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setAssetsLoading(false);
    }
  };

  const openCreate = () => {
    setDialogOpen(true);
    void (async () => {
      const refreshed = await refreshUser().catch(() => user);
      await loadAssetsForCustomer(refreshed ?? user);
    })();
  };

  const handleCreate = async () => {
    if (!createForm.assetId || !createForm.description.trim()) {
      toast({ title: 'Missing fields', description: 'Select an extinguisher and describe the request.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const scheduledDate = createForm.scheduledDate
        ? new Date(createForm.scheduledDate).toISOString()
        : undefined;
      await api.post('/services/requests', {
        assetId: createForm.assetId,
        type: createForm.type,
        description: createForm.description.trim(),
        scheduledDate,
        priority: createForm.priority,
      });
      toast({ title: 'Maintenance request submitted' });
      setDialogOpen(false);
      void fetchRequests();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/services/requests/${id}/status`, { status });
      toast({ title: 'Status updated' });
      void fetchRequests();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handleAssign = async () => {
    if (!assignTarget || !selectedInspectorId) {
      toast({ title: 'Select an inspector', variant: 'destructive' });
      return;
    }
    const inspector = inspectors.find((i) => i.id === selectedInspectorId);
    setSaving(true);
    try {
      await api.patch(`/services/requests/${assignTarget.id}/assign`, {
        technicianId: selectedInspectorId,
        technicianName: inspector?.fullName,
      });
      toast({
        title: 'Inspector assigned',
        description: 'The portal user and inspector have been notified.',
      });
      setAssignOpen(false);
      setAssignTarget(null);
      void fetchRequests();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const canAssign = (status?: string) =>
    status === 'Pending' || status === 'Assigned';

  const handleComplete = async () => {
    if (!selectedId || !completeForm.summary.trim()) {
      toast({ title: 'Summary required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.post(`/services/requests/${selectedId}/complete`, {
        summary: completeForm.summary.trim(),
        workPerformed: completeForm.workPerformed.trim() || undefined,
      });
      toast({ title: 'Maintenance completed' });
      setCompleteOpen(false);
      setSelectedId(null);
      void fetchRequests();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === 'User'
      ? 'Maintenance Requests'
      : mode === 'Inspector'
        ? 'Assigned Maintenance'
        : 'Maintenance Requests';

  const description =
    mode === 'User'
      ? 'Schedule inspections, refills, and technician visits for your extinguishers'
      : mode === 'Inspector'
        ? 'Inspection and maintenance assignments'
        : 'Manage inspection and maintenance requests';

  return (
    <div className="space-y-8">
      <PageHeader
        title={title}
        description={description}
        actions={
          mode === 'User' ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Request maintenance
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchRequests} />
          ) : requests.length === 0 ? (
            <EmptyState
              title="No maintenance requests"
              description={
                mode === 'User'
                  ? 'Submit a request when you need an inspection or refill.'
                  : undefined
              }
              action={
                mode === 'User' ? (
                  <Button size="sm" onClick={openCreate}>
                    Request maintenance
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled</TableHead>
                    {mode === 'admin' && <TableHead>Inspector</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-extrabold text-slate-900">
                        {r.requestNumber ?? r.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{r.type ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(r.status)}>{r.status ?? 'Pending'}</Badge>
                      </TableCell>
                      <TableCell>
                        {r.scheduledDate ? formatDate(r.scheduledDate) : '—'}
                      </TableCell>
                      {mode === 'admin' && (
                        <TableCell className="text-sm text-slate-500">
                          {r.assignment?.technicianName ?? r.assignment?.technicianId?.slice(0, 8) ?? '—'}
                        </TableCell>
                      )}
                      <TableCell className="space-x-1 text-right">
                        <Button variant="ghost" size="sm" onClick={() => void openDetail(r)}>
                          <Eye className="mr-1 h-3 w-3" /> View
                        </Button>
                        {mode === 'admin' && canAssign(r.status) && (
                          <Button variant="azure" size="sm" onClick={() => openAssign(r)}>
                            {r.assignment ? 'Reassign' : 'Assign'}
                          </Button>
                        )}
                        {mode === 'Inspector' && r.status !== 'Completed' && r.status !== 'Cancelled' && (
                          <>
                            {r.status === 'Assigned' && (
                              <Button variant="azure" size="sm" onClick={() => updateStatus(r.id, 'InProgress')}>
                                Start
                              </Button>
                            )}
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedId(r.id);
                                setCompleteForm({ summary: '', workPerformed: '' });
                                setCompleteOpen(true);
                              }}
                            >
                              Complete
                            </Button>
                          </>
                        )}
                        {mode === 'admin' && r.status !== 'Completed' && r.status !== 'Cancelled' && (
                          <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, 'Cancelled')}>
                            Cancel
                          </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request maintenance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Extinguisher</Label>
              {assetsLoading ? (
                <p className="text-sm text-muted-foreground py-2">Loading your extinguishers…</p>
              ) : assets.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No extinguishers on your account yet. Add one from My Extinguishers, then try again.
                </p>
              ) : (
                <Select
                  value={createForm.assetId || undefined}
                  onValueChange={(v) => setCreateForm({ ...createForm, assetId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent>
                    {assets.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.serialNumber ?? a.assetCode ?? a.id.slice(0, 8)} — {a.type ?? 'Unit'} {a.size ?? ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Service type</Label>
              <Select
                value={createForm.type}
                onValueChange={(v) =>
                  setCreateForm({ ...createForm, type: v as (typeof SERVICE_TYPES)[number]['value'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Preferred date</Label>
              <Input
                type="datetime-local"
                value={createForm.scheduledDate}
                onChange={(e) => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Describe the maintenance needed"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || assetsLoading || assets.length === 0 || !createForm.assetId}>
              {saving ? 'Submitting...' : 'Submit request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign inspector</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Request {assignTarget?.requestNumber ?? assignTarget?.id.slice(0, 8)} — {assignTarget?.type}
          </p>
          <div>
            <Label>Inspector</Label>
            <Select value={selectedInspectorId || undefined} onValueChange={setSelectedInspectorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select inspector" />
              </SelectTrigger>
              <SelectContent>
                {inspectors.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.fullName} ({i.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {inspectors.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                No inspector accounts found. Create one under Users with the Inspector role.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleAssign()} disabled={saving || !selectedInspectorId}>
              {saving ? 'Assigning...' : 'Assign inspector'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request {detailRequest?.requestNumber ?? '—'}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <LoadingState message="Loading history..." />
          ) : detailRequest ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <p>
                  <span className="font-medium text-slate-700">Type:</span> {detailRequest.type}
                </p>
                <p>
                  <span className="font-medium text-slate-700">Status:</span>{' '}
                  <Badge variant={statusVariant(detailRequest.status)}>{detailRequest.status}</Badge>
                </p>
                <p className="sm:col-span-2">
                  <span className="font-medium text-slate-700">Description:</span>{' '}
                  {detailRequest.description ?? '—'}
                </p>
                {detailRequest.assignment && (
                  <p className="sm:col-span-2">
                    <span className="font-medium text-slate-700">Inspector:</span>{' '}
                    {detailRequest.assignment.technicianName ?? detailRequest.assignment.technicianId}
                  </p>
                )}
              </div>
              <div>
                <h4 className="mb-2 font-semibold text-slate-900">Activity history</h4>
                {detailRequest.activities?.length ? (
                  <ul className="max-h-48 space-y-2 overflow-y-auto">
                    {detailRequest.activities.map((a) => (
                      <li key={a.id} className="rounded-md border border-slate-100 bg-slate-50 p-2">
                        <p className="font-medium">{a.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(a.createdAt)}
                          {a.actorRole ? ` · ${a.actorRole}` : ''}
                          {a.newStatus ? ` · ${a.newStatus}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No activity recorded yet.</p>
                )}
              </div>
              {detailRequest.completion && (
                <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                  <p className="font-medium text-emerald-900">Completed</p>
                  <p>{detailRequest.completion.summary}</p>
                  {detailRequest.completion.workPerformed && (
                    <p className="mt-1 text-muted-foreground">{detailRequest.completion.workPerformed}</p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Summary</Label>
              <Input
                value={completeForm.summary}
                onChange={(e) => setCompleteForm({ ...completeForm, summary: e.target.value })}
              />
            </div>
            <div>
              <Label>Work performed</Label>
              <Input
                value={completeForm.workPerformed}
                onChange={(e) => setCompleteForm({ ...completeForm, workPerformed: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={saving}>
              {saving ? 'Saving...' : 'Mark complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
