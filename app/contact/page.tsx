'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Phone, MessageCircle, Send, Mail, Facebook, Instagram, MapPin, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ContactPage() {
  const [settings, setSettings] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('website_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => setSettings(data));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success('Message sent! We will get back to you soon.');
    setForm({ name: '', email: '', message: '' });
    setLoading(false);
  };

  const contacts = [
    settings?.contact_phone && { icon: Phone, label: 'Phone', value: settings.contact_phone, href: `tel:${settings.contact_phone}` },
    settings?.contact_whatsapp && { icon: MessageCircle, label: 'WhatsApp', value: settings.contact_whatsapp, href: `https://wa.me/${settings.contact_whatsapp}` },
    settings?.contact_telegram && { icon: Send, label: 'Telegram', value: settings.contact_telegram, href: settings.contact_telegram },
    settings?.contact_email && { icon: Mail, label: 'Email', value: settings.contact_email, href: `mailto:${settings.contact_email}` },
    settings?.contact_facebook && { icon: Facebook, label: 'Facebook', value: 'Visit Page', href: settings.contact_facebook },
    settings?.contact_instagram && { icon: Instagram, label: 'Instagram', value: 'Visit Profile', href: settings.contact_instagram },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center"><Crown className="w-5 h-5 text-black" /></div>
            <span className="font-playfair text-xl font-bold gold-text" style={{ fontFamily: 'var(--font-playfair)' }}>{settings?.site_name || 'Premium Traders'}</span>
          </Link>
          <Button asChild variant="ghost" size="sm"><Link href="/login">Login</Link></Button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Get in <span className="gold-text">Touch</span></h1>
          <p className="text-muted-foreground">We're here to help with any questions.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {contacts.map((c: any) => (
              <Card key={c.label} className="glass-card p-4 flex items-center gap-4 hover:scale-[1.02] transition-transform">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 flex items-center justify-center">
                  <c.icon className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="text-sm font-medium">{c.value}</div>
                </div>
                <a href={c.href} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:text-yellow-400 text-xs">Open</a>
              </Card>
            ))}
            <Card className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-yellow-500" /><span className="text-sm font-medium">Location</span></div>
              <div className="h-48 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">Google Map Placeholder</div>
            </Card>
          </div>

          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Send us a message</h3>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-2"><Label>Message</Label><Textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} /></div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 h-11">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
