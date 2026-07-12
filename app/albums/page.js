'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import {
  BsCollection, BsPlus, BsTrash, BsXLg, BsImages, BsPencil
} from 'react-icons/bs';

export default function AlbumsPage() {
  const supabase = getSupabaseClient();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchAlbums();
  }, []);

  async function fetchAlbums() {
    setLoading(true);
    const { data, error } = await supabase
      .from('albums')
      .select('*, photos:photos(count)')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch albums');
      console.error(error);
    } else {
      setAlbums(data || []);
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Album name is required');
      return;
    }

    try {
      if (editingAlbum) {
        const { error } = await supabase
          .from('albums')
          .update({
            name: formData.name,
            description: formData.description
          })
          .eq('id', editingAlbum.id);
        
        if (error) throw error;
        toast.success('Album updated successfully!');
      } else {
        const { error } = await supabase
          .from('albums')
          .insert({
            name: formData.name,
            description: formData.description,
            created_by: user?.id
          });
        
        if (error) throw error;
        toast.success('Album created successfully!');
      }
      
      setShowCreateModal(false);
      setEditingAlbum(null);
      setFormData({ name: '', description: '' });
      fetchAlbums();
    } catch (err) {
      toast.error('Failed to save album: ' + err.message);
    }
  }

  async function handleDelete(albumId) {
    if (!confirm('Are you sure you want to delete this album? Photos in this album will not be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId);
      
      if (error) throw error;
      toast.success('Album deleted successfully!');
      fetchAlbums();
    } catch (err) {
      toast.error('Failed to delete album: ' + err.message);
    }
  }

  function openEditModal(album) {
    setEditingAlbum(album);
    setFormData({ name: album.name, description: album.description || '' });
    setShowCreateModal(true);
  }

  function openCreateModal() {
    setEditingAlbum(null);
    setFormData({ name: '', description: '' });
    setShowCreateModal(true);
  }

  return (
    <div className="container section">
      <PageHeader
        icon={<BsCollection />}
        title="Photo Albums"
        subtitle="Organize your family memories into beautiful albums"
        badge="Albums"
        action={
          user && (
            <button className="btn-primary-custom" onClick={openCreateModal}>
              <BsPlus style={{ fontSize: '1.2rem' }} /> Create Album
            </button>
          )
        }
      />

      {loading ? (
        <LoadingSpinner />
      ) : albums.length === 0 ? (
        <EmptyState
          icon="📁"
          title="No albums yet"
          description="Create your first album to organize family photos"
          action={
            user && (
              <button className="btn-primary-custom" onClick={openCreateModal}>
                <BsPlus /> Create Album
              </button>
            )
          }
        />
      ) : (
        <div className="albums-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          {albums.map((album) => (
            <div key={album.id} className="album-card" style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}>
              <div style={{
                height: '180px',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <BsImages style={{ fontSize: '3rem', color: 'white' }} />
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '20px',
                  padding: '4px 12px',
                  fontSize: '0.85rem',
                  fontWeight: '600'
                }}>
                  {album.photos?.[0]?.count || 0} photos
                </div>
              </div>
              
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: '600' }}>
                  {album.name}
                </h3>
                {album.description && (
                  <p style={{ 
                    margin: '0 0 1rem 0', 
                    color: 'var(--text-muted)', 
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}>
                    {album.description}
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {user && (
                    <>
                      <button
                        className="btn-secondary-custom"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => openEditModal(album)}
                      >
                        <BsPencil /> Edit
                      </button>
                      <button
                        className="btn-danger-custom"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => handleDelete(album.id)}
                      >
                        <BsTrash /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>
                {editingAlbum ? 'Edit Album' : 'Create New Album'}
              </h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <BsXLg />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="label-custom">Album Name *</label>
                <input
                  className="input-custom"
                  placeholder="Enter album name..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label-custom">Description</label>
                <textarea
                  className="input-custom"
                  placeholder="Add a description for this album..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary-custom"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary-custom">
                  {editingAlbum ? 'Update Album' : 'Create Album'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
