// app/merge-pdf/page.js
import MergePdf from '@/components/pages/MergePdf';

export const metadata = {
  title: 'Merge PDF Files Online Free - Combine PDFs | PDF Techno',
  description: 'Merge multiple PDF files into a single document online for free. Fast, secure, and easy PDF merging tool. No registration required.',
  keywords: 'merge PDF, combine PDF, PDF merger, merge PDF files online, combine PDFs, free PDF merger, PDF joiner, batch PDF merge, online PDF merger, secure PDF merge',
  openGraph: {
    title: 'Merge PDF Files Online Free - Combine PDFs | PDF Techno',
    description: 'Merge multiple PDF files into a single document online for free. Fast, secure, and easy PDF merging tool. No registration required.',
    url: 'https://www.pdftechno.com/merge-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Merge PDF Files Online Free - PDF Techno',
    description: 'Merge multiple PDF files into a single document online for free. Fast, secure, and easy PDF merging tool.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/merge-pdf',
    languages: {
      'en-US': '/merge-pdf',
      'es-ES': '/es/merge-pdf',
      'fr-FR': '/fr/merge-pdf',
    },
  },
};

export default function MergePdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Merge PDF - PDF Techno",
            "description": "Merge multiple PDF files into a single document online for free. Fast, secure, and easy PDF merging tool.",
            "url": "https://www.pdftechno.com/merge-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Merge PDF files",
              "Combine multiple PDFs",
              "No file size limits",
              "Secure processing",
              "Batch PDF merge"
            ]
          })
        }}
      />
      <MergePdf />
    </>
  );
}