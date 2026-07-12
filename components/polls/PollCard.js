'use client';

import { useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import { BsCheckCircleFill, BsPeopleFill, BsClockFill } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';

export default function PollCard({ poll, currentUserId, onUpdate }) {
  const supabase = getSupabaseClient();
  const [voting, setVoting] = useState(false);

  const totalVotes = poll.vote_counts?.reduce((a, b) => a + b, 0) || 0;
  const userVote = poll.user_vote ?? null;
  const hasVoted = userVote !== null;
  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();
  const canVote = !hasVoted && !isExpired && poll.is_active;

  async function handleVote(optionIndex) {
    if (!canVote || voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_index: optionIndex }),
      });
      if (!res.ok) throw new Error('Vote failed');
      toast.success('Vote cast!');
      onUpdate?.();
    } catch {
      toast.error('Could not cast vote');
    } finally {
      setVoting(false);
    }
  }

  const getPercent = (idx) => {
    const count = poll.vote_counts?.[idx] || 0;
    return totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
  };

  const winnerIdx = poll.vote_counts
    ? poll.vote_counts.indexOf(Math.max(...poll.vote_counts))
    : -1;

  return (
    <div className={`poll-card${isExpired ? ' poll-expired' : ''}`}>
      <div className="poll-card-header">
        <h4 className="poll-question">{poll.question}</h4>
        {hasVoted && (
          <span className="poll-voted-badge">
            <BsCheckCircleFill /> Voted
          </span>
        )}
      </div>

      <div className="poll-options">
        {poll.options.map((option, idx) => {
          const pct = getPercent(idx);
          const isSelected = userVote === idx;
          const isWinner = (hasVoted || isExpired) && winnerIdx === idx;
          return (
            <div
              key={idx}
              className="poll-option"
              onClick={() => canVote && handleVote(idx)}
              style={{ cursor: canVote ? 'pointer' : 'default' }}
            >
              <div className="poll-option-bar-wrap">
                <div className={`poll-option-bar-bg${isSelected ? ' selected' : ''}`}>
                  {(hasVoted || isExpired) && (
                    <div
                      className={`poll-option-fill${isWinner ? ' winner' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  <span className="poll-option-text">
                    {isSelected && <BsCheckCircleFill style={{ marginRight: 6, color: 'var(--accent-purple)', fontSize: '0.8rem' }} />}
                    {option}
                  </span>
                  {(hasVoted || isExpired) && (
                    <span className="poll-option-pct">{pct}%</span>
                  )}
                </div>
              </div>
              {(hasVoted || isExpired) && (
                <span className="poll-vote-count">
                  {poll.vote_counts?.[idx] || 0}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="poll-meta">
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <BsPeopleFill /> {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </span>
        {poll.expires_at && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <BsClockFill />
            {isExpired ? 'Ended' : `Ends ${formatDistanceToNow(new Date(poll.expires_at), { addSuffix: true })}`}
          </span>
        )}
        {!poll.is_active && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>• Closed</span>
        )}
      </div>

      {isExpired && (
        <div className="poll-expired-overlay">Poll has ended</div>
      )}
    </div>
  );
}
