'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import { BsXLg, BsChevronLeft, BsChevronRight, BsDownload } from 'react-icons/bs';

export default function PhotoModal({ photos, currentIndex, onClose, onNext, onPrev }) {
  const photo = photos[currentIndex];

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'ArrowLeft') onPrev();
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!photo) return null;

  return (
    <div className="photo-modal" onClick={onClose}>
      {/* Close */}
      <button className="photo-modal-close" onClick={onClose}>
        <BsXLg />
      </button>

      {/* Prev */}
      {currentIndex > 0 && (
        <button
          className="photo-modal-nav photo-modal-prev"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
        >
          <BsChevronLeft />
        </button>
      )}

      {/* Image */}
      <div
        style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.url}
          alt={photo.caption || 'Family photo'}
          className="photo-modal-img"
        />
        {/* Download */}
        <a
          href={photo.url}
          download
          style={{
            position: 'absolute', top: 12, left: 12,
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.9rem', textDecoration: 'none',
          }}
          title="Download"
        >
          <BsDownload />
        </a>
      </div>

      {/* Next */}
      {currentIndex < photos.length - 1 && (
        <button
          className="photo-modal-nav photo-modal-next"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
        >
          <BsChevronRight />
        </button>
      )}

      {/* Info */}
      <div className="photo-modal-info" onClick={(e) => e.stopPropagation()}>
        {photo.caption && (
          <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: 4, fontWeight: 500 }}>
            {photo.caption}
          </p>
        )}
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
          {currentIndex + 1} / {photos.length}
        </span>
      </div>
    </div>
  );
}
