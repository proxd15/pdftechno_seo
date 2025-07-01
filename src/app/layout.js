import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import './global.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClientLayout from '@/components/layout/ClientLayout';
import { I18nProvider } from '@/i18n';
import { AuthProvider } from '@/context/AuthContext';
import { PDFProvider } from '@/context/PDFProvider';
import { defaultLocale } from '@/i18n/config';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'PDF Techno - PDF Processing Tools',
  description: 'Process, convert, and manage your PDF documents with ease',
};

export default async function RootLayout({ children }) {
  // Get locale from cookies for default language routes
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || defaultLocale;

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <PDFProvider>
          <I18nProvider initialLocale={locale}>
            <AuthProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
              <ToastContainer position="bottom-right" />
            </AuthProvider>
          </I18nProvider>
        </PDFProvider>
      </body>
    </html>
  );
}