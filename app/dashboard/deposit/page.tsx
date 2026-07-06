'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase, PaymentMethod } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownToLine, Copy, Check, QrCode, Upload, Loader2, Building2, Smartphone, Bitcoin, History, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function DepositPage() {
  const { user, refreshProfile } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('deposits')
      .select('id, amount, reference_number, screenshot_url, status, rejection_reason, admin_remarks, created_at, reviewed_at, payment_methods(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setHistory(data || []);
  };

  useEffect(() => {
    supabase.from('payment_methods').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      setMethods(data || []);
      if (data && data[0]) setSelected(data[0]);
    });
    loadHistory();
  }, []);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selected) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setLoading(true);
    try {
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const ext = screenshot.name.split('.').pop();
        const path = `deposits/${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('screenshots').upload(path, screenshot);
        if (!upErr) {
          const { data } = supabase.storage.from('screenshots').getPublicUrl(path);
          screenshotUrl = data.publicUrl;
        }
      }
      const { error } = await supabase.from('deposits').insert({
        user_id: user.id,
        payment_method_id: selected.id,
        amount: amt,
        reference_number: reference,
        screenshot_url: screenshotUrl,
        status: 'pending',
      });
      if (error) throw error;
      toast.success('Deposit request submitted! Awaiting approval.');
      setAmount(''); setReference(''); setScreenshot(null);
      await refreshProfile();
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit deposit');
    } finally {
      setLoading(false);
    }
  };

  const methodIcon = (name: string) => {
    if (name.toLowerCase().includes('bank')) return Building2;
    if (name.toLowerCase().includes('usdt')) return Bitcoin;
    return Smartphone;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Deposit Funds</h1>
        <p className="text-sm text-muted-foreground">Choose a payment method and submit your deposit request.</p>
      </div>

      {/* Payment methods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {methods.map((m) => {
          const Icon = methodIcon(m.name);
          const active = selected?.id === m.id;
          return (
            <Card key={m.id} onClick={() => setSelected(m)}
              className={`glass-card p-5 cursor-pointer transition-all ${active ? 'border-yellow-500/50 ring-1 ring-yellow-500/30' : 'hover:scale-[1.02]'}`}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="font-semibold text-sm">{m.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{m.account_title}</div>
              <div className="text-xs font-mono mt-1">{m.account_number}</div>
            </Card>
          );
        })}
      </div>

      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Method details */}
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">{selected.name} Details</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Account Title</Label>
                <div className="flex items-center justify-between mt-1 p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-mono">{selected.account_title}</span>
                  <button onClick={() => copy(selected.account_title, 'title')} className="text-yellow-500">
                    {copied === 'title' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Account Number</Label>
                <div className="flex items-center justify-between mt-1 p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-mono">{selected.account_number}</span>
                  <button onClick={() => copy(selected.account_number, 'num')} className="text-yellow-500">
                    {copied === 'num' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {selected.instructions && (
                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-xs text-muted-foreground">{selected.instructions}</p>
                </div>
              )}
              <div className="flex items-center justify-center p-6 bg-white rounded-xl">
                <QrCode className="w-32 h-32 text-black" />
              </div>
            </div>
          </Card>

          {/* Submit form */}
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Submit Deposit Request</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (Rs.)</Label>
                <Input type="number" required min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" />
              </div>
              <div className="space-y-2">
                <Label>Transaction Reference Number</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TXN123456789" />
              </div>
              <div className="space-y-2">
                <Label>Upload Screenshot</Label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-yellow-500/50 transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} />
                  {screenshot ? (
                    <div className="text-center">
                      <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm">{screenshot.name}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload receipt</p>
                    </div>
                  )}
                </label>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 h-11">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowDownToLine className="w-4 h-4 mr-2" /> Submit Deposit</>}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Deposit History */}
      <Card className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold">Deposit History</h3>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No deposits yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((d) => (
              <div key={d.id} className="p-4 rounded-xl bg-muted/20 border border-border/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                      <ArrowDownToLine className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <div className="font-semibold">Rs. {Number(d.amount).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.payment_methods?.name || '—'} • {new Date(d.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${
                    d.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    d.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                    {d.status}
                  </span>
                </div>
                {d.reference_number && (
                  <div className="text-xs text-muted-foreground">Transaction ID: <span className="font-mono">{d.reference_number}</span></div>
                )}
                {d.status === 'rejected' && d.rejection_reason && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                    <span className="font-medium">Rejection Reason: </span>{d.rejection_reason}
                  </div>
                )}
                {d.status === 'approved' && d.admin_remarks && (
                  <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-500">
                    <span className="font-medium">Message: </span>{d.admin_remarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
