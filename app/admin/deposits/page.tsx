'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Check, X, Eye, Clock, RefreshCw, ImageOff } from 'lucide-react';
import { toast } from 'sonner';

type DepositRow = {
  id: string;
  user_id: string;
  amount: number;
  reference_number: string | null;
  screenshot_url: string | null;
  status: string;
  admin_remarks: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  payment_method_id: string | null;
  profiles: { full_name: string; email: string } | null;
  payment_methods: { name: string } | null;
};

export default function AdminDepositsPage() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pending');
  const [active, setActive] = useState<DepositRow | null>(null);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('deposits')
      .select('*, profiles(full_name, email), payment_methods(name)')
      .order('created_at', { ascending: false });
    setDeposits((data as DepositRow[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => deposits.filter(d => {
    if (filter !== 'all' && d.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (d.profiles?.full_name || '').toLowerCase().includes(q)
        || (d.reference_number || '').toLowerCase().includes(q)
        || (d.user_id || '').toLowerCase().includes(q);
    }
    return true;
  }), [deposits, search, filter]);

  const approve = async (d: DepositRow) => {
    if (!user || processing) return;
    setProcessing(true);
    const { error } = await supabase.rpc('approve_deposit', {
      p_deposit_id: d.id, p_admin_id: user.id, p_remarks: remarks || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Deposit approved — wallet updated');
      setActive(null); setRemarks('');
      await load();
    }
    setProcessing(false);
  };

  const reject = async (d: DepositRow) => {
    if (!user || processing) return;
    if (!remarks.trim()) { toast.error('Please enter a rejection reason'); return; }
    setProcessing(true);
    const { error } = await supabase.rpc('reject_deposit', {
      p_deposit_id: d.id, p_admin_id: user.id, p_remarks: remarks.trim(),
    });
    if (error) toast.error(error.message);
    else {
      toast.success('Deposit rejected');
      setActive(null); setRemarks('');
      await load();
    }
    setProcessing(false);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      approved: 'bg-green-500/10 text-green-500 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return `text-xs px-2.5 py-1 rounded-full border ${styles[status] || styles.pending}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Deposit Requests</h1>
          <p className="text-sm text-muted-foreground">Review and process deposit requests.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="glass">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, transaction ID, or user ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border/40">
                <th className="py-2 px-2">User</th>
                <th className="py-2 px-2">User ID</th>
                <th className="py-2 px-2">Amount</th>
                <th className="py-2 px-2">Method</th>
                <th className="py-2 px-2">Transaction ID</th>
                <th className="py-2 px-2">Screenshot</th>
                <th className="py-2 px-2">Date & Time</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black text-xs font-bold">
                        {d.profiles?.full_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="font-medium">{d.profiles?.full_name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{d.profiles?.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-xs font-mono text-muted-foreground max-w-32 truncate" title={d.user_id}>
                    {d.user_id.slice(0, 8)}…
                  </td>
                  <td className="py-2 px-2 font-semibold gold-text">Rs. {Number(d.amount).toLocaleString()}</td>
                  <td className="py-2 px-2 text-muted-foreground">{d.payment_methods?.name || '—'}</td>
                  <td className="py-2 px-2 text-xs font-mono">{d.reference_number || '—'}</td>
                  <td className="py-2 px-2">
                    {d.screenshot_url ? (
                      <a href={d.screenshot_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                        <img src={d.screenshot_url} alt="Receipt" className="w-10 h-10 rounded-lg object-cover border border-border/40 hover:opacity-80 transition-opacity" />
                      </a>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center"><ImageOff className="w-4 h-4 text-muted-foreground" /></div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(d.created_at).toLocaleString()}</td>
                  <td className="py-2 px-2"><span className={statusBadge(d.status)}>{d.status}</span></td>
                  <td className="py-2 px-2">
                    <button onClick={() => { setActive(d); setRemarks(d.rejection_reason || d.admin_remarks || ''); }} className="p-1.5 rounded-lg hover:bg-muted/50">
                      <Eye className="w-4 h-4 text-yellow-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No deposits found.</p>
        )}
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="glass-card max-w-lg">
          <DialogHeader><DialogTitle>Deposit Review</DialogTitle></DialogHeader>
          {active && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">User Name</div>
                  <div className="font-medium">{active.profiles?.full_name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">User ID</div>
                  <div className="font-mono text-xs">{active.user_id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Amount</div>
                  <div className="font-bold gold-text">Rs. {Number(active.amount).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Payment Method</div>
                  <div>{active.payment_methods?.name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Transaction ID</div>
                  <div className="font-mono text-xs">{active.reference_number || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Date & Time</div>
                  <div className="text-xs">{new Date(active.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <span className={statusBadge(active.status)}>{active.status}</span>
                </div>
                {active.reviewed_at && (
                  <div>
                    <div className="text-xs text-muted-foreground">Reviewed At</div>
                    <div className="text-xs">{new Date(active.reviewed_at).toLocaleString()}</div>
                  </div>
                )}
              </div>

              {active.screenshot_url && (
                <div>
                  <Label className="text-xs text-muted-foreground">Payment Screenshot</Label>
                  <a href={active.screenshot_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
                    <img src={active.screenshot_url} alt="Receipt" className="w-full rounded-xl max-h-56 object-contain bg-white/5 border border-border/40" />
                  </a>
                </div>
              )}

              {active.status === 'rejected' && active.rejection_reason && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="text-xs text-red-500 font-medium mb-1">Rejection Reason</div>
                  <div className="text-sm">{active.rejection_reason}</div>
                </div>
              )}

              {active.status === 'approved' && active.admin_remarks && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="text-xs text-green-500 font-medium mb-1">Approval Remarks</div>
                  <div className="text-sm">{active.admin_remarks}</div>
                </div>
              )}

              {active.status === 'pending' ? (
                <>
                  <div className="space-y-2">
                    <Label>{active.status === 'pending' ? 'Remarks / Rejection Reason' : 'Remarks'}</Label>
                    <Textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={2}
                      placeholder="Enter rejection reason (required for rejection) or approval remarks..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => approve(active)}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button
                      onClick={() => reject(active)}
                      disabled={processing}
                      variant="outline"
                      className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-sm text-muted-foreground">
                  This deposit has been {active.status}. No further action available.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
