import ResetPassword from '@/components/pages/Auth/ResetPassword';

const metadata = {
  title: 'Reset Password - PDF Techno',
  description: 'Change your PDF Techno account password.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Reset Password - PDF Techno',
    description: 'Change your PDF Techno account password.',
    url: 'https://www.pdftechno.com/reset-password',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/reset-password',
    languages: {
      'en-US': '/reset-password',
      'es-ES': '/es/reset-password',
      'fr-FR': '/fr/reset-password',
    },
  },
};

export default function ResetPasswordPage() {
  return <ResetPassword />;
}