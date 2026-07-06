'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Crown, Mail, Lock, User, Phone, Globe, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', phone: '', country: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName, username: form.username } },
      });
      if (error) throw error;
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: form.fullName,
          username: form.username,
          email: form.email,
          phone: form.phone,
          country: form.country,
        });
      }
      toast.success('Account created! Please sign in.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 premium-gradient">
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      <Card className="glass-card w-full max-w-md p-8 relative animate-fade-in-scale my-8">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
              <Crown className="w-6 h-6 text-black" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Create Account</h1>
          <p className="text-sm text-muted-foreground">Join the premium trading platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="fullName" required value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="pl-10" placeholder="John Doe" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" required value={form.username} onChange={(e) => handleChange('username', e.target.value)} placeholder="johndoe" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="email" type="email" required value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="pl-10" placeholder="you@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="phone" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="pl-10" placeholder="+92..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="country" value={form.country} onChange={(e) => handleChange('country', e.target.value)} className="pl-10" placeholder="Pakistan" />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="password" type={showPw ? 'text' : 'password'} required value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="pl-10 pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="confirm" type={showPw ? 'text' : 'password'} required value={form.confirm} onChange={(e) => handleChange('confirm', e.target.value)} className="pl-10" placeholder="••••••••" />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 h-11">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-yellow-500 hover:underline font-medium">Sign In</Link>
        </p>
      </Card>
    </div>
  );
}
