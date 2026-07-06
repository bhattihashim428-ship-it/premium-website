'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Crown, LayoutDashboard, Users, ArrowDownToLine, ArrowUpFromLine, Gift, Settings, Megaphone, LifeBuoy, LogOut, Menu, X, Shield } from 'lucide-react';

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/deposits', label: 'Deposits', icon: ArrowDownToLine },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
  { href: '/admin/otp', label: 'OTP & Rewards', icon: Gift },
  { href: '/admin/vip', label: 'VIP Levels', icon: Crown },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isLoginRoute = pathname === '/admin/login';

  useEffect(() => {
    if (loading || isLoginRoute) return;
    if (!user || !isAdmin) router.replace('/admin/login');
  }, [user, isAdmin, loading, router, isLoginRoute]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass border-b border-border/40 h-14 flex items-center justify-between px-4">
        <button onClick={() => setOpen(true)} className="p-2"><Menu className="w-5 h-5" /></button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-yellow-500" />
          <span className="font-bold gold-text text-sm" style={{ fontFamily: 'var(--font-playfair)' }}>Admin Panel</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 glass border-r border-border/40 transform transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/40">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center"><Shield className="w-5 h-5 text-black" /></div>
            <span className="font-bold gold-text" style={{ fontFamily: 'var(--font-playfair)' }}>Admin Panel</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1"><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {adminNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? 'bg-gradient-to-r from-yellow-500/20 to-transparent text-foreground border border-yellow-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                <item.icon className={`w-4 h-4 ${active ? 'text-yellow-500' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button onClick={async () => { await signOut(); router.push('/admin/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>
      </aside>

      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="lg:ml-64 pt-14 lg:pt-0">
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
