import RotatePdf from '@/components/pages/RotatePdf';

export const metadata = {
  title: 'Rotate PDF Pages Online Free - PDF Techno',
  description: 'Rotate PDF pages online. Rotate single or multiple pages in any direction. Free, fast, and secure PDF rotation tool.',
  keywords: 'rotate PDF, PDF rotation, turn PDF pages, rotate PDF online, PDF page rotation',
  openGraph: {
    title: 'Rotate PDF Pages Online Free - PDF Techno',
    description: 'Rotate PDF pages online. Rotate single or multiple pages in any direction. Free, fast, and secure.',
    url: 'https://www.pdftechno.com/rotate-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rotate PDF Pages Online Free - PDF Techno',
    description: 'Rotate PDF pages online. Rotate single or multiple pages in any direction.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/rotate-pdf',
    languages: {
      'en-US': '/rotate-pdf',
      'es-ES': '/es/rotate-pdf',
      'fr-FR': '/fr/rotate-pdf',
    },
  },
};

export default function RotatePdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Rotate PDF - PDF Techno",
            "description": "Rotate PDF pages online. Rotate single or multiple pages in any direction.",
            "url": "https://www.pdftechno.com/rotate-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Rotate PDF pages",
              "Rotate single or multiple pages",
              "90, 180, 270 degree rotation",
              "Batch rotation",
              "Secure processing"
            ]
          })
        }}
      />
      <RotatePdf />
    </>
  );
}