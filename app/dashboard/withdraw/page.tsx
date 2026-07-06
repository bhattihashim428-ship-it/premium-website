'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpFromLine, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function WithdrawPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [methods, setMethods] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    supabase.from('payment_methods').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      setMethods(data || []);
      if (data && data[0]) setMethod(data[0].name);
    });
    supabase.from('website_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => setSettings(data));
  }, []);

  const eligible = profile && profile.total_deposits >= (settings?.min_withdrawal_deposit || 500);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    if (amt > profile.wallet_balance) { toast.error('Insufficient wallet balance'); return; }
    if (!eligible) { toast.error(`Minimum approved deposit of Rs.${settings?.min_withdrawal_deposit || 500} is required before withdrawal.`); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('withdrawals').insert({
        user_id: user.id, amount: amt, payment_method: method, account_details: details, status: 'pending',
      });
      if (error) throw error;
      toast.success('Withdrawal request submitted!');
      setAmount(''); setDetails('');
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Withdraw Funds</h1>
        <p className="text-sm text-muted-foreground">Submit a withdrawal request for manual processing.</p>
      </div>

      {!eligible && (
        <Card className="glass-card p-4 border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-500">Withdrawal not available</p>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum approved deposit of Rs.{settings?.min_withdrawal_deposit || 500} is required before withdrawal.
                Your current approved deposits: Rs.{Number(profile?.total_deposits || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card className="glass-card p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Wallet Balance</div>
            <div className="text-lg font-bold gold-text">Rs. {Number(profile?.wallet_balance || 0).toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Total Deposits</div>
            <div className="text-lg font-bold">Rs. {Number(profile?.total_deposits || 0).toLocaleString()}</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Amount (Rs.)</Label>
            <Input type="number" required min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
          </div>
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
              <SelectContent>
                {methods.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Account Details</Label>
            <Textarea required value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Your account number / wallet address / mobile number" rows={3} />
          </div>
          <Button type="submit" disabled={loading || !eligible} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 h-11">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowUpFromLine className="w-4 h-4 mr-2" /> Submit Withdrawal</>}
          </Button>
        </form>
      </Card>
    </div>
  );
}
