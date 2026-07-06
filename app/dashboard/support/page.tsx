'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, SupportTicket } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LifeBuoy, Plus, MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setTickets(data || []);
  };

  useEffect(() => { load(); }, [user]);

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({ user_id: user.id, subject, description: desc, status: 'open' });
      if (error) throw error;
      toast.success('Ticket created');
      setSubject(''); setDesc(''); setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const openTicket = async (t: SupportTicket) => {
    setActive(t);
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', t.id).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !user || !reply) return;
    await supabase.from('ticket_messages').insert({ ticket_id: active.id, user_id: user.id, sender: 'user', message: reply });
    await supabase.from('support_tickets').update({ status: 'replied', updated_at: new Date().toISOString() }).eq('id', active.id);
    setReply('');
    openTicket(active);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Support</h1>
          <p className="text-sm text-muted-foreground">Get help from our support team.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500">
              <Plus className="w-4 h-4 mr-2" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader><DialogTitle>Create Support Ticket</DialogTitle></DialogHeader>
            <form onSubmit={createTicket} className="space-y-4">
              <div className="space-y-2"><Label>Subject</Label><Input required value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea required value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} /></div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Ticket'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card p-4">
          <h3 className="font-semibold mb-3">Your Tickets</h3>
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <LifeBuoy className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No tickets yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <button key={t.id} onClick={() => openTicket(t)} className={`w-full text-left p-3 rounded-xl transition-colors ${active?.id === t.id ? 'bg-yellow-500/10 border border-yellow-500/30' : 'hover:bg-muted/50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t.subject}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'open' ? 'bg-blue-500/10 text-blue-500' : t.status === 'replied' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground'}`}>{t.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(t.created_at).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="glass-card p-4">
          {active ? (
            <>
              <h3 className="font-semibold mb-3">{active.subject}</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-2.5 rounded-xl text-sm ${m.sender === 'user' ? 'bg-yellow-500/20 text-foreground' : 'bg-muted/50'}`}>
                      {m.message}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendReply} className="flex gap-2">
                <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply..." />
                <Button type="submit" size="icon" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"><Send className="w-4 h-4" /></Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center py-12">
              <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Select a ticket to view messages.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
