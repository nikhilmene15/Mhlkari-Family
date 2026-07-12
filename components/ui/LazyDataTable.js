'use client';

import { lazy, Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Lazy load DataTable component
const DataTable = lazy(() => import('react-data-table-component'));

export default function LazyDataTable(props) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DataTable {...props} />
    </Suspense>
  );
}
