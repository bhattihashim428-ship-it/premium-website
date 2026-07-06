'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Crown, Gift, TrendingUp, TrendingDown, ArrowDownToLine, ArrowUpFromLine, Receipt, Sparkles, CheckCircle2, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, refreshProfile, t } = useAuth();
  const [todayClaim, setTodayClaim] = useState(false);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [vipLevels, setVipLevels] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await refreshProfile();
      const today = new Date().toISOString().split('T')[0];
      const { data: claim } = await supabase.from('reward_claims').select('id').eq('user_id', user.id).eq('claim_date', today).maybeSingle();
      setTodayClaim(!!claim);
      const { data: tx } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);
      setRecentTx(tx || []);
      const { data: vips } = await supabase.from('vip_levels').select('*').order('level', { ascending: true });
      setVipLevels(vips || []);
    })();
  }, [user]);

  if (!profile) {
    return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" /></div>;
  }

  const currentVip = vipLevels.find(v => v.level === profile.vip_level);
  const nextVip = vipLevels.find(v => v.level === profile.vip_level + 1);
  const depositProgress = nextVip ? Math.min(100, (profile.total_deposits / nextVip.required_deposit) * 100) : 100;

  const stats = [
    { label: t('walletBalance'), value: `Rs. ${Number(profile.wallet_balance).toLocaleString()}`, icon: Wallet, color: 'from-yellow-500/20 to-yellow-600/5', iconColor: 'text-yellow-500' },
    { label: t('totalDeposits'), value: `Rs. ${Number(profile.total_deposits).toLocaleString()}`, icon: TrendingUp, color: 'from-green-500/20 to-green-600/5', iconColor: 'text-green-500' },
    { label: t('totalWithdrawals'), value: `Rs. ${Number(profile.total_withdrawals).toLocaleString()}`, icon: TrendingDown, color: 'from-red-500/20 to-red-600/5', iconColor: 'text-red-500' },
    { label: t('totalRewards'), value: `Rs. ${Number(profile.total_rewards).toLocaleString()}`, icon: Gift, color: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('welcome')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>
              {profile.full_name || 'Trader'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {profile.account_status === 'active' ? (
                <span className="inline-flex items-center gap-1 text-green-500"><CheckCircle2 className="w-3 h-3" /> Account Active</span>
              ) : (
                <span className="text-red-500">{profile.account_status}</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500">
              <Link href="/dashboard/deposit"><ArrowDownToLine className="w-4 h-4 mr-2" /> {t('depositNow')}</Link>
            </Button>
            <Button asChild variant="outline" className="glass">
              <Link href="/dashboard/withdraw"><ArrowUpFromLine className="w-4 h-4 mr-2" /> {t('withdrawNow')}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={s.label} className={`glass-card p-5 hover:scale-[1.02] transition-transform animate-fade-in`} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* VIP + Reward */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">{t('vipLevel')}</h3>
            </div>
            <Link href="/dashboard/vip" className="text-xs text-yellow-500 hover:underline">View all</Link>
          </div>
          {currentVip && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: currentVip.badge_color }}>
                <Crown className="w-7 h-7 text-black" />
              </div>
              <div>
                <div className="text-lg font-bold">VIP {currentVip.level} — {currentVip.name}</div>
                <div className="text-xs text-muted-foreground">{currentVip.benefits}</div>
              </div>
            </div>
          )}
          {nextVip ? (
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress to VIP {nextVip.level}</span>
                <span className="text-yellow-500">{depositProgress.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full transition-all duration-500" style={{ width: `${depositProgress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Deposit Rs. {Number(nextVip.required_deposit - profile.total_deposits).toLocaleString()} more to reach VIP {nextVip.level}
              </p>
            </div>
          ) : (
            <p className="text-sm text-yellow-500">Maximum VIP level reached!</p>
          )}
        </Card>

        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">{t('todayReward')}</h3>
            </div>
            <Link href="/dashboard/gifts" className="text-xs text-yellow-500 hover:underline">Go to Gifts</Link>
          </div>
          {todayClaim ? (
            <div className="flex flex-col items-center py-4">
              <CheckCircle2 className="w-10 h-10 text-green-500 mb-2" />
              <p className="text-sm text-muted-foreground">You've claimed today's reward!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4">
              <Clock className="w-10 h-10 text-yellow-500 mb-2 animate-pulse" />
              <p className="text-sm text-muted-foreground mb-3">Daily OTP reward is ready to claim</p>
              <Button asChild className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500">
                <Link href="/dashboard/gifts">{t('claimReward')}</Link>
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Recent transactions */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold">Recent Activity</h3>
          </div>
          <Link href="/dashboard/transactions" className="text-xs text-yellow-500 hover:underline">View all</Link>
        </div>
        {recentTx.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t('noData')}</p>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {tx.amount > 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium capitalize">{tx.type}</div>
                    <div className="text-xs text-muted-foreground">{tx.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.amount > 0 ? '+' : ''}Rs. {Number(tx.amount).toLocaleString()}
                  </div>
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
