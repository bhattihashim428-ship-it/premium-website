'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Crown, LayoutDashboard, Wallet, ArrowDownToLine, ArrowUpFromLine, Receipt, Gift, LifeBuoy, Settings, User, Bell, LogOut, Menu, X, Moon, Sun, Globe } from 'lucide-react';
import { Notification } from '@/lib/supabase';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { href: '/dashboard/transactions', label: 'Transactions', icon: Receipt },
  { href: '/dashboard/vip', label: 'VIP Center', icon: Crown },
  { href: '/dashboard/gifts', label: 'Gift Center', icon: Gift },
  { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut, theme, setTheme, language, setLanguage, t } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const loadUnread = async () => {
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false);
      setUnread(count || 0);
    };
    loadUnread();
    const channel = supabase.channel('notifications').on('postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
      loadUnread
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const cycleTheme = () => {
    const themes = ['dark', 'light', 'midnight', 'emerald'] as const;
    const idx = themes.indexOf(theme as any);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass border-b border-border/40 h-14 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2"><Menu className="w-5 h-5" /></button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
            <Crown className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold gold-text text-sm" style={{ fontFamily: 'var(--font-playfair)' }}>Premium</span>
        </Link>
        <button onClick={cycleTheme} className="p-2">
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 glass border-r border-border/40 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/40">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold gold-text" style={{ fontFamily: 'var(--font-playfair)' }}>Premium Traders</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1"><X className="w-5 h-5" /></button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${active ? 'bg-gradient-to-r from-yellow-500/20 to-transparent text-foreground border border-yellow-500/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                <item.icon className={`w-4 h-4 ${active ? 'text-yellow-500' : ''}`} />
                <span>{t(item.label.toLowerCase() as any) || item.label}</span>
                {item.label === 'Notifications' && unread > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>
                )}
              </Link>
            );
          })}
          <button onClick={async () => { await signOut(); router.push('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </nav>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="lg:ml-64 pt-14 lg:pt-0">
        {/* Top bar */}
        <header className="hidden lg:flex sticky top-0 z-30 glass border-b border-border/40 h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={cycleTheme} className="p-2 rounded-lg hover:bg-muted/50 transition-colors" title="Switch theme">
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')} className="p-2 rounded-lg hover:bg-muted/50 transition-colors" title="Switch language">
              <Globe className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/notifications" className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Bell className="w-4 h-4" />
              {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </Link>
            <Link href="/dashboard/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black text-xs font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium hidden sm:block">{profile?.full_name || 'User'}</span>
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
