'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, Notification } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Megaphone } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setNotifs(data || []);
  };

  useEffect(() => { load(); }, [user]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    load();
  };
  const markAll = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    load();
  };

  const iconFor = (type: string) => {
    if (type === 'success') return CheckCircle2;
    if (type === 'warning') return AlertTriangle;
    if (type === 'error') return XCircle;
    if (type === 'announcement') return Megaphone;
    return Info;
  };
  const colorFor = (type: string) => {
    if (type === 'success') return 'text-green-500';
    if (type === 'warning') return 'text-yellow-500';
    if (type === 'error') return 'text-red-500';
    return 'text-blue-500';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on your account activity.</p>
        </div>
        {notifs.some(n => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={markAll} className="glass">
            <CheckCheck className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      <Card className="glass-card p-4 sm:p-6">
        {notifs.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <Bell className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifs.map((n) => {
              const Icon = iconFor(n.type);
              return (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${n.is_read ? 'bg-transparent' : 'bg-yellow-500/5 border border-yellow-500/20'}`}>
                  <Icon className={`w-5 h-5 ${colorFor(n.type)} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} className="text-yellow-500 hover:text-yellow-400 flex-shrink-0">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
