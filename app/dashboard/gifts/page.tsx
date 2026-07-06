'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gift, Clock, CheckCircle2, Sparkles, Loader2, PartyPopper, History } from 'lucide-react';
import { toast } from 'sonner';

function useCountdown() {
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = new Date();
      next.setHours(17, 0, 0, 0);
      if (now.getHours() >= 17) next.setDate(next.getDate() + 1);
      const diff = next.getTime() - now.getTime();
      setTime({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function GiftsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const countdown = useCountdown();

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data: settings } = await supabase.from('website_settings').select('*').eq('id', 1).maybeSingle();
    setSettings(settings);
    const today = new Date().toISOString().split('T')[0];
    const { data: claim } = await supabase.from('reward_claims').select('*').eq('user_id', user.id).eq('claim_date', today).maybeSingle();
    setClaimed(!!claim);
    const { data: hist } = await supabase.from('reward_claims').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
    setHistory(hist || []);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!otp) { toast.error('Please enter the OTP'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('claim_daily_reward', { p_user_id: user.id, p_otp: otp });
      if (error) throw error;
      const result = data?.[0];
      if (result?.success) {
        setReward(result.reward_amount);
        setShowSuccess(true);
        setClaimed(true);
        setOtp('');
        await refreshProfile();
        await loadData();
        toast.success(`Reward of Rs. ${result.reward_amount} claimed!`);
        setTimeout(() => setShowSuccess(false), 4000);
      } else {
        toast.error(result?.message || 'Claim failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to claim reward');
    } finally {
      setLoading(false);
    }
  };

  const lifetime = history.reduce((s, h) => s + Number(h.reward_amount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Gift Center</h1>
        <p className="text-sm text-muted-foreground">Claim your daily OTP reward — 20% of your total approved deposits.</p>
      </div>

      {/* Countdown */}
      <Card className="glass-card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Next Daily OTP In</span>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {[
              { label: 'Hours', value: countdown.hours },
              { label: 'Minutes', value: countdown.minutes },
              { label: 'Seconds', value: countdown.seconds },
            ].map((t) => (
              <div key={t.label} className="text-center">
                <div className="text-4xl sm:text-6xl font-bold gold-text tabular-nums" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {String(t.value).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Success animation */}
      {showSuccess && reward !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-8 text-center max-w-sm mx-4 animate-fade-in-scale">
            <PartyPopper className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-float" />
            <h2 className="text-2xl font-bold gold-text mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Reward Claimed!</h2>
            <p className="text-3xl font-bold mb-2">Rs. {reward.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Added to your wallet instantly.</p>
          </div>
        </div>
      )}

      {/* Claim form */}
      <Card className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold">Claim Today's Reward</h3>
        </div>
        {claimed ? (
          <div className="flex flex-col items-center py-8">
            <CheckCircle2 className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-sm text-muted-foreground">You've already claimed today's reward. Come back tomorrow!</p>
          </div>
        ) : profile && profile.total_deposits <= 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Sparkles className="w-10 h-10 text-yellow-500 mb-3" />
            <p className="text-sm text-muted-foreground">You need at least one approved deposit to claim rewards.</p>
          </div>
        ) : (
          <form onSubmit={handleClaim} className="space-y-4">
            <div className="space-y-2">
              <Label>Enter Today's Global OTP</Label>
              <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} className="text-center text-2xl tracking-widest font-mono h-14" />
              <p className="text-xs text-muted-foreground">The OTP is published daily at 5:00 PM server time. Check announcements or contact support.</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 h-12">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gift className="w-4 h-4 mr-2" /> Claim Reward</>}
            </Button>
          </form>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="glass-card p-5">
          <div className="text-xs text-muted-foreground mb-1">Lifetime Rewards Earned</div>
          <div className="text-2xl font-bold gold-text">Rs. {lifetime.toLocaleString()}</div>
        </Card>
        <Card className="glass-card p-5">
          <div className="text-xs text-muted-foreground mb-1">Last Claim Date</div>
          <div className="text-2xl font-bold">{history[0] ? new Date(history[0].created_at).toLocaleDateString() : '—'}</div>
        </Card>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold">Reward History</h3>
          </div>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div>
                  <div className="text-sm font-medium">Rs. {Number(h.reward_amount).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">OTP: {h.otp_code}</div>
                </div>
                <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
