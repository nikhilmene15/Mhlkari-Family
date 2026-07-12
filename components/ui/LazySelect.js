'use client';

import { lazy, Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Lazy load Select component
const Select = lazy(() => import('react-select'));

export default function LazySelect(props) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Select {...props} />
    </Suspense>
  );
}
