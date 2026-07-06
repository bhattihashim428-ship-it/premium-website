'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Crown, AlertCircle } from 'lucide-react';

export default function Error() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 premium-gradient bg-background">
      <div className="text-center relative animate-fade-in-scale">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Crown className="w-6 h-6 text-black" />
          </div>
        </Link>
        <div className="text-8xl font-bold gold-text mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>500</div>
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">An unexpected error occurred. Please try again.</p>
        <Button asChild className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
