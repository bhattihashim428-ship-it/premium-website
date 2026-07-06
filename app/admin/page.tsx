'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AdminIndex() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (user && isAdmin) router.push('/admin/dashboard');
    else router.push('/admin/login');
  }, [user, isAdmin, loading, router]);
  return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-12 h-12 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin" /></div>;
}
