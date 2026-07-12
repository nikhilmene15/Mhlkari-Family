'use client';

import { ThemeProvider } from '@/context/ThemeContext';
import { ToastContainer } from 'react-toastify';

export default function ClientProviders({ children }) {
  return (
    <ThemeProvider>
      {children}
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </ThemeProvider>
  );
}
