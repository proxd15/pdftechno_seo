import Contact from '@/components/pages/Extras/Contact';

const metadata = {
  title: 'Contact Us - PDF Techno',
  description: 'Get in touch with PDF Techno support for any inquiries or issues.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Contact Us - PDF Techno',
    description: 'Get in touch with PDF Techno support for any inquiries or issues.',
    url: 'https://www.pdftechno.com/contact',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/contact',
    languages: {
      'en-US': '/contact',
      'es-ES': '/es/contact',
      'fr-FR': '/fr/contact',
    },
  },
};

export default function ContactPage() {
  return <Contact />;
}