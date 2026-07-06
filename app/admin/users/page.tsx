'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase, Profile } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, Ban, CheckCircle, Trash2, Edit, Wallet, Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<Profile | null>(null);
  const [edit, setEdit] = useState<{ wallet_balance: number; vip_level: number; account_status: string }>({ wallet_balance: 0, vip_level: 0, account_status: 'active' });

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => users.filter(u =>
    !search || (u.full_name + u.email + u.username).toLowerCase().includes(search.toLowerCase())
  ), [users, search]);

  const openEdit = (u: Profile) => {
    setActive(u);
    setEdit({ wallet_balance: Number(u.wallet_balance), vip_level: u.vip_level, account_status: u.account_status });
  };

  const saveEdit = async () => {
    if (!active) return;
    const { error } = await supabase.from('profiles').update({
      wallet_balance: edit.wallet_balance, vip_level: edit.vip_level, account_status: edit.account_status,
    }).eq('id', active.id);
    if (error) toast.error(error.message);
    else { toast.success('User updated'); setActive(null); load(); }
  };

  const toggleStatus = async (u: Profile, status: string) => {
    await supabase.from('profiles').update({ account_status: status }).eq('id', u.id);
    toast.success(`User ${status}`);
    load();
  };

  const deleteUser = async (u: Profile) => {
    if (!confirm(`Delete user ${u.full_name}? This cannot be undone.`)) return;
    await supabase.from('profiles').delete().eq('id', u.id);
    toast.success('User deleted');
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>User Management</h1>
        <p className="text-sm text-muted-foreground">Manage all platform users.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card className="glass-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground border-b border-border/40">
              <th className="py-2 px-2">User</th><th className="py-2 px-2">Email</th><th className="py-2 px-2">Wallet</th><th className="py-2 px-2">VIP</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/20 last:border-0">
                  <td className="py-2 px-2"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-black text-xs font-bold">{u.full_name?.[0]?.toUpperCase()}</div><span className="font-medium">{u.full_name}</span></div></td>
                  <td className="py-2 px-2 text-muted-foreground">{u.email}</td>
                  <td className="py-2 px-2">Rs. {Number(u.wallet_balance).toLocaleString()}</td>
                  <td className="py-2 px-2"><span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs">VIP {u.vip_level}</span></td>
                  <td className="py-2 px-2"><span className={`text-xs ${u.account_status === 'active' ? 'text-green-500' : 'text-red-500'}`}>{u.account_status}</span></td>
                  <td className="py-2 px-2"><div className="flex gap-1">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-muted/50"><Edit className="w-4 h-4 text-yellow-500" /></button>
                    {u.account_status === 'active' ? (
                      <button onClick={() => toggleStatus(u, 'suspended')} className="p-1.5 rounded-lg hover:bg-muted/50"><Ban className="w-4 h-4 text-red-500" /></button>
                    ) : (
                      <button onClick={() => toggleStatus(u, 'active')} className="p-1.5 rounded-lg hover:bg-muted/50"><CheckCircle className="w-4 h-4 text-green-500" /></button>
                    )}
                    <button onClick={() => deleteUser(u)} className="p-1.5 rounded-lg hover:bg-muted/50"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>}
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="glass-card">
          <DialogHeader><DialogTitle>Edit User — {active?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Wallet Balance</Label><Input type="number" step="0.01" value={edit.wallet_balance} onChange={(e) => setEdit({ ...edit, wallet_balance: parseFloat(e.target.value) || 0 })} /></div>
            <div className="space-y-2"><Label>VIP Level</Label><Input type="number" min="0" max="6" value={edit.vip_level} onChange={(e) => setEdit({ ...edit, vip_level: parseInt(e.target.value) || 0 })} /></div>
            <div className="space-y-2"><Label>Account Status</Label><select className="w-full p-2 rounded-lg bg-muted/50 border border-border" value={edit.account_status} onChange={(e) => setEdit({ ...edit, account_status: e.target.value })}><option value="active">Active</option><option value="suspended">Suspended</option><option value="banned">Banned</option></select></div>
            <Button onClick={saveEdit} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
