import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@/styles/globals.css';
import '@/styles/modern-table.css';

import ConditionalLayout from '@/components/layout/ConditionalLayout';
import ClientProviders from '@/components/layout/ClientProviders';
import BootstrapClient from '@/components/layout/BootstrapClient';

export const metadata = {
  title: {
    default: 'Mhalkari Family Portal',
    template: '%s | Mhalkari Family',
  },
  description: 'The official Mhalkari family portal — gallery, birthdays, festivals, expenses, polls, family tree and more.',
  keywords: ['Mhalkari', 'family portal', 'family website'],
  openGraph: {
    title: 'Mhalkari Family Portal',
    description: 'Our stories, our bonds, our legacy.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      </head>
      <body>
        <ClientProviders>
          <BootstrapClient />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </ClientProviders>
      </body>
    </html>
  );
}
