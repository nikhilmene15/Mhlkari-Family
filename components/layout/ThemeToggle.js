'use client';

import { useTheme } from '@/context/ThemeContext';
import { BsSun, BsMoon } from 'react-icons/bs';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-btn ${className}`}
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <BsSun /> : <BsMoon />}
    </button>
  );
}
