// src/app/[locale]/layout.js
'use client';

import { use } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClientLayout from '@/components/layout/ClientLayout';
import { I18nProvider } from '@/i18n';
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

export default function LocaleLayout({ children, params }) {
  // Use the useParams hook or unwrap params with React.use()
  const unwrappedParams = use(params);
  const { locale } = unwrappedParams;

  return (
    <I18nProvider initialLocale={locale}>
      <AuthProvider>
        <ClientLayout>
          {children}
        </ClientLayout>
        <ToastContainer position="bottom-right" />
      </AuthProvider>
    </I18nProvider>
  );
}