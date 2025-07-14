import CompressPdf from '@/components/pages/CompressPdf';

export const metadata = {
  title: 'Compress PDF File Online – Fast, Free & Easy PDF Reducer',
  description: 'Compress PDF files online for free. Reduce file size quickly without losing quality. Easy-to-use tool for fast, secure, and efficient PDF compression.',
  keywords: 'Compress PDF File Online, compress PDF, reduce PDF size, PDF compressor, shrink PDF, optimize PDF, PDF compression online',
  openGraph: {
    title: 'Compress PDF Files Online Free - Reduce PDF Size | PDF Techno',
    description: 'Compress PDF files online to reduce file size without losing quality. Free, fast, and secure PDF compression tool.',
    url: 'https://www.pdftechno.com/compress-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compress PDF Files Online Free - PDF Techno',
    description: 'Compress PDF files online to reduce file size without losing quality. Free, fast, and secure.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/compress-pdf',
    languages: {
      'en-US': '/compress-pdf',
      'es-ES': '/es/compress-pdf',
      'fr-FR': '/fr/compress-pdf',
    },
  },
};

export default function CompressPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Compress PDF - PDF Techno",
            "description": "Compress PDF files online to reduce file size without losing quality. Free, fast, and secure PDF compression tool.",
            "url": "https://www.pdftechno.com/compress-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Compress PDF files",
              "Reduce PDF file size",
              "Maintain PDF quality",
              "Batch PDF compression",
              "Secure processing"
            ]
          })
        }}
      />
      <CompressPdf />
    </>
  );
}