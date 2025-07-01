import TermsAndConditions from '@/components/pages/Extras/TermsAndConditions';

export const metadata = {
  title: 'Terms of Service - PDF Techno',
  description: 'Read the terms of service for using PDF Techno online PDF tools and services.',
  openGraph: {
    title: 'Terms of Service - PDF Techno',
    description: 'Terms and conditions for using PDF Techno services.',
    url: 'https://www.pdftechno.com/terms',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/terms',
    languages: {
      'en-US': '/terms',
      'es-ES': '/es/terms',
      'fr-FR': '/fr/terms',
    },
  },
};

export default function TermsPage() {
  return <TermsAndConditions />;
}