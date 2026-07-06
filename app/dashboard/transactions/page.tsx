'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, TrendingUp, TrendingDown, Gift, Crown, Wallet } from 'lucide-react';

const PAGE_SIZE = 10;

export default function TransactionsPage() {
  const { user } = useAuth();
  const [txs, setTxs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setTxs(data || []));
  }, [user]);

  const filtered = useMemo(() => {
    return txs.filter(t => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (t.description || '').toLowerCase().includes(q) || (t.reference_id || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [txs, search, filter]);

  const pages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const current = Math.min(page, pages);
  const paged = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const iconFor = (type: string) => {
    if (type === 'deposit') return TrendingUp;
    if (type === 'withdrawal') return TrendingDown;
    if (type === 'reward') return Gift;
    if (type === 'vip') return Crown;
    return Wallet;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Transaction History</h1>
        <p className="text-sm text-muted-foreground">All your deposits, withdrawals, and rewards.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposits</SelectItem>
            <SelectItem value="withdrawal">Withdrawals</SelectItem>
            <SelectItem value="reward">Rewards</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card p-4 sm:p-6">
        {paged.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No transactions found.</p>
        ) : (
          <div className="space-y-2">
            {paged.map((tx) => {
              const Icon = iconFor(tx.type);
              return (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      <Icon className={`w-4 h-4 ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium capitalize">{tx.type}</div>
                      <div className="text-xs text-muted-foreground truncate">{tx.description || '—'}</div>
                      <div className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.amount > 0 ? '+' : ''}Rs. {Number(tx.amount).toLocaleString()}
                    </div>
                    {tx.reference_id && <div className="text-xs text-muted-foreground font-mono">{tx.reference_id.slice(0, 8)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
            <span className="text-xs text-muted-foreground">Page {current} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={current === 1} className="px-3 py-1 text-xs rounded-lg bg-muted/50 disabled:opacity-50">Prev</button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={current === pages} className="px-3 py-1 text-xs rounded-lg bg-muted/50 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
