'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Save, Building2, Smartphone, Bitcoin, Settings as SettingsIcon, LifeBuoy, Loader2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [methods, setMethods] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data: s } = await supabase.from('website_settings').select('*').eq('id', 1).maybeSingle();
    setSettings(s);
    const { data: m } = await supabase.from('payment_methods').select('*').order('sort_order');
    setMethods(m || []);
  };
  useEffect(() => { load(); }, []);

  const saveSettings = async (updates: any) => {
    setSaving(true);
    setSettings((prev: any) => ({ ...prev, ...updates }));
    const { error } = await supabase.from('website_settings').update(updates).eq('id', 1);
    if (error) { toast.error(error.message); load(); }
    else { toast.success('Settings saved'); }
    setSaving(false);
  };

  const saveMethod = async (m: any) => {
    const { error } = await supabase.from('payment_methods').update({
      name: m.name, account_title: m.account_title, account_number: m.account_number, instructions: m.instructions, is_active: m.is_active,
    }).eq('id', m.id);
    if (error) toast.error(error.message);
    else toast.success('Payment method saved');
  };

  if (!settings) return <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Website Settings</h1>
        <p className="text-sm text-muted-foreground">Configure all platform settings.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 h-auto p-1 glass-card">
          <TabsTrigger value="general" className="text-xs"><SettingsIcon className="w-3.5 h-3.5 mr-1.5" /> General</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs"><Building2 className="w-3.5 h-3.5 mr-1.5" /> Payments</TabsTrigger>
          <TabsTrigger value="rewards" className="text-xs"><Bitcoin className="w-3.5 h-3.5 mr-1.5" /> Rewards</TabsTrigger>
          <TabsTrigger value="contact" className="text-xs"><LifeBuoy className="w-3.5 h-3.5 mr-1.5" /> Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="glass-card p-6 space-y-4 max-w-xl">
            <h3 className="font-semibold">General Settings</h3>
            <div className="space-y-2"><Label>Site Name</Label><Input defaultValue={settings.site_name} onBlur={(e) => saveSettings({ site_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Logo URL</Label><Input defaultValue={settings.logo_url || ''} onBlur={(e) => saveSettings({ logo_url: e.target.value })} /></div>
            <div className="space-y-2"><Label>Primary Color</Label><Input type="color" defaultValue={settings.primary_color} onBlur={(e) => saveSettings({ primary_color: e.target.value })} /></div>
            <div className="space-y-2"><Label>Secondary Color</Label><Input type="color" defaultValue={settings.secondary_color} onBlur={(e) => saveSettings({ secondary_color: e.target.value })} /></div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm">Maintenance Mode</span>
              <Switch checked={settings.maintenance_mode} onCheckedChange={(v) => saveSettings({ maintenance_mode: v })} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-4">
            {methods.map((m) => (
              <Card key={m.id} className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{m.name}</h4>
                  <Switch checked={m.is_active} onCheckedChange={(v) => { const updated = methods.map(x => x.id === m.id ? { ...x, is_active: v } : x); setMethods(updated); saveMethod({ ...m, is_active: v }); }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Account Title</Label><Input defaultValue={m.account_title} onBlur={(e) => { const updated = { ...m, account_title: e.target.value }; setMethods(methods.map(x => x.id === m.id ? updated : x)); saveMethod(updated); }} /></div>
                  <div className="space-y-1"><Label className="text-xs">Account Number</Label><Input defaultValue={m.account_number} onBlur={(e) => { const updated = { ...m, account_number: e.target.value }; setMethods(methods.map(x => x.id === m.id ? updated : x)); saveMethod(updated); }} /></div>
                </div>
                <div className="space-y-1 mt-3"><Label className="text-xs">Instructions</Label><Textarea defaultValue={m.instructions || ''} rows={2} onBlur={(e) => { const updated = { ...m, instructions: e.target.value }; saveMethod(updated); }} /></div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          {/* Reward Ratio Management */}
          <Card className="glass-card p-6 space-y-5 max-w-xl">
            <div>
              <h3 className="font-semibold">Reward Ratio Management</h3>
              <p className="text-xs text-muted-foreground mt-1">Set the percentage of a user's total deposits awarded as daily reward. Changes apply to future calculations only.</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Current Reward Ratio</Label>
                <div className="text-4xl font-bold gold-text" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {Number(settings.reward_percentage).toFixed(2)}%
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="glass h-9 px-3"
                  disabled={saving}
                  onClick={() => saveSettings({ reward_percentage: Math.min(100, Number(settings.reward_percentage) + 1) })}
                >
                  <Plus className="w-4 h-4 mr-1" /> +1%
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="glass h-9 px-3"
                  disabled={saving}
                  onClick={() => saveSettings({ reward_percentage: Math.max(0, Number(settings.reward_percentage) - 1) })}
                >
                  <Minus className="w-4 h-4 mr-1" /> -1%
                </Button>
              </div>
            </div>

            {/* Quick presets */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                {[5, 7, 10, 12, 15, 20, 25].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => saveSettings({ reward_percentage: r })}
                    disabled={saving}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      Number(settings.reward_percentage) === r
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black'
                        : 'glass hover:bg-muted/50'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>

            {/* Manual input */}
            <div className="space-y-2">
              <Label>Custom Ratio (%)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={settings.reward_percentage}
                  onBlur={(e) => {
                    const v = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                    saveSettings({ reward_percentage: v });
                  }}
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
              <p className="text-xs text-muted-foreground">
                <span className="text-yellow-500/80">Note:</span> Previously calculated rewards are not affected. Only future reward claims will use the new ratio.
              </p>
            </div>
          </Card>

          {/* Withdrawal rules */}
          <Card className="glass-card p-6 space-y-4 max-w-xl">
            <h3 className="font-semibold">Withdrawal Rules</h3>
            <div className="space-y-2"><Label>Reward Time</Label><Input type="time" defaultValue={settings.reward_time} onBlur={(e) => saveSettings({ reward_time: e.target.value })} /></div>
            <div className="space-y-2"><Label>Min Withdrawal Deposit Requirement (Rs.)</Label><Input type="number" defaultValue={settings.min_withdrawal_deposit} onBlur={(e) => saveSettings({ min_withdrawal_deposit: parseFloat(e.target.value) || 0 })} /></div>
            <div className="space-y-2"><Label>Min Withdrawal Amount (Rs.)</Label><Input type="number" defaultValue={settings.min_withdrawal_amount} onBlur={(e) => saveSettings({ min_withdrawal_amount: parseFloat(e.target.value) || 0 })} /></div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <span className="text-sm">Reward System Enabled</span>
              <Switch checked={settings.reward_system_enabled} onCheckedChange={(v) => saveSettings({ reward_system_enabled: v })} />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card className="glass-card p-6 space-y-4 max-w-xl">
            <h3 className="font-semibold">Contact Information</h3>
            <div className="space-y-2"><Label>Phone</Label><Input defaultValue={settings.contact_phone || ''} onBlur={(e) => saveSettings({ contact_phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>WhatsApp</Label><Input defaultValue={settings.contact_whatsapp || ''} onBlur={(e) => saveSettings({ contact_whatsapp: e.target.value })} /></div>
            <div className="space-y-2"><Label>Telegram</Label><Input defaultValue={settings.contact_telegram || ''} onBlur={(e) => saveSettings({ contact_telegram: e.target.value })} /></div>
            <div className="space-y-2"><Label>Email</Label><Input defaultValue={settings.contact_email || ''} onBlur={(e) => saveSettings({ contact_email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Facebook</Label><Input defaultValue={settings.contact_facebook || ''} onBlur={(e) => saveSettings({ contact_facebook: e.target.value })} /></div>
            <div className="space-y-2"><Label>Instagram</Label><Input defaultValue={settings.contact_instagram || ''} onBlur={(e) => saveSettings({ contact_instagram: e.target.value })} /></div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
