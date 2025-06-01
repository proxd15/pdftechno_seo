'use client';

import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useI18n } from '@/i18n';

export default function ClientLayout({ children }) {
  const { locale } = useI18n();

  // Sync locale with HTML lang attribute
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <>
      <Navbar />
      <div className='h-12'></div>
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}