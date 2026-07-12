'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import PollCard from '@/components/polls/PollCard';
import { BsBarChartFill, BsPlus, BsXLg, BsDashLg } from 'react-icons/bs';
import '@/styles/polls.css';

export default function PollsPage() {
  const supabase = getSupabaseClient();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchPolls();
  }, []);

  async function fetchPolls() {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const { data: pollsData } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (!pollsData) { setPolls([]); setLoading(false); return; }

    const enriched = await Promise.all(pollsData.map(async (poll) => {
      const { data: votes } = await supabase
        .from('poll_votes')
        .select('option_index, user_id')
        .eq('poll_id', poll.id);

      const vote_counts = poll.options.map((_, i) =>
        (votes || []).filter((v) => v.option_index === i).length
      );
      const user_vote = currentUser
        ? (votes || []).find((v) => v.user_id === currentUser.id)?.option_index ?? null
        : null;
      return { ...poll, vote_counts, user_vote };
    }));

    setPolls(enriched);
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const cleanOptions = options.filter((o) => o.trim());
    if (cleanOptions.length < 2) { toast.error('Add at least 2 options'); return; }
    setSaving(true);
    const { error } = await supabase.from('polls').insert({
      question,
      description,
      options: cleanOptions,
      expires_at: expiresAt || null,
      created_by: user?.id,
      is_active: true,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Poll created!');
    setShowCreate(false);
    setQuestion(''); setDescription(''); setOptions(['', '']); setExpiresAt('');
    fetchPolls();
  }

  const addOption = () => setOptions((prev) => [...prev, '']);
  const removeOption = (i) => setOptions((prev) => prev.filter((_, idx) => idx !== i));
  const updateOption = (i, val) => setOptions((prev) => prev.map((o, idx) => idx === i ? val : o));

  return (
    <div className="container section">
      <PageHeader
        icon={<BsBarChartFill />}
        title="Family Polls"
        subtitle="Decide together — create polls and vote on family matters"
        badge="Polls & Voting"
        action={
          user && (
            <button className="btn-primary-custom" onClick={() => setShowCreate(true)}>
              <BsPlus style={{ fontSize: '1.2rem' }} /> Create Poll
            </button>
          )
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : polls.length === 0 ? (
        <EmptyState
          icon={<BsBarChartFill />}
          title="No polls yet"
          description="Create the first family poll and start voting together"
          action={
            user && (
              <button className="btn-primary-custom" onClick={() => setShowCreate(true)}>
                <BsPlus /> Create Poll
              </button>
            )
          }
        />
      ) : (
        <div className="polls-grid">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              currentUserId={user?.id}
              onUpdate={fetchPolls}
            />
          ))}
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Create Poll</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}><BsXLg /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label-custom">Question</label>
                <input className="input-custom" required placeholder="What should we decide?" value={question} onChange={(e) => setQuestion(e.target.value)} />
              </div>
              <div>
                <label className="label-custom">Description (optional)</label>
                <textarea className="input-custom" rows={2} placeholder="More details..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label className="label-custom">Options</label>
                <div className="poll-options-builder">
                  {options.map((opt, i) => (
                    <div key={i} className="poll-option-input-row">
                      <input
                        className="input-custom"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                      />
                      {options.length > 2 && (
                        <button type="button" className="poll-option-remove-btn" onClick={() => removeOption(i)}>
                          <BsDashLg />
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 8 && (
                    <button type="button" className="add-option-btn" onClick={addOption}>
                      <BsPlus /> Add option
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="label-custom">Expires at (optional)</label>
                <input className="input-custom" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
              <button className="btn-primary-custom" style={{ justifyContent: 'center' }} disabled={saving}>
                {saving ? 'Creating…' : 'Create Poll'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
