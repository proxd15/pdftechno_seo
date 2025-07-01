import About from '@/components/pages/Extras/About';

export const metadata = {
  title: 'About Us - PDF Techno',
  description: 'Learn about PDF Techno, our mission to provide free, secure, and easy-to-use PDF tools for everyone.',
  keywords: 'about PDF Techno, PDF tools company, online PDF converter, PDF software',
  openGraph: {
    title: 'About Us - PDF Techno',
    description: 'Learn about PDF Techno and our mission to provide free PDF tools.',
    url: 'https://www.pdftechno.com/about',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us - PDF Techno',
    description: 'Learn about PDF Techno and our mission.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/about',
    languages: {
      'en-US': '/about',
      'es-ES': '/es/about',
      'fr-FR': '/fr/about',
    },
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "PDF Techno",
            "url": "https://www.pdftechno.com",
            "description": "Free online PDF tools for everyone",
            "foundingDate": "2023",
            "sameAs": [
              "https://twitter.com/pdftechno",
              "https://www.facebook.com/pdftechno"
            ]
          })
        }}
      />
      <About />
    </>
  );
}