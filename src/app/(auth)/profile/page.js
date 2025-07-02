import Profile from '@/components/pages/Auth/Profile';

const metadata = {
  title: 'My Profile - PDF Techno',
  description: 'Manage your PDF Techno account profile, settings, and preferences.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'My Profile - PDF Techno',
    description: 'Manage your PDF Techno account.',
    url: 'https://www.pdftechno.com/profile',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/profile',
    languages: {
      'en-US': '/profile',
      'es-ES': '/es/profile',
      'fr-FR': '/fr/profile',
    },
  },
};

export default function ProfilePage() {
  return <Profile />;
}