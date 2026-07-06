'use client';

import { useEffect, useState } from 'react';
import { supabase, VipLevel } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Crown, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminVipPage() {
  const [levels, setLevels] = useState<VipLevel[]>([]);
  const [editing, setEditing] = useState<VipLevel | null>(null);

  const load = async () => {
    const { data } = await supabase.from('vip_levels').select('*').order('level', { ascending: true });
    setLevels(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async (l: VipLevel) => {
    const { error } = await supabase.from('vip_levels').upsert({
      level: l.level, name: l.name, required_deposit: l.required_deposit, required_withdrawal: l.required_withdrawal,
      benefits: l.benefits, badge_color: l.badge_color, icon: l.icon, is_enabled: l.is_enabled, sort_order: l.sort_order,
    });
    if (error) toast.error(error.message);
    else { toast.success('VIP level saved'); setEditing(null); load(); }
  };

  const addNew = () => {
    const maxLevel = Math.max(...levels.map(l => l.level), -1);
    setEditing({ level: maxLevel + 1, name: 'New VIP', required_deposit: 0, required_withdrawal: 0, benefits: '', badge_color: '#D4AF37', icon: 'crown', is_enabled: true, sort_order: maxLevel + 1 });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>VIP Management</h1>
          <p className="text-sm text-muted-foreground">Configure VIP levels and requirements.</p>
        </div>
        <Button onClick={addNew} className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"><Plus className="w-4 h-4 mr-2" /> Add Level</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {levels.map((l) => (
          <Card key={l.level} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: l.badge_color }}><Crown className="w-6 h-6 text-black" /></div>
                <div><div className="font-semibold">VIP {l.level} — {l.name}</div><div className="text-xs text-muted-foreground">{l.is_enabled ? 'Enabled' : 'Disabled'}</div></div>
              </div>
              <Switch checked={l.is_enabled} onCheckedChange={(v) => save({ ...l, is_enabled: v })} />
            </div>
            <div className="text-xs text-muted-foreground space-y-1 mb-3">
              <div>Deposit: Rs. {Number(l.required_deposit).toLocaleString()}</div>
              <div>Withdrawal: Rs. {Number(l.required_withdrawal).toLocaleString()}</div>
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{l.benefits}</p>
            <Button variant="outline" size="sm" onClick={() => setEditing(l)} className="w-full glass">Edit</Button>
          </Card>
        ))}
      </div>

      {editing && (
        <Card className="glass-card p-6 max-w-lg mx-auto">
          <h3 className="font-semibold mb-4">Edit VIP {editing.level}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Badge Color</Label><Input type="color" value={editing.badge_color} onChange={(e) => setEditing({ ...editing, badge_color: e.target.value })} /></div>
              <div className="space-y-2"><Label>Required Deposit</Label><Input type="number" value={editing.required_deposit} onChange={(e) => setEditing({ ...editing, required_deposit: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Required Withdrawal</Label><Input type="number" value={editing.required_withdrawal} onChange={(e) => setEditing({ ...editing, required_withdrawal: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div className="space-y-2"><Label>Benefits</Label><Textarea value={editing.benefits || ''} onChange={(e) => setEditing({ ...editing, benefits: e.target.value })} rows={2} /></div>
            <div className="flex gap-2">
              <Button onClick={() => save(editing)} className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black"><Save className="w-4 h-4 mr-2" /> Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
