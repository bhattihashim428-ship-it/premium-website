'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  TrendingUp, Wallet, Crown, Gift, Shield, Zap, ArrowRight, Star, BarChart3,
  Lock, Globe, CheckCircle2, Sparkles, ChevronRight,
} from 'lucide-react';

export default function LandingPage() {
  const { user, profile, t, theme, setTheme } = useAuth();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    supabase.from('website_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setSettings(data);
    });
  }, []);

  const siteName = settings?.site_name || 'Premium Traders';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <span className="font-playfair text-xl font-bold gold-text tracking-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
              {siteName}
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#vip" className="text-muted-foreground hover:text-foreground transition-colors">VIP</a>
            <a href="#rewards" className="text-muted-foreground hover:text-foreground transition-colors">Rewards</a>
            <a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500">
                <Link href="/dashboard">Dashboard <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500">
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 premium-gradient">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-yellow-600/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-medium">Premium Fintech Platform</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold mb-6 animate-fade-in" style={{ fontFamily: 'var(--font-playfair)' }}>
            Trade with <span className="gold-text">Luxury</span>.<br />Invest with <span className="gold-text">Confidence</span>.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            A premium platform built for serious traders. Manual deposits, daily OTP rewards,
            VIP membership, and a wallet that works as hard as you do.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button asChild size="lg" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 text-base h-12 px-8">
              <Link href="/register">Create Free Account <ArrowRight className="w-5 h-5 ml-2" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base h-12 px-8 glass">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-16 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            {[
              { label: 'Active Traders', value: '12K+' },
              { label: 'Total Rewards Paid', value: 'Rs. 8.2M' },
              { label: 'VIP Members', value: '3,400' },
            ].map((s) => (
              <div key={s.label} className="glass-card p-4">
                <div className="text-2xl sm:text-3xl font-bold gold-text">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
              Everything you need to <span className="gold-text">grow</span>
            </h2>
            <p className="text-muted-foreground">Premium features designed for premium traders.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Wallet, title: 'Smart Wallet', desc: 'Real-time balance updates with full transaction history and analytics.' },
              { icon: Gift, title: 'Daily OTP Rewards', desc: 'Claim 20% of your total deposits every day via our global OTP system.' },
              { icon: Crown, title: 'VIP Membership', desc: '7 VIP tiers with automatic upgrades, exclusive benefits, and badges.' },
              { icon: Shield, title: 'Bank-Grade Security', desc: 'Hashed passwords, JWT auth, RLS policies, and encrypted sessions.' },
              { icon: BarChart3, title: 'Premium Analytics', desc: 'Interactive charts, revenue statistics, and wallet insights.' },
              { icon: Globe, title: 'Multi-Language', desc: 'English and Urdu support with instant theme switching.' },
            ].map((f, i) => (
              <Card key={f.title} className="glass-card p-6 hover:scale-[1.02] transition-all duration-300 group animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center mb-4 group-hover:from-yellow-500/30 group-hover:to-yellow-600/20 transition-colors">
                  <f.icon className="w-6 h-6 text-yellow-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Section */}
      <section id="vip" className="py-20 px-4 sm:px-6 bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent">
        <div className="max-w-5xl mx-auto text-center">
          <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4 animate-float" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
            Climb the <span className="gold-text">VIP Ladder</span>
          </h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
            From Bronze to Legend — 7 tiers of exclusive benefits. Your VIP level upgrades automatically as you trade.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { name: 'Bronze', color: '#CD7F32' }, { name: 'Silver', color: '#C0C0C0' },
              { name: 'Gold', color: '#D4AF37' }, { name: 'Platinum', color: '#E5E4E2' },
              { name: 'Diamond', color: '#B9F2FF' }, { name: 'Elite', color: '#FFD700' },
              { name: 'Legend', color: '#9B59B6' },
            ].map((v, i) => (
              <div key={v.name} className="glass-card p-4 hover:scale-105 transition-transform animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: v.color }}>
                  <Star className="w-5 h-5 text-black" />
                </div>
                <div className="text-xs font-medium">{v.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rewards CTA */}
      <section id="rewards" className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto glass-card p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent pointer-events-none" />
          <div className="relative">
            <Gift className="w-12 h-12 text-yellow-500 mx-auto mb-4 animate-float" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
              Daily <span className="gold-text">OTP Rewards</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Every day at 5:00 PM, one global OTP is generated. Eligible users claim 20% of their total approved deposits — automatically credited to their wallet.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500">
              <Link href="/register">Start Earning Today <ArrowRight className="w-5 h-5 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-black" />
                </div>
                <span className="font-bold gold-text" style={{ fontFamily: 'var(--font-playfair)' }}>{siteName}</span>
              </div>
              <p className="text-xs text-muted-foreground">Premium fintech platform for traders and investors.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground">Login</Link></li>
                <li><Link href="/register" className="hover:text-foreground">Register</Link></li>
                <li><Link href="/contact" className="hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-foreground">Refund Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Connect</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {settings?.contact_whatsapp && <li>WhatsApp: {settings.contact_whatsapp}</li>}
                {settings?.contact_email && <li>{settings.contact_email}</li>}
                {settings?.contact_telegram && <li>Telegram: {settings.contact_telegram}</li>}
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-border/40 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
