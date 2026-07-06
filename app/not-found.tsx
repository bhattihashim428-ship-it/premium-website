'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Crown, Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 premium-gradient bg-background">
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-float" />
      <div className="text-center relative animate-fade-in-scale">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Crown className="w-6 h-6 text-black" />
          </div>
        </Link>
        <div className="text-8xl sm:text-9xl font-bold gold-text mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>404</div>
        <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">The page you're looking for doesn't exist or has been moved.</p>
        <Button asChild className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500">
          <Link href="/"><Home className="w-4 h-4 mr-2" /> Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
