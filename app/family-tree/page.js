'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import FamilyTreeView from '@/components/family-tree/FamilyTreeView';
import { BsDiagram3Fill, BsPlus, BsXLg } from 'react-icons/bs';
import '@/styles/family-tree.css';

export default function FamilyTreePage() {
  const supabase = getSupabaseClient();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', birth_date: '', death_date: '', gender: 'male',
    parent_id: '', spouse_id: '', bio: '', avatar_url: '',
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    const { data } = await supabase
      .from('family_members')
      .select('*')
      .order('birth_date');
    setMembers(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      birth_date: form.birth_date || null,
      death_date: form.death_date || null,
      gender: form.gender,
      parent_id: form.parent_id || null,
      spouse_id: form.spouse_id || null,
      bio: form.bio || null,
      avatar_url: form.avatar_url || null,
    };
    const { error } = await supabase.from('family_members').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Member added to tree!');
    setShowAdd(false);
    setForm({ name: '', birth_date: '', death_date: '', gender: 'male', parent_id: '', spouse_id: '', bio: '', avatar_url: '' });
    fetchMembers();
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="container section-sm">
        <PageHeader
          icon={<BsDiagram3Fill />}
          title="Family Tree"
          subtitle="Visualise your complete family lineage across generations"
          badge="Family Tree"
          action={
            user && (
              <button className="btn-primary-custom" onClick={() => setShowAdd(true)}>
                <BsPlus style={{ fontSize: '1.2rem' }} /> Add Member
              </button>
            )
          }
        />

        {/* Stats */}
        {members.length > 0 && (
          <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
            {[
              { label: 'Total Members', value: members.length },
              { label: 'Generations', value: Math.max(...members.map((m) => {
                let depth = 0, cur = m;
                while (cur?.parent_id) {
                  depth++;
                  cur = members.find((x) => x.id === cur.parent_id);
                  if (depth > 10) break;
                }
                return depth;
              })) + 1 },
              { label: 'Living Members', value: members.filter((m) => !m.death_date).length },
            ].map((s) => (
              <div key={s.label} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '16px 24px',
              }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FamilyTreeView members={members} />
      )}

      {/* Add Member Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Add Family Member</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><BsXLg /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="add-member-form">
                <div>
                  <label className="label-custom">Full Name *</label>
                  <input className="input-custom" required placeholder="e.g. Ramesh Mhalkari" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label-custom">Gender</label>
                  <select className="input-custom" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label-custom">Date of Birth</label>
                  <input className="input-custom" type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                </div>
                <div>
                  <label className="label-custom">Date of Passing (if applicable)</label>
                  <input className="input-custom" type="date" value={form.death_date} onChange={(e) => setForm({ ...form, death_date: e.target.value })} />
                </div>
                <div>
                  <label className="label-custom">Parent</label>
                  <select className="input-custom" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })}>
                    <option value="">No parent (root)</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-custom">Spouse</label>
                  <select className="input-custom" value={form.spouse_id} onChange={(e) => setForm({ ...form, spouse_id: e.target.value })}>
                    <option value="">None</option>
                    {members.filter((m) => m.id !== form.parent_id).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="label-custom">Bio (optional)</label>
                <textarea className="input-custom" rows={2} placeholder="A short note about this person..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ marginTop: 12 }}>
                <label className="label-custom">Avatar URL (optional)</label>
                <input className="input-custom" placeholder="https://..." value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
              </div>
              <button className="btn-primary-custom" style={{ justifyContent: 'center', width: '100%', marginTop: 20 }} disabled={saving}>
                {saving ? 'Adding…' : 'Add to Family Tree'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
