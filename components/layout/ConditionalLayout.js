'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  
  // Hide navbar and footer on auth pages (login, register, etc.)
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register') || pathname?.startsWith('/reset-password');

  return (
    <>
      {!isAuthPage && <Navbar />}
      <main>{children}</main>
      {!isAuthPage && <Footer />}
    </>
  );
}
