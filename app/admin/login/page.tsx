'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Mail, Lock, ArrowRight, Loader2, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [user, isAdmin, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const role = data.user?.app_metadata?.role;
      if (role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Access denied. Admin credentials required.');
      }

      toast.success('Welcome back, Admin');
      router.replace('/admin/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 premium-gradient bg-background">
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      <Card className="glass-card w-full max-w-md p-8 relative animate-fade-in-scale">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Shield className="w-7 h-7 text-black" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Admin Login</h1>
          <p className="text-sm text-muted-foreground">Authorized personnel only</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Admin Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="admin@premiumtraders.com" disabled={busy} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" placeholder="••••••••" disabled={busy} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 h-11">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>
        </form>
        <div className="mt-6 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
          <p className="text-xs text-center text-muted-foreground">
            <span className="text-yellow-500/80">Demo credentials:</span> admin@premiumtraders.com / Admin@123
          </p>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link href="/login" className="hover:text-foreground">User Login</Link>
        </p>
      </Card>
    </div>
  );
}
