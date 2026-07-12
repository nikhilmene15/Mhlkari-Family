'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { differenceInDays, format, parseISO, setYear, isSameDay } from 'date-fns';
import { BsCake2Fill, BsPlus, BsXLg, BsWhatsapp, BsPersonFill } from 'react-icons/bs';
import '@/styles/birthdays.css';

function getDaysUntilBirthday(birthDate) {
  const today = new Date();
  const bd = parseISO(birthDate);
  let next = setYear(bd, today.getFullYear());
  if (next < today) next = setYear(bd, today.getFullYear() + 1);
  const diff = differenceInDays(next, today);
  return isSameDay(next, today) ? 0 : diff;
}

function getInitials(name) {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function BirthdaysPage() {
  const supabase = getSupabaseClient();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', birth_date: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    const { data } = await supabase
      .from('family_members')
      .select('*')
      .not('birth_date', 'is', null)
      .order('birth_date');
    setMembers(data || []);
    setLoading(false);
  }

  const sorted = [...members].sort((a, b) =>
    getDaysUntilBirthday(a.birth_date) - getDaysUntilBirthday(b.birth_date)
  );

  const todayBirthdays = sorted.filter((m) => getDaysUntilBirthday(m.birth_date) === 0);
  const upcoming = sorted.filter((m) => getDaysUntilBirthday(m.birth_date) > 0);

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('family_members').insert(form);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Birthday added!');
    setShowAdd(false);
    setForm({ name: '', birth_date: '', phone: '' });
    fetchMembers();
  }

  function handleWhatsApp(member) {
    const msg = encodeURIComponent(`🎂 Happy Birthday ${member.name}! Wishing you a wonderful day! — Mhalkari Family`);
    const phone = member.phone?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  }

  const BirthdayCard = ({ member }) => {
    const days = getDaysUntilBirthday(member.birth_date);
    const isToday = days === 0;
    return (
      <div className="bday-card">
        <div className="bday-avatar-placeholder">{getInitials(member.name)}</div>
        <div className="bday-name">{member.name}</div>
        <div className="bday-date">
          {format(parseISO(member.birth_date), 'MMMM d')}
        </div>
        <div className="bday-countdown">
          {isToday ? (
            <div className="bday-today-banner">🎉 Today!</div>
          ) : (
            <>
              <span className="bday-days-num">{days}</span>
              <span className="bday-days-label">days to go</span>
            </>
          )}
        </div>
        {member.phone && (
          <button className="bday-send-wish-btn" onClick={() => handleWhatsApp(member)}>
            <BsWhatsapp style={{ marginRight: 6 }} /> Send Wish
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="container section">
      <PageHeader
        icon={<BsCake2Fill />}
        title="Birthday Reminders"
        subtitle="Never miss a family birthday — auto WhatsApp reminders included"
        badge="Birthdays"
        action={
          user && (
            <button className="btn-primary-custom" onClick={() => setShowAdd(true)}>
              <BsPlus style={{ fontSize: '1.2rem' }} /> Add Birthday
            </button>
          )
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : members.length === 0 ? (
        <EmptyState
          icon="🎂"
          title="No birthdays added yet"
          description="Add family members with their birthdays to get started"
          action={
            user && (
              <button className="btn-primary-custom" onClick={() => setShowAdd(true)}>
                <BsPlus /> Add Birthday
              </button>
            )
          }
        />
      ) : (
        <>
          {/* Today */}
          {todayBirthdays.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div className="birthday-hero-card">
                <div style={{ fontSize: '3rem', marginBottom: 8 }}>🎉</div>
                <h2 style={{ color: 'white', fontWeight: 900, marginBottom: 8 }}>
                  {todayBirthdays.map((m) => m.name).join(' & ')}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 20 }}>
                  {todayBirthdays.length === 1 ? "Today is their" : "Today are their"} birthday!
                </p>
                {todayBirthdays.map((m) => m.phone && (
                  <button
                    key={m.id}
                    className="btn-primary-custom"
                    style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)' }}
                    onClick={() => handleWhatsApp(m)}
                  >
                    <BsWhatsapp /> Wish {m.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          <div className="section-label" style={{ marginBottom: 24 }}>Upcoming Birthdays</div>
          <div className="bday-grid">
            {upcoming.map((m) => <BirthdayCard key={m.id} member={m} />)}
          </div>
        </>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Add Birthday</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><BsXLg /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label-custom">Full Name</label>
                <input className="input-custom" placeholder="Family member name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label-custom">Date of Birth</label>
                <input className="input-custom" type="date" required value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
              </div>
              <div>
                <label className="label-custom">Phone (for WhatsApp wish)</label>
                <input className="input-custom" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <button className="btn-primary-custom" style={{ justifyContent: 'center', marginTop: 4 }} disabled={saving}>
                {saving ? 'Saving…' : 'Add Birthday'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
