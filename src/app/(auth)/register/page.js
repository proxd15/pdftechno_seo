import Register from '@/components/pages/Auth/Register';

export const metadata = {
  title: 'Sign Up - PDF Techno',
  description: 'Create a free PDF Techno account to save your files and access premium features.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Sign Up - PDF Techno',
    description: 'Create a free PDF Techno account.',
    url: 'https://www.pdftechno.com/register',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/register',
    languages: {
      'en-US': '/register',
      'es-ES': '/es/register',
      'fr-FR': '/fr/register',
    },
  },
};

export default function RegisterPage() {
  return <Register />;
}