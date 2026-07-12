'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function OptimizedImage({ src, alt, ...props }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="image-container">
      <Image
        src={src}
        alt={alt}
        {...props}
        onLoadingComplete={() => setIsLoading(false)}
        style={{
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />
      {isLoading && (
        <div className="image-placeholder">
          <div className="loading-spinner-small"></div>
        </div>
      )}
    </div>
  );
}
