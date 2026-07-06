'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Users, ArrowDownToLine, ArrowUpFromLine, Gift, Clock, CheckCircle2, XCircle, TrendingUp, Wallet, Crown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const [chartData, setChartData] = useState<any[]>([]);
  const [vipData, setVipData] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [users, deposits, withdrawals, rewards, profiles] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('deposits').select('status, amount, created_at'),
        supabase.from('withdrawals').select('status, amount, created_at'),
        supabase.from('reward_claims').select('reward_amount, created_at'),
        supabase.from('profiles').select('vip_level'),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const newUsersToday = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today);

      const depData = deposits.data || [];
      const wdData = withdrawals.data || [];
      const rwData = rewards.data || [];
      const profData = profiles.data || [];

      const totalDeposits = depData.filter(d => d.status === 'approved').reduce((s, d) => s + Number(d.amount), 0);
      const totalWithdrawals = wdData.filter(w => w.status === 'approved').reduce((s, w) => s + Number(w.amount), 0);
      const totalRewards = rwData.reduce((s, r) => s + Number(r.reward_amount), 0);

      setStats({
        totalUsers: users.count || 0,
        newUsersToday: newUsersToday.count || 0,
        pendingDeposits: depData.filter(d => d.status === 'pending').length,
        approvedDeposits: depData.filter(d => d.status === 'approved').length,
        rejectedDeposits: depData.filter(d => d.status === 'rejected').length,
        pendingWithdrawals: wdData.filter(w => w.status === 'pending').length,
        approvedWithdrawals: wdData.filter(w => w.status === 'approved').length,
        rejectedWithdrawals: wdData.filter(w => w.status === 'rejected').length,
        totalDeposits, totalWithdrawals, totalRewards,
        todayDeposits: depData.filter(d => d.created_at >= today && d.status === 'approved').reduce((s, d) => s + Number(d.amount), 0),
        todayRewards: rwData.filter(r => r.created_at >= today).reduce((s, r) => s + Number(r.reward_amount), 0),
      });

      // 7-day chart
      const days: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        days.push({
          date: d.toLocaleDateString('en', { weekday: 'short' }),
          deposits: depData.filter(x => x.created_at.startsWith(ds) && x.status === 'approved').reduce((s, x) => s + Number(x.amount), 0),
          withdrawals: wdData.filter(x => x.created_at.startsWith(ds) && x.status === 'approved').reduce((s, x) => s + Number(x.amount), 0),
          rewards: rwData.filter(x => x.created_at.startsWith(ds)).reduce((s, x) => s + Number(x.reward_amount), 0),
        });
      }
      setChartData(days);

      // VIP distribution
      const vipCounts: Record<number, number> = {};
      profData.forEach(p => { vipCounts[p.vip_level] = (vipCounts[p.vip_level] || 0) + 1; });
      const colors = ['#CD7F32', '#C0C0C0', '#D4AF37', '#E5E4E2', '#B9F2FF', '#FFD700', '#9B59B6'];
      setVipData(Object.entries(vipCounts).map(([k, v], i) => ({ name: `VIP ${k}`, value: v, color: colors[Number(k)] || '#888' })));

      // Recent transactions
      const { data: tx } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(8);
      setRecent(tx || []);
    })();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-500' },
    { label: "Today's New Users", value: stats.newUsersToday || 0, icon: TrendingUp, color: 'from-green-500/20 to-green-600/5', iconColor: 'text-green-500' },
    { label: 'Total Deposited Amount', value: `Rs. ${(stats.totalDeposits || 0).toLocaleString()}`, icon: ArrowDownToLine, color: 'from-yellow-500/20 to-yellow-600/5', iconColor: 'text-yellow-500' },
    { label: "Today's Deposits", value: `Rs. ${(stats.todayDeposits || 0).toLocaleString()}`, icon: ArrowDownToLine, color: 'from-yellow-500/20 to-yellow-600/5', iconColor: 'text-yellow-500' },
    { label: 'Pending Deposits', value: stats.pendingDeposits || 0, icon: Clock, color: 'from-yellow-500/20 to-yellow-600/5', iconColor: 'text-yellow-500' },
    { label: 'Approved Deposits', value: stats.approvedDeposits || 0, icon: CheckCircle2, color: 'from-green-500/20 to-green-600/5', iconColor: 'text-green-500' },
    { label: 'Rejected Deposits', value: stats.rejectedDeposits || 0, icon: XCircle, color: 'from-red-500/20 to-red-600/5', iconColor: 'text-red-500' },
    { label: 'Total Withdrawals', value: `Rs. ${(stats.totalWithdrawals || 0).toLocaleString()}`, icon: ArrowUpFromLine, color: 'from-red-500/20 to-red-600/5', iconColor: 'text-red-500' },
    { label: 'Total Rewards', value: `Rs. ${(stats.totalRewards || 0).toLocaleString()}`, icon: Gift, color: 'from-purple-500/20 to-purple-600/5', iconColor: 'text-purple-500' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals || 0, icon: Clock, color: 'from-orange-500/20 to-orange-600/5', iconColor: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform overview and statistics.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={c.label} className="glass-card p-5 hover:scale-[1.02] transition-transform animate-fade-in" style={{ animationDelay: `${i * 0.04}s` }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}>
              <c.icon className={`w-5 h-5 ${c.iconColor}`} />
            </div>
            <div className="text-xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card p-6">
          <h3 className="font-semibold mb-4">7-Day Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} /><stop offset="95%" stopColor="#D4AF37" stopOpacity={0} /></linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="deposits" stroke="#D4AF37" fill="url(#depGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="withdrawals" stroke="#ef4444" fill="transparent" strokeWidth={2} />
              <Area type="monotone" dataKey="rewards" stroke="#3b82f6" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass-card p-6">
          <h3 className="font-semibold mb-4">VIP Distribution</h3>
          {vipData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={vipData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {vipData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-20">No data</p>}
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4">Recent Transactions</h3>
        {recent.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No transactions yet.</p> : (
          <div className="space-y-2">
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {tx.amount > 0 ? <ArrowDownToLine className="w-4 h-4 text-green-500" /> : <ArrowUpFromLine className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium capitalize">{tx.type}</div>
                    <div className="text-xs text-muted-foreground">{tx.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>{tx.amount > 0 ? '+' : ''}Rs. {Number(tx.amount).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
