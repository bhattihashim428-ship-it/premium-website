'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Check, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminWithdrawalsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('pending');
  const [active, setActive] = useState<any>(null);
  const [remarks, setRemarks] = useState('');

 const load = async () => {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .order('created_at', { ascending: false });

  console.log("Withdrawals:", data);
  console.log("Error:", error);

  if (error) {
    toast.error(error.message);
  }

  setItems(data || []);
};
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter(w => {
    if (filter !== 'all' && w.status !== filter) return false;
    if (search) return (w.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) || (w.account_details || '').toLowerCase().includes(search.toLowerCase());
    return true;
  }), [items, search, filter]);

  const approve = async (w: any) => {
    if (!user) return;
    if (w.amount > w.profiles?.wallet_balance) { toast.error('User has insufficient balance'); return; }
    const { error } = await supabase.rpc('approve_withdrawal', { p_withdrawal_id: w.id, p_admin_id: user.id, p_remarks: remarks || null });
    if (error) toast.error(error.message);
    else { toast.success('Withdrawal approved'); setActive(null); setRemarks(''); load(); }
  };
  const reject = async (w: any) => {
    if (!user) return;
    const { error } = await supabase.rpc('reject_withdrawal', { p_withdrawal_id: w.id, p_admin_id: user.id, p_remarks: remarks || null });
    if (error) toast.error(error.message);
    else { toast.success('Withdrawal rejected'); setActive(null); setRemarks(''); load(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Withdrawal Management</h1>
        <p className="text-sm text-muted-foreground">Review and process withdrawal requests.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search withdrawals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/40">
              <th className="py-2 px-2">User</th><th className="py-2 px-2">Amount</th><th className="py-2 px-2">Method</th><th className="py-2 px-2">Details</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Date</th><th className="py-2 px-2">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id} className="border-b border-border/20 last:border-0">
                  <td className="py-2 px-2">{w.profiles?.full_name || '—'}</td>
                  <td className="py-2 px-2 font-semibold">Rs. {Number(w.amount).toLocaleString()}</td>
                  <td className="py-2 px-2 text-muted-foreground">{w.payment_method}</td>
                  <td className="py-2 px-2 text-xs font-mono max-w-32 truncate">{w.account_details}</td>
                  <td className="py-2 px-2"><span className={`text-xs px-2 py-0.5 rounded-full ${w.status === 'approved' ? 'bg-green-500/10 text-green-500' : w.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>{w.status}</span></td>
                  <td className="py-2 px-2 text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-2"><button onClick={() => { setActive(w); setRemarks(w.admin_remarks || ''); }} className="p-1.5 rounded-lg hover:bg-muted/50"><Eye className="w-4 h-4 text-yellow-500" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No withdrawals found.</p>}
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="glass-card max-w-lg">
          <DialogHeader><DialogTitle>Withdrawal Review</DialogTitle></DialogHeader>
          {active && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-muted-foreground">User</div><div className="font-medium">{active.profiles?.full_name}</div></div>
                <div><div className="text-xs text-muted-foreground">Wallet Balance</div><div className="font-bold">Rs. {Number(active.profiles?.wallet_balance || 0).toLocaleString()}</div></div>
                <div><div className="text-xs text-muted-foreground">Amount</div><div className="font-bold gold-text">Rs. {Number(active.amount).toLocaleString()}</div></div>
                <div><div className="text-xs text-muted-foreground">Method</div><div>{active.payment_method}</div></div>
                <div className="col-span-2"><div className="text-xs text-muted-foreground">Account Details</div><div className="font-mono text-xs p-2 rounded-lg bg-muted/50">{active.account_details}</div></div>
              </div>
              <div className="space-y-2"><Label>Admin Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} /></div>
              {active.status === 'pending' ? (
                <div className="flex gap-2">
                  <Button onClick={() => approve(active)} className="flex-1 bg-green-600 hover:bg-green-500 text-white"><Check className="w-4 h-4 mr-2" /> Approve</Button>
                  <Button onClick={() => reject(active)} variant="outline" className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"><X className="w-4 h-4 mr-2" /> Reject</Button>
                </div>
              ) : <div className="text-center text-sm text-muted-foreground">This withdrawal has been {active.status}.</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
