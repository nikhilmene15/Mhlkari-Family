'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { translations, defaultLocale, locales } from '@/lib/translations';

const LanguageContext = createContext({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('mhalkari-locale') || defaultLocale;
    setLocale(stored);
  }, []);

  const handleSetLocale = (newLocale) => {
    setLocale(newLocale);
    localStorage.setItem('mhalkari-locale', newLocale);
  };

  const t = (key) => {
    return translations[locale]?.[key] || translations[en]?.[key] || key;
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
