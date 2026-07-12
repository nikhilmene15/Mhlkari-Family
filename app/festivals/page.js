'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import CountdownTimer from '@/components/festivals/CountdownTimer';
import { format, parseISO, isPast } from 'date-fns';
import { BsStarFill, BsPlus, BsXLg, BsTrash, BsListCheck, BsCalendarEvent, BsCake2Fill, BsHeartFill, BsCalendar3 } from 'react-icons/bs';
import '@/styles/festivals.css';

const FESTIVAL_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'festival', label: 'Festivals' },
  { value: 'birthday', label: 'Birthdays' },
  { value: 'anniversary', label: 'Anniversaries' },
  { value: 'event', label: 'Events' },
];

const FESTIVAL_ICONS = {
  festival: <BsStarFill />, birthday: <BsCake2Fill />, anniversary: <BsHeartFill />, event: <BsCalendar3 />,
};

const ACCENT_COLORS = [
  'var(--gradient-primary)', 'var(--gradient-pink)', 'var(--gradient-green)',
  'var(--gradient-amber)', 'var(--gradient-purple)',
];

const PRESET_FESTIVALS = [
  { name: 'Diwali', type: 'festival' },
  { name: 'Eid ul-Fitr', type: 'festival' },
  { name: 'Holi', type: 'festival' },
  { name: 'Christmas', type: 'festival' },
  { name: 'New Year', type: 'festival' },
  { name: 'Navratri', type: 'festival' },
];

export default function FestivalsPage() {
  const supabase = getSupabaseClient();
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', description: '', type: 'festival', recurring: false });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchFestivals();
  }, []);

  async function fetchFestivals() {
    setLoading(true);
    const { data } = await supabase.from('festivals').select('*').order('date');
    setFestivals(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('festivals').insert({ ...form, created_by: user?.id });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Festival added!');
    setShowAdd(false);
    setForm({ name: '', date: '', description: '', type: 'festival', recurring: false });
    fetchFestivals();
  }

  async function handleDelete(id) {
    if (!confirm('Delete this festival?')) return;
    await supabase.from('festivals').delete().eq('id', id);
    toast.success('Festival deleted');
    fetchFestivals();
  }

  const filtered = festivals.filter((f) =>
    filter === 'all' || f.type === filter
  );

  const upcoming = filtered.filter((f) => !isPast(parseISO(f.date)));
  const past = filtered.filter((f) => isPast(parseISO(f.date)));

  return (
    <div className="container section">
      <PageHeader
        icon={<BsStarFill />}
        title="Festival Countdown"
        subtitle="Live countdowns for festivals, anniversaries & family events"
        badge="Festivals & Events"
        action={
          user && (
            <button className="btn-primary-custom" onClick={() => setShowAdd(true)}>
              <BsPlus style={{ fontSize: '1.2rem' }} /> Add Event
            </button>
          )
        }
      />

      {/* Type filter */}
      <div className="festival-type-tab">
        {FESTIVAL_TYPES.map((t) => (
          <button
            key={t.value}
            className={`type-tab-btn${filter === t.value ? ' active' : ''}`}
            onClick={() => setFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BsStarFill />}
          title="No events added yet"
          description="Add festivals and family events to see live countdowns"
          action={
            user && (
              <button className="btn-primary-custom" onClick={() => setShowAdd(true)}>
                <BsPlus /> Add Event
              </button>
            )
          }
        />
      ) : (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <>
              <div className="section-label" style={{ marginBottom: 20 }}>Upcoming</div>
              <div className="festival-grid" style={{ marginBottom: 48 }}>
                {upcoming.map((f, idx) => (
                  <div key={f.id} className="festival-card">
                    <div className="festival-card-accent" style={{ background: ACCENT_COLORS[idx % ACCENT_COLORS.length] }} />
                    <div className="festival-card-body">
                      <span className="festival-emoji">
                        {FESTIVAL_EMOJIS[f.type] || '📅'}
                      </span>
                      <h3 className="festival-name">{f.name}</h3>
                      <p className="festival-date-text">
                        {format(parseISO(f.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <CountdownTimer date={f.date} />
                      {f.description && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>
                          {f.description}
                        </p>
                      )}
                      {user && (
                        <button
                          className="btn-danger"
                          style={{ marginTop: 16, fontSize: '0.75rem' }}
                          onClick={() => handleDelete(f.id)}
                        >
                          <BsTrash /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Past */}
          {past.length > 0 && (
            <>
              <div className="section-label" style={{ marginBottom: 20, opacity: 0.6 }}>Past Events</div>
              <div className="festival-grid" style={{ opacity: 0.5 }}>
                {past.map((f, idx) => (
                  <div key={f.id} className="festival-card">
                    <div className="festival-card-accent" style={{ background: 'var(--border)' }} />
                    <div className="festival-card-body">
                      <span className="festival-emoji">{FESTIVAL_EMOJIS[f.type] || '📅'}</span>
                      <h3 className="festival-name">{f.name}</h3>
                      <p className="festival-date-text">
                        {format(parseISO(f.date), 'MMMM d, yyyy')}
                      </p>
                      <div className="festival-past-badge">✓ Completed</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Add Festival / Event</h3>
              <button className="modal-close" onClick={() => setShowAdd(false)}><BsXLg /></button>
            </div>

            {/* Presets */}
            <p className="label-custom" style={{ marginBottom: 8 }}>Quick presets</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {PRESET_FESTIVALS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className="filter-btn"
                  style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                  onClick={() => setForm((f) => ({ ...f, name: p.name, type: p.type }))}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <form onSubmit={handleAdd}>
              <div className="add-festival-form">
                <div>
                  <label className="label-custom">Event Name</label>
                  <input className="input-custom" required placeholder="e.g. Diwali" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="label-custom">Date</label>
                  <input className="input-custom" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="label-custom">Type</label>
                  <select className="input-custom" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="festival">Festival</option>
                    <option value="birthday">Birthday</option>
                    <option value="anniversary">Anniversary</option>
                    <option value="event">Custom Event</option>
                  </select>
                </div>
                <div>
                  <label className="label-custom">Description (optional)</label>
                  <input className="input-custom" placeholder="Add a note..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <button className="btn-primary-custom" style={{ justifyContent: 'center', width: '100%', marginTop: 20 }} disabled={saving}>
                {saving ? 'Saving…' : 'Add Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
