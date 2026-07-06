'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, Gift } from 'lucide-react';

export default function WalletPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [stats, setStats] = useState({ deposits: 0, withdrawals: 0, rewards: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      await refreshProfile();
      const { data } = await supabase.from('transactions').select('type, amount').eq('user_id', user.id);
      if (data) {
        setStats({
          deposits: data.filter(t => t.type === 'deposit').reduce((s, t) => s + Number(t.amount), 0),
          withdrawals: data.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(Number(t.amount)), 0),
          rewards: data.filter(t => t.type === 'reward').reduce((s, t) => s + Number(t.amount), 0),
        });
      }
    })();
  }, [user]);

  if (!profile) return <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>My Wallet</h1>
        <p className="text-sm text-muted-foreground">Your wallet overview and statistics.</p>
      </div>

      <Card className="glass-card p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Balance</span>
          </div>
          <div className="text-4xl sm:text-5xl font-bold gold-text" style={{ fontFamily: 'var(--font-playfair)' }}>
            Rs. {Number(profile.wallet_balance).toLocaleString()}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Deposits', value: stats.deposits, icon: TrendingUp, color: 'text-green-500' },
          { label: 'Total Withdrawals', value: stats.withdrawals, icon: TrendingDown, color: 'text-red-500' },
          { label: 'Total Rewards', value: stats.rewards, icon: Gift, color: 'text-blue-500' },
        ].map((s) => (
          <Card key={s.label} className="glass-card p-5">
            <s.icon className={`w-6 h-6 ${s.color} mb-3`} />
            <div className="text-2xl font-bold">Rs. {s.value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
