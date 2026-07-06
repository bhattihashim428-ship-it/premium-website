'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', message: '', type: 'info' });

  const load = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('announcements').insert({ ...form, is_active: true });
    if (error) toast.error(error.message);
    else {
      // Send notification to all users
      const { data: users } = await supabase.from('profiles').select('id');
      if (users && users.length > 0) {
        await supabase.from('notifications').insert(users.map(u => ({ user_id: u.id, title: form.title, message: form.message, type: 'announcement' })));
      }
      toast.success('Announcement sent to all users');
      setForm({ title: '', message: '', type: 'info' });
      load();
    }
  };

  const remove = async (id: string) => {
    await supabase.from('announcements').delete().eq('id', id);
    toast.success('Announcement deleted');
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Announcements</h1>
        <p className="text-sm text-muted-foreground">Send announcements and notifications to all users.</p>
      </div>

      <Card className="glass-card p-6 max-w-xl">
        <h3 className="font-semibold mb-4">New Announcement</h3>
        <form onSubmit={send} className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-2"><Label>Message</Label><Textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} /></div>
          <div className="space-y-2"><Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="info">Info</SelectItem><SelectItem value="popup">Popup</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem></SelectContent>
            </Select>
          </div>
          <Button type="submit" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"><Send className="w-4 h-4 mr-2" /> Send to All Users</Button>
        </form>
      </Card>

      <Card className="glass-card p-4">
        <h3 className="font-semibold mb-3">Recent Announcements</h3>
        {items.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No announcements yet.</p> : (
          <div className="space-y-2">
            {items.map((a) => (
              <div key={a.id} className="flex items-start justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-start gap-3">
                  <Megaphone className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <div><div className="text-sm font-medium">{a.title}</div><div className="text-xs text-muted-foreground">{a.message}</div><div className="text-xs text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString()}</div></div>
                </div>
                <button onClick={() => remove(a.id)} className="p-1.5 rounded-lg hover:bg-red-500/10"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
