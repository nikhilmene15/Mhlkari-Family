'use client';

import { lazy, Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

// Lazy load chart components
const ExpenseDoughnut = lazy(() => import('@/components/expenses/ExpenseChart').then(module => ({ default: module.ExpenseDoughnut })));
const ExpenseBarChart = lazy(() => import('@/components/expenses/ExpenseChart').then(module => ({ default: module.ExpenseBarChart })));

export function LazyExpenseDoughnut(props) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ExpenseDoughnut {...props} />
    </Suspense>
  );
}

export function LazyExpenseBarChart(props) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ExpenseBarChart {...props} />
    </Suspense>
  );
}
