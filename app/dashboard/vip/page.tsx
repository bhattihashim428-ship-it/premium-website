'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, VipLevel } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Crown, Check, Star, TrendingUp } from 'lucide-react';

export default function VipPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [levels, setLevels] = useState<VipLevel[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('vip_levels').select('*').order('level', { ascending: true }).then(({ data }) => setLevels(data || []));
    if (user) {
      supabase.from('vip_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setHistory(data || []));
    }
  }, [user]);

  if (!profile) return <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" /></div>;

  const current = levels.find(l => l.level === profile.vip_level);
  const next = levels.find(l => l.level === profile.vip_level + 1);
  const depositProgress = next ? Math.min(100, (profile.total_deposits / next.required_deposit) * 100) : 100;
  const withdrawalProgress = next ? Math.min(100, (profile.total_withdrawals / next.required_withdrawal) * 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>VIP Center</h1>
        <p className="text-sm text-muted-foreground">Climb the VIP ladder and unlock exclusive benefits.</p>
      </div>

      {/* Current VIP */}
      {current && (
        <Card className="glass-card p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center flex-shrink-0 animate-float" style={{ background: current.badge_color }}>
              <Crown className="w-10 h-10 text-black" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Level</div>
              <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>VIP {current.level} — {current.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{current.benefits}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Progress to next */}
      {next ? (
        <Card className="glass-card p-6">
          <h3 className="font-semibold mb-4">Progress to VIP {next.level} — {next.name}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Deposit Progress</span>
                <span className="text-yellow-500">Rs. {profile.total_deposits.toLocaleString()} / {next.required_deposit.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full transition-all duration-500" style={{ width: `${depositProgress}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Withdrawal Progress</span>
                <span className="text-yellow-500">Rs. {profile.total_withdrawals.toLocaleString()} / {next.required_withdrawal.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full transition-all duration-500" style={{ width: `${withdrawalProgress}%` }} />
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="glass-card p-6 text-center">
          <Star className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
          <p className="text-lg font-semibold gold-text">Maximum VIP level reached!</p>
        </Card>
      )}

      {/* All levels */}
      <div>
        <h3 className="font-semibold mb-3">All VIP Levels</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {levels.map((l) => {
            const reached = profile.vip_level >= l.level;
            return (
              <Card key={l.level} className={`glass-card p-5 ${reached ? 'border-yellow-500/30' : ''}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: l.badge_color }}>
                    <Crown className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <div className="font-semibold">VIP {l.level} — {l.name}</div>
                    {reached && <div className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" /> Achieved</div>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Deposit: Rs. {l.required_deposit.toLocaleString()}</div>
                  <div>Withdrawal: Rs. {l.required_withdrawal.toLocaleString()}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{l.benefits}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card className="glass-card p-6">
          <h3 className="font-semibold mb-4">VIP History</h3>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${h.to_level > h.from_level ? 'text-green-500' : 'text-red-500'}`} />
                  <span className="text-sm">VIP {h.from_level} → VIP {h.to_level}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
