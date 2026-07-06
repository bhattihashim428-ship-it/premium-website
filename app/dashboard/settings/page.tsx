'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Palette, Globe, User, Lock, Bell, Shield, LogOut, Trash2, Loader2, Moon, Sun, Cloud, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, profile, theme, setTheme, language, setLanguage, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const [pw, setPw] = useState({ new: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [notifSettings, setNotifSettings] = useState({ email: true, push: true, rewards: true, deposits: true });

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.new !== pw.confirm) { toast.error('Passwords do not match'); return; }
    if (pw.new.length < 6) { toast.error('Password too short'); return; }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw.new });
      if (error) throw error;
      toast.success('Password updated');
      setPw({ new: '', confirm: '' });
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingPw(false); }
  };

  const themes = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'midnight', label: 'Midnight', icon: Cloud },
    { id: 'emerald', label: 'Emerald', icon: Leaf },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account preferences.</p>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 h-auto p-1 glass-card">
          <TabsTrigger value="appearance" className="text-xs"><Palette className="w-3.5 h-3.5 mr-1.5" /> Appearance</TabsTrigger>
          <TabsTrigger value="language" className="text-xs"><Globe className="w-3.5 h-3.5 mr-1.5" /> Language</TabsTrigger>
          <TabsTrigger value="account" className="text-xs"><User className="w-3.5 h-3.5 mr-1.5" /> Account</TabsTrigger>
          <TabsTrigger value="security" className="text-xs"><Lock className="w-3.5 h-3.5 mr-1.5" /> Security</TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs"><Bell className="w-3.5 h-3.5 mr-1.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs"><Shield className="w-3.5 h-3.5 mr-1.5" /> Privacy</TabsTrigger>
          <TabsTrigger value="danger" className="text-xs text-red-500"><Trash2 className="w-3.5 h-3.5 mr-1.5" /> Danger</TabsTrigger>
        </TabsList>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Theme</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {themes.map((t) => (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  className={`p-4 rounded-xl border transition-all ${theme === t.id ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-border hover:border-yellow-500/30'}`}>
                  <t.icon className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                  <div className="text-sm font-medium">{t.label}</div>
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Language */}
        <TabsContent value="language">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Language</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'en' as const, label: 'English', flag: '🇬🇧' },
                { id: 'ur' as const, label: 'اردو', flag: '🇵🇰' },
              ].map((l) => (
                <button key={l.id} onClick={() => setLanguage(l.id)}
                  className={`p-4 rounded-xl border transition-all ${language === l.id ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-border hover:border-yellow-500/30'}`}>
                  <div className="text-2xl mb-1">{l.flag}</div>
                  <div className="text-sm font-medium">{l.label}</div>
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Account Information</h3>
            <div className="space-y-3">
              <div><Label className="text-xs text-muted-foreground">Email</Label><div className="text-sm font-medium">{profile?.email}</div></div>
              <div><Label className="text-xs text-muted-foreground">Username</Label><div className="text-sm font-medium">{profile?.username || '—'}</div></div>
              <div><Label className="text-xs text-muted-foreground">Member Since</Label><div className="text-sm font-medium">{profile ? new Date(profile.created_at).toLocaleDateString() : '—'}</div></div>
            </div>
            <Button asChild variant="outline" className="mt-4 glass">
              <a href="/dashboard/profile">Edit Profile</a>
            </Button>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Change Password</h3>
            <form onSubmit={changePassword} className="space-y-4 max-w-md">
              <div className="space-y-2"><Label>New Password</Label><Input type="password" required value={pw.new} onChange={(e) => setPw({ ...pw, new: e.target.value })} /></div>
              <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
              <Button type="submit" disabled={savingPw} className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">
                {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div><div className="text-sm font-medium">Two-Factor Authentication</div><div className="text-xs text-muted-foreground">Extra security for your account</div></div>
                <Switch disabled />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Notification Preferences</h3>
            <div className="space-y-4">
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
                { key: 'rewards', label: 'Reward Alerts', desc: 'Daily OTP reward reminders' },
                { key: 'deposits', label: 'Deposit Updates', desc: 'Deposit status changes' },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between">
                  <div><div className="text-sm font-medium">{n.label}</div><div className="text-xs text-muted-foreground">{n.desc}</div></div>
                  <Switch checked={(notifSettings as any)[n.key]} onCheckedChange={(v) => setNotifSettings({ ...notifSettings, [n.key]: v })} />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Privacy */}
        <TabsContent value="privacy">
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Privacy Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><div className="text-sm font-medium">Profile Visibility</div><div className="text-xs text-muted-foreground">Show profile to other users</div></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><div className="text-sm font-medium">Transaction History</div><div className="text-xs text-muted-foreground">Keep transaction records private</div></div>
                <Switch defaultChecked />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Danger */}
        <TabsContent value="danger">
          <Card className="glass-card p-6 border-red-500/20">
            <h3 className="font-semibold mb-4 text-red-500">Danger Zone</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <div><div className="text-sm font-medium">Logout</div><div className="text-xs text-muted-foreground">Sign out of your account</div></div>
                <Button variant="outline" onClick={async () => { await signOut(); router.push('/login'); }} className="border-red-500/30 text-red-500 hover:bg-red-500/10">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <div><div className="text-sm font-medium text-red-500">Delete Account</div><div className="text-xs text-muted-foreground">Request account deletion (admin will review)</div></div>
                <Button variant="outline" onClick={() => toast.info('Account deletion request sent to admin.')} className="border-red-500/30 text-red-500 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4 mr-2" /> Request Deletion
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
