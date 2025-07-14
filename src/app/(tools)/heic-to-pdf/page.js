import HeictoPdf from '@/components/pages/HeictoPdf';

export const metadata = {
  title: 'HEIC to PDF Converter Online – Free, Fast & Easy Tool',
  description: 'Convert HEIC images to PDF online for free. Quick, high-quality conversion with no downloads or registration. Secure & easy to use—try it now',
  keywords: 'HEIC to PDF converter online, HEIC to PDF, convert HEIC to PDF, iPhone photo to PDF, Apple image to PDF, HEIF to PDF',
  openGraph: {
    title: 'Convert HEIC to PDF Online Free - HEIC to PDF | PDF Techno',
    description: 'Convert HEIC images to PDF online. Support for iPhone and Apple device photos.',
    url: 'https://www.pdftechno.com/heic-to-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert HEIC to PDF Online Free - PDF Techno',
    description: 'Convert HEIC images to PDF online. Support for iPhone and Apple device photos.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/heic-to-pdf',
    languages: {
      'en-US': '/heic-to-pdf',
      'es-ES': '/es/heic-to-pdf',
      'fr-FR': '/fr/heic-to-pdf',
    },
  },
};

export default function HeicToPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "HEIC to PDF Converter - PDF Techno",
            "description": "Convert HEIC images to PDF online. Support for iPhone and Apple device photos.",
            "url": "https://www.pdftechno.com/heic-to-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Convert HEIC to PDF",
              "Support iPhone photos",
              "Preserve image quality",
              "Batch conversion",
              "Multiple HEIC to single PDF",
              "Secure processing"
            ]
          })
        }}
      />
      <HeictoPdf />
    </>
  );
}