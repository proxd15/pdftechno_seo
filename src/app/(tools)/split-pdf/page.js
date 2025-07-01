import SplitPdf from '@/components/pages/SplitPdf';

export const metadata = {
  title: 'Split PDF Files Online Free - Extract Pages | PDF Techno',
  description: 'Split PDF files online by extracting pages. Free, fast, and secure PDF splitting tool. No registration required.',
  keywords: 'split PDF, extract PDF pages, PDF splitter, divide PDF, separate PDF pages, PDF cutter, split PDF online',
  openGraph: {
    title: 'Split PDF Files Online Free - Extract Pages | PDF Techno',
    description: 'Split PDF files online by extracting pages. Free, fast, and secure PDF splitting tool. No registration required.',
    url: 'https://www.pdftechno.com/split-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Split PDF Files Online Free - PDF Techno',
    description: 'Split PDF files online by extracting pages. Free, fast, and secure PDF splitting tool.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/split-pdf',
    languages: {
      'en-US': '/split-pdf',
      'es-ES': '/es/split-pdf',
      'fr-FR': '/fr/split-pdf',
    },
  },
};

export default function SplitPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Split PDF - PDF Techno",
            "description": "Split PDF files online by extracting pages. Free, fast, and secure PDF splitting tool.",
            "url": "https://www.pdftechno.com/split-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Split PDF files",
              "Extract specific pages",
              "Split by page range",
              "Secure processing",
              "Batch PDF split"
            ]
          })
        }}
      />
      <SplitPdf />
    </>
  );
}