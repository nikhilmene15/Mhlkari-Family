'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient, getSupabaseAdminClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { ExpenseBarChart } from '@/components/expenses/ExpenseChart';
import {
  BsShieldFill, BsPeopleFill, BsImages, BsBarChartFill,
  BsCurrencyRupee, BsBellFill, BsTrash, BsPersonFill,
  BsCheckCircleFill, BsXCircleFill, BsWhatsapp, BsGearFill
} from 'react-icons/bs';
import '@/styles/admin.css';

const getSidebarItems = (role) => {
  if (role === 'expense_manager') {
    return [
      { id: 'overview', label: 'Overview', icon: <BsShieldFill /> },
      { id: 'members', label: 'Members', icon: <BsPeopleFill /> },
    ];
  }
  
  return [
    { id: 'overview', label: 'Overview', icon: <BsShieldFill /> },
    { id: 'members', label: 'Members', icon: <BsPeopleFill /> },
    { id: 'gallery', label: 'Gallery', icon: <BsImages /> },
    { id: 'notifications', label: 'Notifications', icon: <BsBellFill /> },
    { id: 'analytics', label: 'Analytics', icon: <BsBarChartFill /> },
  ];
};

export default function AdminPage() {
  const supabase = getSupabaseClient();
  const adminSupabase = getSupabaseAdminClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [stats, setStats] = useState({ members: 0, photos: 0, polls: 0, expenses: 0 });
  const [members, setMembers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [expenseAssignments, setExpenseAssignments] = useState([]);
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTitle, setNotifTitle] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (authorized && activeTab === 'members') {
      fetchExpenseAssignments();
    }
  }, [authorized, activeTab]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'expense_manager')) {
      toast.error('Admin access required');
      router.push('/');
      return;
    }
    setUserRole(profile.role);
    setAuthorized(true);
    setLoading(false);
    fetchAllData();
  }

  async function fetchAllData() {
    let membersCount = 0, photosCount = 0, pollsCount = 0, expensesCount = 0;
    let profilesData = [], photosData = [], expensesData = [];
    let membersData = [];

    try {
      // Get all auth users via API route (server-side)
      console.log('Fetching auth users via API...');
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Response Error:', errorData);
        toast.error('Failed to fetch users. Server error occurred.');
        // Fallback to using profiles only
        const { data: fallbackProfiles } = await supabase.from('profiles').select('*');
        membersData = fallbackProfiles?.map(profile => ({
          id: profile.id,
          email: 'No email (admin access required)',
          full_name: profile.full_name || 'No name',
          role: profile.role || 'member',
          created_at: profile.created_at,
          last_sign_in: null
        })) || [];
        return; // Exit early
      }
      
      const { users: authUsers, error: authError } = await response.json();
      
      if (authError) {
        console.error('Auth users fetch error:', authError);
        toast.error('Failed to fetch users. Server error occurred.');
        // Fallback to using profiles only
        const { data: fallbackProfiles } = await supabase.from('profiles').select('*');
        membersData = fallbackProfiles?.map(profile => ({
          id: profile.id,
          email: 'No email (admin access required)',
          full_name: profile.full_name || 'No name',
          role: profile.role || 'member',
          created_at: profile.created_at,
          last_sign_in: null
        })) || [];
        return; // Exit early
      }
      
      console.log('Auth users fetched successfully:', authUsers?.length || 0);
      
      // Get other data in parallel
      const results = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('photos').select('*', { count: 'exact', head: true }),
        supabase.from('polls').select('*', { count: 'exact', head: true }),
        supabase.from('expenses').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('photos').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('expenses').select('amount, created_at').order('created_at'),
      ]);

      membersCount = results[0].count || 0;
      photosCount = results[1].count || 0;
      pollsCount = results[2].count || 0;
      expensesCount = results[3].count || 0;
      profilesData = results[4].data || [];
      photosData = results[5].data || [];
      expensesData = results[6].data || [];

      // Combine auth users with profiles
      membersData = authUsers?.map(user => {
        const profile = profilesData?.find(p => p.id === user.id);
        return {
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || 'No name',
          role: profile?.role || 'member',
          created_at: user.created_at,
          last_sign_in: user.last_sign_in_at
        };
      }) || [];
    } catch (err) {
      console.error('fetchAllData error:', err);
      toast.error('Error loading admin data');
    }

    setStats({ members: membersCount, photos: photosCount, polls: pollsCount, expenses: expensesCount });
    setMembers(membersData);
    setPhotos(photosData);

    // Group expenses by month
    const grouped = {};
    (expensesData || []).forEach((e) => {
      const month = new Date(e.created_at).toLocaleString('default', { month: 'short', year: '2-digit' });
      grouped[month] = (grouped[month] || 0) + parseFloat(e.amount || 0);
    });
    setMonthlyExpenses(Object.entries(grouped).slice(-6).map(([month, total]) => ({ month, total })));
  }

  async function fetchExpenseAssignments() {
    try {
      const response = await fetch('/api/admin/expense-assignments');
      if (response.ok) {
        const { assignments } = await response.json();
        setExpenseAssignments(assignments || []);
      }
    } catch (err) {
      console.error('Failed to fetch expense assignments:', err);
    }
  }

  async function fetchAvailableUsers() {
    try {
      // Get all users
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const { users } = await response.json();
        
        // Get current assignments
        const assignmentsResponse = await fetch('/api/admin/expense-assignments');
        const { assignments } = assignmentsResponse.ok ? await assignmentsResponse.json() : { assignments: [] };
        
        // Filter out users who are already assigned
        const assignedUserIds = assignments?.map(a => a.user_id) || [];
        const available = users.filter(user => !assignedUserIds.includes(user.id));
        
        setAvailableUsers(available);
      }
    } catch (err) {
      console.error('Failed to fetch available users:', err);
    }
  }

  async function handleAddExpenseAssignment(userId) {
    if (!userId) {
      toast.error('Invalid user ID');
      return;
    }

    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      const response = await fetch('/api/admin/expense-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId, 
          assignedBy: currentUser?.id 
        })
      });
      
      const result = await response.json();
      if (!response.ok || result.error) {
        if (result.error === 'User is already assigned to expense tracking') {
          toast.info('This user is already assigned to expense tracking.');
          return; // Don't show error toast for this case
        }
        throw new Error(result.error || 'Failed to add assignment');
      }
      
      toast.success('Member added to expense tracker successfully!');
      fetchExpenseAssignments();
      // Also refresh the main members data to update the UI
      fetchAllData();
    } catch (err) {
      console.error('Failed to add expense assignment:', err);
      toast.error('Failed to add member: ' + err.message);
    }
  }

  async function handleRemoveExpenseAssignment(userId) {
    if (!confirm('Are you sure you want to remove this member from expense tracking?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/expense-assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to remove assignment');
      }
      
      toast.success('Member removed from expense tracker successfully!');
      fetchExpenseAssignments();
      // Also refresh the main members data to update the UI
      fetchAllData();
      fetchAvailableUsers();
    } catch (err) {
      console.error('Failed to remove expense assignment:', err);
      toast.error('Failed to remove member: ' + err.message);
    }
  }

  async function handleRoleChange(userId, newRole) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) { toast.error(error.message); return; }
    toast.success('Role updated');
    setMembers((prev) => prev.map((m) => m.id === userId ? { ...m, role: newRole } : m));
  }

  async function handleDeleteMember(userId, userEmail) {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete user's profile
      await supabase.from('profiles').delete().eq('id', userId);
      
      // Delete user's photos
      await supabase.from('photos').delete().eq('uploaded_by', userId);
      
      // Delete user from auth via API
      const deleteResponse = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const deleteResult = await deleteResponse.json();
      if (!deleteResponse.ok || deleteResult.error) {
        throw new Error(deleteResult.error || 'Failed to delete user');
      }

      toast.success(`User "${userEmail}" deleted successfully`);
      fetchAllData();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user: ' + err.message);
    }
  }

  async function handleDeletePhoto(id) {
    if (!confirm('Delete this photo?')) return;
    await supabase.from('photos').delete().eq('id', id);
    toast.success('Photo deleted');
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSendNotification(e) {
    e.preventDefault();
    setSendingNotif(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: notifTitle, message: notifMessage, type: 'broadcast' }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Notification sent to all members!');
      setNotifTitle('');
      setNotifMessage('');
    } catch {
      toast.error('Could not send notification');
    } finally {
      setSendingNotif(false);
    }
  }

  if (loading) return <div className="container section"><LoadingSpinner text="Checking permissions…" /></div>;
  if (!authorized) return null;

  const OVERVIEW_STATS = [
    { icon: <BsPeopleFill />, value: stats.members, label: 'Members', bg: 'var(--gradient-primary)' },
    { icon: <BsImages />, value: stats.photos, label: 'Photos', bg: 'var(--gradient-green)' },
    { icon: <BsBarChartFill />, value: stats.polls, label: 'Polls', bg: 'var(--gradient-pink)' },
    { icon: <BsCurrencyRupee />, value: stats.expenses, label: 'Expenses', bg: 'var(--gradient-amber)' },
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28, padding: '0 12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: 'white' }}>
            <BsShieldFill />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              {userRole === 'expense_manager' ? 'Expense Manager' : 'Admin Panel'}
            </div>
            <div style={{ fontSize: '0.68rem', color: userRole === 'expense_manager' ? 'var(--accent-green)' : 'var(--accent-purple-light)' }}>
              {userRole === 'expense_manager' ? 'Expense access' : 'Full access'}
            </div>
          </div>
        </div>

        <p className="admin-sidebar-title">Navigation</p>
        {getSidebarItems(userRole).map((item) => (
          <button
            key={item.id}
            className={`admin-nav-item${activeTab === item.id ? ' active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </aside>

      {/* Content */}
      <div className="admin-content">

        {/* ===== OVERVIEW ===== */}
        {activeTab === 'overview' && (
          <>
            <h2 style={{ marginBottom: 8, fontWeight: 900 }}>Overview</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 32 }}>Portal statistics at a glance</p>
            <div className="admin-stats-grid">
              {OVERVIEW_STATS.map((s) => (
                <div key={s.label} className="admin-stat">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: 16, color: 'white' }}>{s.icon}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {monthlyExpenses.length > 0 && (
              <div className="chart-card" style={{ marginTop: 8 }}>
                <h4 className="chart-title">Monthly Expenses (last 6 months)</h4>
                <ExpenseBarChart monthly={monthlyExpenses} />
              </div>
            )}
          </>
        )}

        {/* ===== MEMBERS ===== */}
        {activeTab === 'members' && (
          <>
            <h2 style={{ marginBottom: 8, fontWeight: 900 }}>Members</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 32 }}>
              {members.length} registered member(s) • {expenseAssignments.length} assigned to expense tracking
            </p>
            <div className="card-custom" style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Expense Tracker Access</h5>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>
                      {expenseAssignments.length}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>|</div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                      {members.length - expenseAssignments.length}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not Assigned</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700, color: 'white', flexShrink: 0,
                          }}>
                            {(m.full_name || 'U')[0].toUpperCase()}
                          </div>
                          <span className="user-row-name">{m.full_name || 'Unnamed'}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-word', minWidth: '200px' }}>{m.email}</td>
                      <td>
                        <span className={`badge-custom ${
                          m.role === 'admin' ? 'badge-purple role-admin' : 
                          m.role === 'expense_manager' ? 'badge-green role-expense-manager' : 
                          'badge-cyan role-member'
                        }`}>
                          {m.role === 'expense_manager' ? 'Expense Manager' : (m.role || 'Member')}
                        </span>
                      </td>
                      <td>{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <select
                            value={m.role || 'member'}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            className="input-custom"
                            style={{ padding: '5px 10px', fontSize: '0.78rem', width: 'auto' }}
                          >
                            <option value="member">Member</option>
                            <option value="expense_manager">Expense Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                          {expenseAssignments.find(a => a.user_id === m.id) ? (
                            <button
                              onClick={() => handleRemoveExpenseAssignment(m.id)}
                              style={{
                                padding: '5px 10px',
                                background: 'var(--accent-orange)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Remove from expense tracker"
                            >
                              <BsXCircleFill /> Remove from Expense
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddExpenseAssignment(m.id)}
                              style={{
                                padding: '5px 10px',
                                background: 'var(--accent-green)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.78rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                              title="Add to expense tracker"
                            >
                              <BsCheckCircleFill /> Add to Expense
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMember(m.id, m.email)}
                            style={{
                              padding: '5px 10px',
                              background: 'var(--accent-red)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.78rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title="Delete member"
                          >
                            <BsTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ===== GALLERY MODERATION ===== */}
        {activeTab === 'gallery' && (
          <>
            <h2 style={{ marginBottom: 8, fontWeight: 900 }}>Gallery Moderation</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 32 }}>{photos.length} photos</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {photos.map((photo) => (
                <div key={photo.id} style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <img src={photo.url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                  <div style={{ padding: '8px 10px' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Family member
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 28, height: 28, borderRadius: 6,
                      background: 'rgba(255,77,77,0.85)', border: 'none',
                      color: 'white', cursor: 'pointer', fontSize: '0.75rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <BsTrash />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===== NOTIFICATIONS ===== */}
        {activeTab === 'notifications' && (
          <>
            <h2 style={{ marginBottom: 8, fontWeight: 900 }}>Send Notifications</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 32 }}>
              Broadcast a message to all family members
            </p>
            <div className="notify-card">
              <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="label-custom">Notification Title</label>
                  <input className="input-custom" required placeholder="e.g. Important Family Update" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} />
                </div>
                <div>
                  <label className="label-custom">Message</label>
                  <textarea
                    className="input-custom"
                    rows={4}
                    required
                    placeholder="Write your message to all family members..."
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn-primary-custom" type="submit" disabled={sendingNotif}>
                    <BsBellFill /> {sendingNotif ? 'Sending…' : 'Send to All Members'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-custom"
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(notifMessage)}`, '_blank')}
                    disabled={!notifMessage}
                  >
                    <BsWhatsapp /> WhatsApp
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* ===== ANALYTICS ===== */}
        {activeTab === 'analytics' && (
          <>
            <h2 style={{ marginBottom: 8, fontWeight: 900 }}>Analytics</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 32 }}>Portal usage and trends</p>
            <div className="analytics-row">
              <div className="chart-card">
                <h4 className="chart-title">Monthly Expenses</h4>
                {monthlyExpenses.length > 0 ? (
                  <ExpenseBarChart monthly={monthlyExpenses} />
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No expense data yet</p>
                )}
              </div>
              <div className="chart-card">
                <h4 className="chart-title">Quick Stats</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: 'Total Members', value: stats.members, icon: '👥' },
                    { label: 'Photos Uploaded', value: stats.photos, icon: '📷' },
                    { label: 'Polls Created', value: stats.polls, icon: '📊' },
                    { label: 'Expenses Tracked', value: stats.expenses, icon: '💰' },
                  ].map((s) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {s.icon} {s.label}
                      </span>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
