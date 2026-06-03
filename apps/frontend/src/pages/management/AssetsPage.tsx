import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2, Wrench } from 'lucide-react';
import { api, extractData, extractList } from '@/lib/api';
import { getPortalCustomerId } from '@/lib/portal-customer';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Pagination } from '@/components/common/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/States';
import { ComplianceBadge, mapAssetStatusToCompliance } from '@/components/common/ComplianceBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import type { PaginationMeta, UserRole } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ASSET_SIZE_SUGGESTIONS,
  ASSET_STATUS_OPTIONS,
  ASSET_TYPE_SUGGESTIONS,
  type FireExtinguisherAsset,
} from '@/lib/asset';

type Asset = FireExtinguisherAsset & { nextServiceDate?: string | null };

interface TimelineEntry {
  id: string;
  eventType?: string;
  description?: string;
  createdAt: string;
}

interface ServiceRecord {
  id: string;
  serviceType: string;
  serviceDate: string;
  technicianName?: string;
  notes?: string;
}

interface PortalUserOption {
  id: string;
  email: string;
  fullName: string;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultExpiryIsoDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return d.toISOString().slice(0, 10);
}

const emptyForm = {
  ownerUserId: '',
  location: '',
  type: '',
  size: '',
  installationDate: todayIsoDate(),
  expiryDate: defaultExpiryIsoDate(),
  status: 'Active' as (typeof ASSET_STATUS_OPTIONS)[number],
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [portalUsers, setPortalUsers] = useState<PortalUserOption[]>([]);
  const [editForm, setEditForm] = useState({
    ownerUserId: '',
    location: '',
    type: '',
    size: '',
    installationDate: '',
    expiryDate: '',
    status: 'Active' as (typeof ASSET_STATUS_OPTIONS)[number],
    notes: '',
    nextServiceDate: '',
  });
  const [serviceForm, setServiceForm] = useState({
    serviceType: 'Inspection',
    notes: '',
    technicianName: '',
  });
  const [timeline, setTimeline] = useState<{ histories: TimelineEntry[]; serviceRecords: ServiceRecord[] } | null>(
    null
  );
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailTab, setDetailTab] = useState<'edit' | 'timeline' | 'service'>('edit');

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/assets', { params: { page, limit: 10, search: search || undefined } });
      const { items, meta: m } = extractList<Asset>(response);
      setAssets(items);
      setMeta(m);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void fetchAssets();
  }, [fetchAssets]);

  const loadPortalUsers = useCallback(async () => {
    try {
      const response = await api.get('/auth/users', { params: { role: 'User', limit: 100 } });
      const { items } = extractList<{
        id: string;
        email: string;
        fullName: string;
        role: UserRole;
        customerId?: string | null;
      }>(response);
      setPortalUsers(
        items
          .filter((u) => u.role === 'User')
          .map((u) => ({
            id: getPortalCustomerId({ id: u.id, role: u.role, customerId: u.customerId }) ?? u.id,
            email: u.email,
            fullName: u.fullName,
          }))
      );
    } catch {
      setPortalUsers([]);
    }
  }, []);

  useEffect(() => {
    void loadPortalUsers();
  }, [loadPortalUsers]);

  const loadTimeline = async (assetId: string) => {
    setTimelineLoading(true);
    try {
      const response = await api.get(`/assets/${assetId}/timeline`);
      setTimeline(extractData(response));
    } catch (err) {
      toast({ title: 'Timeline error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setTimelineLoading(false);
    }
  };

  const openDetail = (asset: Asset) => {
    setSelected(asset);
    setEditForm({
      ownerUserId: asset.customerId ?? '',
      location: asset.location ?? '',
      type: asset.type,
      size: asset.size,
      installationDate: asset.installationDate?.slice(0, 10) ?? '',
      expiryDate: asset.expirationDate?.slice(0, 10) ?? '',
      status: (asset.status ?? 'Active') as (typeof ASSET_STATUS_OPTIONS)[number],
      notes: asset.notes ?? '',
      nextServiceDate: asset.nextServiceDate?.slice(0, 10) ?? '',
    });
    setDetailTab('edit');
    setDetailOpen(true);
    void loadTimeline(asset.id);
  };

  const handleRegister = async () => {
    if (!form.ownerUserId || !form.location.trim() || !form.type.trim() || !form.size.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Select an owner, location, type, and size.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await api.post('/assets', {
        ownerUserId: form.ownerUserId,
        location: form.location.trim(),
        type: form.type.trim(),
        size: form.size.trim(),
        installationDate: form.installationDate,
        expiryDate: form.expiryDate,
        status: form.status,
      });
      toast({ title: 'Asset registered' });
      setDialogOpen(false);
      setForm(emptyForm);
      void fetchAssets();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(`/assets/${selected.id}`, {
        ownerUserId: editForm.ownerUserId || undefined,
        location: editForm.location.trim() || undefined,
        type: editForm.type.trim() || undefined,
        size: editForm.size.trim() || undefined,
        installationDate: editForm.installationDate || undefined,
        expiryDate: editForm.expiryDate || undefined,
        status: editForm.status,
        notes: editForm.notes || undefined,
        nextServiceDate: editForm.nextServiceDate
          ? new Date(`${editForm.nextServiceDate}T12:00:00.000Z`).toISOString()
          : undefined,
      });
      toast({ title: 'Asset updated' });
      setDetailOpen(false);
      void fetchAssets();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (
      !window.confirm(
        `Remove fire extinguisher ${asset.serialNumber}? This cannot be undone. Linked service request history may reference this asset.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/assets/${asset.id}`);
      toast({ title: 'Extinguisher removed' });
      if (selected?.id === asset.id) setDetailOpen(false);
      void fetchAssets();
    } catch (err) {
      toast({ title: 'Remove failed', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const handleServiceRecord = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post(`/assets/${selected.id}/service-records`, serviceForm);
      toast({ title: 'Service record added' });
      setServiceForm({ serviceType: 'Inspection', notes: '', technicianName: '' });
      void loadTimeline(selected.id);
      void fetchAssets();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Assets"
        description="Track extinguishers, edit details, and log maintenance"
        actions={
          <Button
            onClick={() => {
              setForm({ ...emptyForm, installationDate: todayIsoDate(), expiryDate: defaultExpiryIsoDate() });
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Register Asset
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchAssets} />
          ) : assets.length === 0 ? (
            <EmptyState title="No assets" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Installed</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono font-extrabold text-slate-900">
                        {a.serialNumber ?? a.assetCode ?? a.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{a.type}</TableCell>
                      <TableCell>{a.size}</TableCell>
                      <TableCell>{a.location ?? '—'}</TableCell>
                      <TableCell className="text-center">
                        <ComplianceBadge status={mapAssetStatusToCompliance(a.status)} label={a.status ?? 'Unknown'} />
                      </TableCell>
                      <TableCell>{a.installationDate ? formatDate(a.installationDate) : '—'}</TableCell>
                      <TableCell>{a.expirationDate ? formatDate(a.expirationDate) : '—'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => openDetail(a)}>
                          <Pencil className="mr-1 h-3 w-3" /> Manage
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void handleDelete(a)}>
                          <Trash2 className="mr-1 h-3 w-3 text-destructive" /> Remove
                        </Button>
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
            <DialogTitle>Register Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Serial number is assigned automatically when you register.</p>
            <div>
              <Label>Assigned owner</Label>
              <Select
                value={form.ownerUserId || undefined}
                onValueChange={(v) => setForm({ ...form, ownerUserId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select portal user" />
                </SelectTrigger>
                <SelectContent>
                  {portalUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {portalUsers.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">No User-role accounts found. Create one under Users.</p>
              )}
            </div>
            <div>
              <Label>Location</Label>
              <Input
                placeholder="e.g. Ground floor lobby"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Type</Label>
                <Input
                  list="asset-type-suggestions"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
                <datalist id="asset-type-suggestions">
                  {ASSET_TYPE_SUGGESTIONS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Size</Label>
                <Input
                  list="asset-size-suggestions"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                />
                <datalist id="asset-size-suggestions">
                  {ASSET_SIZE_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Installation date</Label>
                <Input
                  type="date"
                  value={form.installationDate}
                  onChange={(e) => setForm({ ...form, installationDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Expiry date</Label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={saving}>
              {saving ? 'Saving...' : 'Register'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset {selected?.serialNumber ?? selected?.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 border-b border-slate-200 pb-2">
            {(['edit', 'timeline', 'service'] as const).map((tab) => (
              <Button
                key={tab}
                variant={detailTab === tab ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDetailTab(tab)}
              >
                {tab === 'service' ? (
                  <>
                    <Wrench className="mr-1 h-3 w-3" /> Service record
                  </>
                ) : (
                  tab.charAt(0).toUpperCase() + tab.slice(1)
                )}
              </Button>
            ))}
          </div>
          {detailTab === 'edit' && (
            <div className="space-y-4 pt-4">
              <div>
                <Label>Owner account</Label>
                <Select
                  value={editForm.ownerUserId || undefined}
                  onValueChange={(v) => setEditForm({ ...editForm, ownerUserId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select portal user" />
                  </SelectTrigger>
                  <SelectContent>
                    {portalUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Serial number</Label>
                <Input value={selected?.serialNumber ?? ''} readOnly disabled className="bg-muted" />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Type</Label>
                  <Input value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} />
                </div>
                <div>
                  <Label>Size</Label>
                  <Input value={editForm.size} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v as typeof editForm.status })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Installation date</Label>
                  <Input
                    type="date"
                    value={editForm.installationDate}
                    onChange={(e) => setEditForm({ ...editForm, installationDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Expiry date</Label>
                  <Input
                    type="date"
                    value={editForm.expiryDate}
                    onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Next service date</Label>
                <Input
                  type="date"
                  value={editForm.nextServiceDate}
                  onChange={(e) => setEditForm({ ...editForm, nextServiceDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleUpdate} disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </Button>
                {selected && (
                  <Button variant="destructive" onClick={() => void handleDelete(selected)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove extinguisher
                  </Button>
                )}
              </div>
            </div>
          )}
          {detailTab === 'timeline' && (
            <div className="pt-4">
              {timelineLoading ? (
                <LoadingState message="Loading timeline..." />
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="mb-2 text-sm font-bold text-slate-900">Service records</h4>
                    {timeline?.serviceRecords?.length ? (
                      <ul className="space-y-2 text-sm">
                        {timeline.serviceRecords.map((r) => (
                          <li key={r.id} className="rounded-lg border border-slate-200 p-3">
                            <p className="font-semibold">{r.serviceType}</p>
                            <p className="text-slate-500">{formatDate(r.serviceDate)}</p>
                            {r.technicianName && <p>Inspector: {r.technicianName}</p>}
                            {r.notes && <p className="mt-1">{r.notes}</p>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No service records yet.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm font-bold text-slate-900">History</h4>
                    {timeline?.histories?.length ? (
                      <ul className="space-y-2 text-sm">
                        {timeline.histories.map((h) => (
                          <li key={h.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                            <p className="font-medium">{h.eventType ?? 'Event'}</p>
                            <p>{h.description}</p>
                            <p className="text-xs text-slate-500">{formatDate(h.createdAt)}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">No history entries.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {detailTab === 'service' && (
            <div className="space-y-4 pt-4">
              <div>
                <Label>Service type</Label>
                <Input
                  value={serviceForm.serviceType}
                  onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value })}
                />
              </div>
              <div>
                <Label>Inspector name</Label>
                <Input
                  value={serviceForm.technicianName}
                  onChange={(e) => setServiceForm({ ...serviceForm, technicianName: e.target.value })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={serviceForm.notes}
                  onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleServiceRecord} disabled={saving}>
                {saving ? 'Saving...' : 'Add service record'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
