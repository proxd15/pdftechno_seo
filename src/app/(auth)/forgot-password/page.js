import ForgotPassword from '@/components/pages/Auth/ForgotPassword';

const metadata = {
  title: 'Forgot Password - PDF Techno',
  description: 'Change your PDF Techno account password.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Forgot Password - PDF Techno',
    description: 'Change your PDF Techno account password.',
    url: 'https://www.pdftechno.com/forgot-password',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/forgot-password',
    languages: {
      'en-US': '/forgot-password',
      'es-ES': '/es/forgot-password',
      'fr-FR': '/fr/forgot-password',
    },
  },
};

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}