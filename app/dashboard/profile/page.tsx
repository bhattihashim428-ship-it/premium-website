'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown, Mail, Phone, Globe, Calendar, Wallet, User, Edit, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', username: '', phone: '', country: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm({ full_name: profile.full_name, username: profile.username || '', phone: profile.phone || '', country: profile.country || '' });
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name, username: form.username, phone: form.phone, country: form.country,
      }).eq('id', user.id);
      if (error) throw error;
      toast.success('Profile updated');
      setEditing(false);
      await refreshProfile();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (!profile) return <div className="flex justify-center py-20"><div className="w-10 h-10 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" /></div>;

  const fields = [
    { label: 'Full Name', value: profile.full_name, icon: User },
    { label: 'Username', value: profile.username || '—', icon: User },
    { label: 'Email', value: profile.email || '—', icon: Mail },
    { label: 'Phone', value: profile.phone || '—', icon: Phone },
    { label: 'Country', value: profile.country || '—', icon: Globe },
    { label: 'Registration Date', value: new Date(profile.created_at).toLocaleDateString(), icon: Calendar },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>My Profile</h1>
        <p className="text-sm text-muted-foreground">View and edit your account information.</p>
      </div>

      <Card className="glass-card p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black text-3xl font-bold shadow-lg shadow-yellow-500/30">
            {profile.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>{profile.full_name || 'User'}</h2>
            <p className="text-sm text-muted-foreground">@{profile.username || 'username'}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                <Crown className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-xs font-medium">VIP {profile.vip_level}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-medium capitalize">{profile.account_status}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Wallet Balance</div>
            <div className="text-2xl font-bold gold-text">Rs. {Number(profile.wallet_balance).toLocaleString()}</div>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Account Information</h3>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="glass"><Edit className="w-4 h-4 mr-2" /> Edit</Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Username</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving} className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <f.icon className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{f.label}</div>
                  <div className="text-sm font-medium truncate">{f.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
