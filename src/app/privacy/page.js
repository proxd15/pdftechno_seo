import PrivacyPolicy from '@/components/pages/Extras/PrivacyPolicy';

export const metadata = {
  title: 'Privacy Policy - PDF Techno',
  description: 'Read our privacy policy to understand how PDF Techno protects your data and ensures your privacy.',
  openGraph: {
    title: 'Privacy Policy - PDF Techno',
    description: 'Our commitment to protecting your privacy and data.',
    url: 'https://www.pdftechno.com/privacy',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/privacy',
    languages: {
      'en-US': '/privacy',
      'es-ES': '/es/privacy',
      'fr-FR': '/fr/privacy',
    },
  },
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}