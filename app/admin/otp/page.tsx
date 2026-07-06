'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Gift, RefreshCw, Clock, Percent, Power, History } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminOtpPage() {
  const [otp, setOtp] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    const { data: todayOtp } = await supabase.from('daily_otps').select('*').eq('reward_date', new Date().toISOString().split('T')[0]).maybeSingle();
    setOtp(todayOtp);
    const { data: s } = await supabase.from('website_settings').select('*').eq('id', 1).maybeSingle();
    setSettings(s);
    const { data: c } = await supabase.from('reward_claims').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(20);
    setClaims(c || []);
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const today = new Date().toISOString().split('T')[0];
    const expires = new Date(); expires.setHours(17, 0, 0, 0); expires.setDate(expires.getDate() + 1);
    const { error } = await supabase.from('daily_otps').upsert({
      otp_code: code, reward_date: today, reward_time: '17:00', expires_at: expires.toISOString(), is_active: true,
    }, { onConflict: 'reward_date' });
    if (error) toast.error(error.message);
    else { toast.success(`New OTP generated: ${code}`); load(); }
    setGenerating(false);
  };

  const saveSettings = async (updates: any) => {
    const { error } = await supabase.from('website_settings').update(updates).eq('id', 1);
    if (error) toast.error(error.message);
    else { toast.success('Settings updated'); load(); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>OTP & Rewards Management</h1>
        <p className="text-sm text-muted-foreground">Manage the daily global OTP reward system.</p>
      </div>

      {/* Today's OTP */}
      <Card className="glass-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2"><Gift className="w-5 h-5 text-yellow-500" /><span className="text-xs text-muted-foreground uppercase tracking-wider">Today's Global OTP</span></div>
            {otp ? (
              <div className="text-4xl font-bold gold-text font-mono tracking-widest" style={{ fontFamily: 'var(--font-playfair)' }}>{otp.otp_code}</div>
            ) : <div className="text-lg text-muted-foreground">No OTP generated today</div>}
            {otp && <div className="text-xs text-muted-foreground mt-2">Expires: {new Date(otp.expires_at).toLocaleString()}</div>}
          </div>
          <Button onClick={generate} disabled={generating} className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500">
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} /> Generate New OTP
          </Button>
        </div>
      </Card>

      {/* Settings */}
      {settings && (
        <Card className="glass-card p-6">
          <h3 className="font-semibold mb-4">Reward Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label><Percent className="w-3.5 h-3.5 inline mr-1" /> Reward Percentage (%)</Label>
              <Input type="number" step="0.01" defaultValue={settings.reward_percentage} onBlur={(e) => saveSettings({ reward_percentage: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label><Clock className="w-3.5 h-3.5 inline mr-1" /> Reward Time</Label>
              <Input type="time" defaultValue={settings.reward_time} onBlur={(e) => saveSettings({ reward_time: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Reward Window (hours)</Label>
              <Input type="number" defaultValue={settings.reward_window_hours} onBlur={(e) => saveSettings({ reward_window_hours: parseInt(e.target.value) || 24 })} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2"><Power className="w-4 h-4 text-yellow-500" /><span className="text-sm">Reward System Enabled</span></div>
              <Switch checked={settings.reward_system_enabled} onCheckedChange={(v) => saveSettings({ reward_system_enabled: v })} />
            </div>
          </div>
        </Card>
      )}

      {/* Recent claims */}
      <Card className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4"><History className="w-5 h-5 text-yellow-500" /><h3 className="font-semibold">Recent Reward Claims</h3></div>
        {claims.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No claims yet.</p> : (
          <div className="space-y-2">
            {claims.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div><div className="text-sm font-medium">{c.profiles?.full_name || '—'}</div><div className="text-xs text-muted-foreground">OTP: {c.otp_code}</div></div>
                <div className="text-right"><div className="text-sm font-semibold gold-text">Rs. {Number(c.reward_amount).toLocaleString()}</div><div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</div></div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
