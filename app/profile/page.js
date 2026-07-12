'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { BsPersonFill, BsSave, BsShieldFill, BsPersonCircle } from 'react-icons/bs';

export default function ProfilePage() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', bio: '', birth_date: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUser(user);
      fetchProfile(user.id);
    });
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        birth_date: data.birth_date || '',
      });
    }
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Profile updated!');
  }

  function getInitials(name) {
    return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  if (loading) return <div className="container section"><LoadingSpinner /></div>;

  return (
    <div className="container section">
      <PageHeader
        icon={<BsPersonFill />}
        title="My Profile"
        subtitle="Manage your family portal account"
        badge="Profile"
      />

      <div className="row g-4">
        {/* Avatar & Info */}
        <div className="col-lg-4">
          <div className="card-custom" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 900, color: 'white',
              margin: '0 auto 20px',
              boxShadow: 'var(--shadow-glow)',
            }}>
              {getInitials(form.full_name || user?.email)}
            </div>
            <h3 style={{ fontWeight: 800, marginBottom: 4 }}>{form.full_name || 'Your Name'}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 16 }}>
              {user?.email}
            </p>
            <span className={`badge-custom ${profile?.role === 'admin' ? 'badge-purple' : 'badge-cyan'}`}>
              {profile?.role === 'admin' ? <><BsShieldFill style={{ marginRight: 4 }} />Admin</> : <><BsPersonCircle style={{ marginRight: 4 }} />Member</>}
            </span>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <div>Member since</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="col-lg-8">
          <div className="card-custom" style={{ padding: 32 }}>
            <h4 style={{ fontWeight: 700, marginBottom: 24 }}>Edit Profile</h4>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="label-custom">Full Name</label>
                  <input
                    className="input-custom"
                    placeholder="Your full name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="label-custom">Phone (for WhatsApp)</label>
                  <input
                    className="input-custom"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="label-custom">Date of Birth</label>
                  <input
                    className="input-custom"
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                  />
                </div>
                <div className="col-12">
                  <label className="label-custom">Bio</label>
                  <textarea
                    className="input-custom"
                    rows={3}
                    placeholder="Tell the family about yourself..."
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <div>
                <button className="btn-primary-custom" type="submit" disabled={saving}>
                  <BsSave /> {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>

            {/* Change password */}
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '28px 0' }} />
            <h4 style={{ fontWeight: 700, marginBottom: 16 }}>Change Password</h4>
            <button
              className="btn-secondary-custom"
              onClick={async () => {
                await supabase.auth.resetPasswordForEmail(user.email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                toast.success('Password reset link sent to your email!');
              }}
            >
              Send Password Reset Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
