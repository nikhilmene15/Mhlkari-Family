'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'react-toastify';
import PhotoModal from '@/components/gallery/PhotoModal';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import '@/styles/gallery.css';
import {
  BsImages, BsPlus, BsTrash, BsXLg,
  BsGrid, BsCollection, BsSearch
} from 'react-icons/bs';

export default function GalleryPage() {
  const supabase = getSupabaseClient();
  const [photos, setPhotos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalIndex, setModalIndex] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchPhotos();
    fetchAlbums();
  }, []);

  async function fetchPhotos() {
    setLoading(true);
    try {
      // First try without profile join
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Photos fetch error:', error);
        setPhotos([]);
      } else {
        console.log('Fetched photos:', data);
        setPhotos(data || []);
      }
    } catch (err) {
      console.error('Photos fetch exception:', err);
      setPhotos([]);
    }
    setLoading(false);
  }

  async function fetchAlbums() {
    const { data } = await supabase.from('albums').select('*').order('created_at', { ascending: false });
    setAlbums(data || []);
  }

  const onDrop = useCallback((acceptedFiles) => {
    setPendingFiles(acceptedFiles.map((f) => Object.assign(f, { preview: URL.createObjectURL(f) })));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  });

  async function handleUpload() {
    if (!pendingFiles.length) return;
    if (!user) {
      toast.error('Please login to upload photos');
      return;
    }
    
    setUploading(true);
    let uploadedCount = 0;
    
    try {
      for (const file of pendingFiles) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not a valid image file.`);
          continue;
        }
        
        const ext = file.name.split('.').pop().toLowerCase();
        const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        
        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('family-media')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          if (uploadError.message?.includes('bucket')) {
            throw new Error('Storage bucket not configured. Please run the storage setup script.');
          }
          throw uploadError;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('family-media')
          .getPublicUrl(path);
        
        // Insert into database
        const { error: dbError } = await supabase.from('photos').insert({
          url: publicUrl,
          caption: caption || '',
          album_id: selectedAlbum || null,
          uploaded_by: user.id,
        });
        
        if (dbError) {
          console.error('Database insert error:', dbError);
          throw dbError;
        }
        
        uploadedCount++;
      }
      
      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} photo(s) uploaded successfully!`);
        setShowUpload(false);
        setPendingFiles([]);
        setCaption('');
        setSelectedAlbum('');
        fetchPhotos();
      } else {
        toast.error('No photos were uploaded. Please check file requirements.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photoId, photoUrl) {
    if (!confirm('Delete this photo?')) return;
    await supabase.from('photos').delete().eq('id', photoId);
    toast.success('Photo deleted');
    fetchPhotos();
  }

  const filtered = photos.filter((p) => {
    const matchFilter = filter === 'all' || p.album_id === filter;
    const matchSearch = !search || (p.caption || '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="container section">
      <PageHeader
        icon={<BsImages />}
        title="Photo Gallery"
        subtitle="Cherished family memories, beautifully organised"
        badge="Gallery"
        action={
          user && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href="/albums" className="btn-secondary-custom" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BsCollection /> Manage Albums
              </Link>
              <button className="btn-primary-custom" onClick={() => setShowUpload(true)}>
                <BsPlus style={{ fontSize: '1.2rem' }} /> Upload Photos
              </button>
            </div>
          )
        }
      />

      {/* Toolbar */}
      <div className="gallery-toolbar">
        <div className="gallery-filters">
          <button className={`filter-btn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
            All Photos
          </button>
          {albums.map((a) => (
            <button key={a.id} className={`filter-btn${filter === a.id ? ' active' : ''}`} onClick={() => setFilter(a.id)}>
              {a.name}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <BsSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.85rem' }} />
            <input
              className="input-custom"
              style={{ paddingLeft: 32, width: 200, fontSize: '0.85rem' }}
              placeholder="Search photos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🖼️"
          title="No photos yet"
          description="Upload your first family photo to get started"
          action={
            user && (
              <button className="btn-primary-custom" onClick={() => setShowUpload(true)}>
                <BsPlus /> Upload Photos
              </button>
            )
          }
        />
      ) : (
        <div className="gallery-grid">
          {filtered.map((photo, idx) => (
            <div key={photo.id} className="gallery-grid-item" onClick={() => setModalIndex(idx)}>
              <img src={photo.url} alt={photo.caption || 'Family photo'} loading="lazy" />
              <div className="gallery-item-overlay">
                <div className="gallery-item-caption">{photo.caption || 'Family photo'}</div>
                <div className="gallery-item-date">
                  Family member
                </div>
              </div>
              {user && (
                <div className="gallery-item-actions">
                  <button
                    className="gallery-action-btn"
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo.id, photo.url); }}
                    title="Delete"
                  >
                    <BsTrash />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo Modal */}
      {modalIndex !== null && (
        <PhotoModal
          photos={filtered}
          currentIndex={modalIndex}
          onClose={() => setModalIndex(null)}
          onNext={() => setModalIndex((i) => Math.min(i + 1, filtered.length - 1))}
          onPrev={() => setModalIndex((i) => Math.max(i - 1, 0))}
        />
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUpload(false)}>
          <div className="modal-box" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Upload Photos</h3>
              <button className="modal-close" onClick={() => setShowUpload(false)} disabled={uploading}>
                <BsXLg />
              </button>
            </div>

            <div {...getRootProps()} className={`upload-zone${isDragActive ? ' dragging' : ''}`}>
              <input {...getInputProps()} />
              <div className="upload-icon">📷</div>
              <p className="upload-text">
                {isDragActive ? 'Drop photos here…' : 'Drag & drop photos, or click to select'}
              </p>
              <p className="upload-hint">JPG, PNG, WEBP up to 10MB each</p>
            </div>

            {pendingFiles.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {pendingFiles.map((f, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={f.preview} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                    <button
                      onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-red)', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label-custom">Caption (optional)</label>
                <input className="input-custom" placeholder="Add a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} />
              </div>
              <div>
                <label className="label-custom">Album (optional)</label>
                <select className="input-custom" value={selectedAlbum} onChange={(e) => setSelectedAlbum(e.target.value)}>
                  <option value="">No album</option>
                  {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <button
                className="btn-primary-custom"
                style={{ justifyContent: 'center' }}
                onClick={handleUpload}
                disabled={uploading || !pendingFiles.length}
              >
                {uploading ? 'Uploading…' : `Upload ${pendingFiles.length} Photo(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
