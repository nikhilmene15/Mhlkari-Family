'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-toastify';
import { BsGeoAlt } from 'react-icons/bs';
import 'react-toastify/dist/ReactToastify.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BROTHERS = [
  { id: 1, name: 'Brother 1' },
  { id: 2, name: 'Brother 2' },
  { id: 3, name: 'Brother 3' },
  { id: 4, name: 'Brother 4' },
  { id: 5, name: 'Brother 5' },
  { id: 6, name: 'Brother 6' },
  { id: 7, name: 'Brother 7' },
  { id: 8, name: 'Brother 8' },
];

export default function PRTMeetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'

  const [form, setForm] = useState({
    date: '',
    location: '',
    discussion_points: '',
  });

  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    checkAuth();
    fetchMeetings();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchMeetings = async () => {
    const { data, error } = await supabase
      .from('prt_meetings')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to fetch meetings');
    } else {
      setMeetings(data || []);
    }
    setLoading(false);
  };

  const handleAddMeeting = async () => {
    if (!form.date || !form.location) {
      toast.error('Please fill in date and location');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('prt_meetings')
        .insert([{
          date: form.date,
          location: form.location,
          discussion_points: form.discussion_points,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      // Add attendance records
      const attendanceRecords = BROTHERS.map(brother => ({
        meeting_id: data.id,
        brother_id: brother.id,
        is_present: attendance[brother.id] || false,
      }));

      const { error: attendanceError } = await supabase
        .from('prt_attendance')
        .insert(attendanceRecords);

      if (attendanceError) throw attendanceError;

      toast.success('Meeting added successfully');
      setShowAdd(false);
      setForm({ date: '', location: '', discussion_points: '' });
      setAttendance({});
      fetchMeetings();
    } catch (error) {
      console.error('Error adding meeting:', error);
      toast.error('Failed to add meeting');
    }
    setSaving(false);
  };

  const fetchAttendance = async (meetingId) => {
    const { data, error } = await supabase
      .from('prt_attendance')
      .select('*')
      .eq('meeting_id', meetingId);

    if (error) {
      console.error('Error fetching attendance:', error);
    } else {
      const attendanceMap = {};
      data.forEach(record => {
        attendanceMap[record.brother_id] = record.is_present;
      });
      return attendanceMap;
    }
  };

  const handleViewMeeting = async (meeting) => {
    setSelectedMeeting(meeting);
    const attendanceMap = await fetchAttendance(meeting.id);
    setAttendance(attendanceMap);
    setViewMode('detail');
  };

  const handleBack = () => {
    setSelectedMeeting(null);
    setAttendance({});
    setViewMode('list');
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            PRT Meetings
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            Track meeting notes, attendance, and discussion points
          </p>
        </div>
        <button
          className="btn-primary-custom"
          onClick={() => setShowAdd(true)}
          style={{ padding: '12px 24px', fontSize: '0.95rem' }}
        >
          + New Meeting
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="meetings-list">
          {meetings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-secondary)' }}>
              No meetings recorded yet. Click "New Meeting" to add one.
            </div>
          ) : (
            meetings.map(meeting => (
              <div
                key={meeting.id}
                onClick={() => handleViewMeeting(meeting)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-lime)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      <BsGeoAlt /> {meeting.location}
                    </div>
                    {meeting.discussion_points && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        {meeting.discussion_points.substring(0, 200)}...
                      </div>
                    )}
                  </div>
                  <div style={{ color: 'var(--accent-lime)', fontSize: '0.9rem' }}>
                    → View Details
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="meeting-detail">
          <button
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ← Back to Meetings
          </button>

          {selectedMeeting && (
            <div>
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', marginBottom: '12px' }}>
                  {new Date(selectedMeeting.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                  📍 {selectedMeeting.location}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
                  Discussion Points
                </h3>
                <div
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '20px',
                    color: 'var(--text-primary)',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedMeeting.discussion_points || 'No discussion points recorded.'}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
                  Attendance
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {BROTHERS.map(brother => (
                    <div
                      key={brother.id}
                      style={{
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: attendance[brother.id] ? '#C6F135' : '#FF4D4D',
                        }}
                      />
                      <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {brother.name}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginLeft: 'auto' }}>
                        {attendance[brother.id] ? 'Present' : 'Absent'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Meeting Modal */}
      {showAdd && (
        <div
          className="modal-overlay"
          onClick={() => setShowAdd(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div className="modal-header" style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                New Meeting
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Location
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Home, Community Hall, etc."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Discussion Points
                </label>
                <textarea
                  value={form.discussion_points}
                  onChange={(e) => setForm({ ...form, discussion_points: e.target.value })}
                  placeholder="Enter discussion points and meeting notes..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    background: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Attendance
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {BROTHERS.map(brother => (
                    <label
                      key={brother.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '12px',
                        background: attendance[brother.id] ? 'rgba(198, 241, 53, 0.1)' : 'var(--bg-input)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={attendance[brother.id] || false}
                        onChange={(e) => setAttendance({
                          ...attendance,
                          [brother.id]: e.target.checked,
                        })}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span style={{ color: 'var(--text-primary)' }}>{brother.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  onClick={() => setShowAdd(false)}
                  className="btn-secondary-custom"
                  style={{ padding: '12px 24px', fontSize: '0.95rem' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMeeting}
                  disabled={saving}
                  className="btn-primary-custom"
                  style={{ padding: '12px 24px', fontSize: '0.95rem', opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save Meeting'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
