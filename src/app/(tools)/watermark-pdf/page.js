import WatermarkPdf from '@/components/pages/WatermarkPdf';

export const metadata = {
  title: 'Add Watermark to PDF Online Free - PDF Watermark | PDF Techno',
  description: 'Add text or image watermarks to PDF files online. Protect your documents with custom watermarks. Free and secure.',
  keywords: 'watermark PDF, add watermark, PDF watermark, text watermark, image watermark, protect PDF',
  openGraph: {
    title: 'Add Watermark to PDF Online Free - PDF Watermark | PDF Techno',
    description: 'Add text or image watermarks to PDF files online. Protect your documents.',
    url: 'https://www.pdftechno.com/watermark-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Add Watermark to PDF Online Free - PDF Techno',
    description: 'Add text or image watermarks to PDF files online. Free and secure.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/watermark-pdf',
    languages: {
      'en-US': '/watermark-pdf',
      'es-ES': '/es/watermark-pdf',
      'fr-FR': '/fr/watermark-pdf',
    },
  },
};

export default function WatermarkPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Watermark PDF - PDF Techno",
            "description": "Add text or image watermarks to PDF files online. Protect your documents.",
            "url": "https://www.pdftechno.com/watermark-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Text watermarks",
              "Image watermarks",
              "Custom positioning",
              "Transparency control",
              "Batch watermarking",
              "Secure processing"
            ]
          })
        }}
      />
      <WatermarkPdf />
    </>
  );
}