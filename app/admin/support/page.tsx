'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Send, LifeBuoy, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');

  const load = async () => {
    const { data } = await supabase.from('support_tickets').select('*, profiles(full_name, email)').order('created_at', { ascending: false });
    setTickets(data || []);
  };
  useEffect(() => { load(); }, []);

  const openTicket = async (t: any) => {
    setActive(t);
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', t.id).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !user || !reply) return;
    await supabase.from('ticket_messages').insert({ ticket_id: active.id, user_id: user.id, sender: 'admin', message: reply });
    await supabase.from('support_tickets').update({ status: 'replied', updated_at: new Date().toISOString() }).eq('id', active.id);
    await supabase.from('notifications').insert({ user_id: active.user_id, title: 'Support Reply', message: 'Admin replied to your ticket.', type: 'info' });
    setReply('');
    openTicket(active);
    load();
  };

  const closeTicket = async (t: any) => {
    await supabase.from('support_tickets').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', t.id);
    toast.success('Ticket closed');
    setActive(null);
    load();
  };

  const filtered = tickets.filter(t => !search || (t.subject + (t.profiles?.full_name || '')).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Support Management</h1>
        <p className="text-sm text-muted-foreground">Handle user support tickets.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card p-4">
          <h3 className="font-semibold mb-3">All Tickets</h3>
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No tickets.</p> : (
            <div className="space-y-2">
              {filtered.map((t) => (
                <button key={t.id} onClick={() => openTicket(t)} className={`w-full text-left p-3 rounded-xl transition-colors ${active?.id === t.id ? 'bg-yellow-500/10 border border-yellow-500/30' : 'hover:bg-muted/50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t.subject}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'open' ? 'bg-blue-500/10 text-blue-500' : t.status === 'replied' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>{t.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{t.profiles?.full_name} • {new Date(t.created_at).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="glass-card p-4">
          {active ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{active.subject}</h3>
                <Button variant="outline" size="sm" onClick={() => closeTicket(active)} className="text-red-500 border-red-500/30"><X className="w-3 h-3 mr-1" /> Close</Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-2.5 rounded-xl text-sm ${m.sender === 'admin' ? 'bg-yellow-500/20' : 'bg-muted/50'}`}>{m.message}</div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendReply} className="flex gap-2">
                <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply..." />
                <Button type="submit" size="icon" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"><Send className="w-4 h-4" /></Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center py-12"><LifeBuoy className="w-8 h-8 text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Select a ticket to view.</p></div>
          )}
        </Card>
      </div>
    </div>
  );
}
