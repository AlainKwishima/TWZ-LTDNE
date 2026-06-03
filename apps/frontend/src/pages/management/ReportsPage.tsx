import { useCallback, useEffect, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Plus } from 'lucide-react';
import { api, downloadReportExport, extractList } from '@/lib/api';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import type { ExportFormat, PaginationMeta, ReportType } from '@/lib/types';
import { REPORT_TYPE_LABELS, ROLE_REPORT_TYPES } from '@/lib/types';
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

interface Report {
  id: string;
  title?: string;
  reportType: ReportType;
  status?: string;
  createdAt?: string;
  summary?: { totalFireExtinguishers?: number; assetCount?: number; requestCount?: number };
}

export default function ReportsPage() {
  const { role } = useAuth();
  const allowedTypes = role ? ROLE_REPORT_TYPES[role] : [];
  const [reports, setReports] = useState<Report[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    reportType: (allowedTypes[0] ?? 'asset_inventory') as ReportType,
    title: '',
    dateFrom: '',
    dateTo: '',
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/reports', { params: { page, limit: 10 } });
      const { items, meta: m } = extractList<Report>(response);
      setReports(items);
      setMeta(m);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void fetchReports(); }, [fetchReports]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post('/reports/generate', {
        reportType: form.reportType,
        title: form.title || undefined,
        filters: {
          dateFrom: form.dateFrom || undefined,
          dateTo: form.dateTo || undefined,
        },
      });
      toast({ title: 'Report generated' });
      setDialogOpen(false);
      void fetchReports();
    } catch (err) {
      toast({ title: 'Error', description: getErrorMessage(err), variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (id: string, format: ExportFormat) => {
    try {
      await downloadReportExport(id, format);
      toast({ title: 'Download started', description: `${format.toUpperCase()} export downloading` });
    } catch (err) {
      toast({ title: 'Export failed', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description={
          role === 'Admin'
            ? 'System-wide metrics, fire extinguisher totals, and exports'
            : role === 'Inspector'
              ? 'Field reports for assigned maintenance and extinguisher inventory'
              : 'Your extinguisher inventory, expiry status, and maintenance history'
        }
        actions={<Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Generate Report</Button>}
      />
      <Card >
        <CardContent className="pt-6">
          {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={fetchReports} /> : reports.length === 0 ? <EmptyState title="No reports yet" action={<Button onClick={() => setDialogOpen(true)}>Generate first report</Button>} /> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Export</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title ?? REPORT_TYPE_LABELS[r.reportType]}</TableCell>
                      <TableCell>
                        {REPORT_TYPE_LABELS[r.reportType] ?? r.reportType}
                        {r.summary?.totalFireExtinguishers != null && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({r.summary.totalFireExtinguishers} extinguishers)
                          </span>
                        )}
                      </TableCell>
                      <TableCell><Badge variant={r.status === 'completed' ? 'success' : 'secondary'}>{r.status ?? 'pending'}</Badge></TableCell>
                      <TableCell>{r.createdAt ? formatDate(r.createdAt) : '—'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => handleExport(r.id, 'pdf')}><FileText className="mr-1 h-3 w-3" /> PDF</Button>
                        <Button variant="outline" size="sm" onClick={() => handleExport(r.id, 'csv')}><Download className="mr-1 h-3 w-3" /> CSV</Button>
                        <Button variant="outline" size="sm" onClick={() => handleExport(r.id, 'xlsx')}><FileSpreadsheet className="mr-1 h-3 w-3" /> Excel</Button>
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
          <DialogHeader><DialogTitle>Generate Report</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Report Type</Label>
              <Select value={form.reportType} onValueChange={(v) => setForm({ ...form, reportType: v as ReportType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allowedTypes.map((key) => (
                    <SelectItem key={key} value={key}>{REPORT_TYPE_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title (optional)</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date From</Label><Input type="date" value={form.dateFrom} onChange={(e) => setForm({ ...form, dateFrom: e.target.value })} /></div>
              <div><Label>Date To</Label><Input type="date" value={form.dateTo} onChange={(e) => setForm({ ...form, dateTo: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating}>{generating ? 'Generating...' : 'Generate'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
