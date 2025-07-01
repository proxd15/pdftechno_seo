import Login from '@/components/pages/Auth/Login';

export const metadata = {
  title: 'Login - PDF Techno',
  description: 'Login to your PDF Techno account to access your saved files and premium features.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Login - PDF Techno',
    description: 'Login to your PDF Techno account.',
    url: 'https://www.pdftechno.com/login',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/login',
    languages: {
      'en-US': '/login',
      'es-ES': '/es/login',
      'fr-FR': '/fr/login',
    },
  },
};

export default function LoginPage() {
  return <Login />;
}