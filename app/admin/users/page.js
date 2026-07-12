'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import { BsPeopleFill, BsShieldFill, BsPersonFill, BsGearFill, BsTrash } from 'react-icons/bs';

export default function AdminUsersPage() {
  const supabase = getSupabaseClient();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      // Get all auth users
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Combine data
      const combinedUsers = authUsers.users.map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          full_name: profile?.full_name || 'No name',
          role: profile?.role || 'member',
          last_sign_in: user.last_sign_in_at
        };
      });

      setUsers(combinedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId, newRole) {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          role: newRole,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Failed to update role');
    } finally {
      setUpdating(false);
    }
  }

  async function deleteUser(userId, userEmail) {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    setUpdating(true);
    try {
      // Delete user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // Delete user's photos
      const { error: photosError } = await supabase
        .from('photos')
        .delete()
        .eq('uploaded_by', userId);

      if (photosError) {
        console.error('Error deleting photos:', photosError);
      }

      // Delete user from auth (requires admin privileges)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Error deleting auth user:', authError);
        throw authError;
      }

      toast.success(`User "${userEmail}" deleted successfully`);
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete user: ' + err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="container section">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <BsPeopleFill style={{ fontSize: '2rem', color: 'var(--primary)' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>User Management</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Manage user roles and permissions</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading users...</div>
        </div>
      ) : (
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--accent)' }}>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'white' }}>User</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'white', minWidth: '250px' }}>Email</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'white' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'white' }}>Last Sign In</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'white' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} style={{ 
                  borderBottom: index < users.length - 1 ? '1px solid var(--border)' : 'none',
                  background: index % 2 === 0 ? 'transparent' : 'var(--hover-bg)'
                }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}>
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600' }}>{user.full_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', minWidth: '250px' }}>
                    <div style={{ wordBreak: 'break-word' }}>{user.email}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      background: user.role === 'admin' ? 'var(--accent-green)' : 'var(--accent-blue)',
                      color: 'white'
                    }}>
                      {user.role === 'admin' ? <BsShieldFill /> : <BsPersonFill />} {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {user.last_sign_in ? 
                      new Date(user.last_sign_in).toLocaleDateString() : 
                      <span style={{ color: 'var(--text-muted)' }}>Never</span>
                    }
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        disabled={updating}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'var(--input-bg)',
                          color: 'var(--text)',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => deleteUser(user.id, user.email)}
                        disabled={updating}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: '1px solid var(--accent-red)',
                          background: 'var(--accent-red)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Delete user"
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
      )}

      <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--accent)', borderRadius: '12px', color: 'white' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BsGearFill /> Quick Actions
        </h3>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Use the dropdown to change user roles. Admin users have full access to all features. The Delete button will permanently remove the user and all their data (photos, profile, etc.).
        </p>
      </div>
    </div>
  );
}
