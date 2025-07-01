import OcrPdf from '@/components/pages/OcrPdf';

export const metadata = {
  title: 'OCR PDF Online Free - Extract Text from Scanned PDFs | PDF Techno',
  description: 'Convert scanned PDFs to searchable text using OCR technology. Extract text from images in PDF files. Free and accurate.',
  keywords: 'OCR PDF, PDF OCR, extract text from PDF, scanned PDF to text, searchable PDF, PDF text recognition',
  openGraph: {
    title: 'OCR PDF Online Free - Extract Text from Scanned PDFs | PDF Techno',
    description: 'Convert scanned PDFs to searchable text using OCR technology. Free and accurate.',
    url: 'https://www.pdftechno.com/ocr-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OCR PDF Online Free - PDF Techno',
    description: 'Convert scanned PDFs to searchable text using OCR technology.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/ocr-pdf',
    languages: {
      'en-US': '/ocr-pdf',
      'es-ES': '/es/ocr-pdf',
      'fr-FR': '/fr/ocr-pdf',
    },
  },
};

export default function OcrPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "OCR PDF - PDF Techno",
            "description": "Convert scanned PDFs to searchable text using OCR technology.",
            "url": "https://www.pdftechno.com/ocr-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "OCR text recognition",
              "Searchable PDFs",
              "Multiple languages",
              "High accuracy",
              "Batch OCR",
              "Preserve layout"
            ]
          })
        }}
      />
      <OcrPdf />
    </>
  );
}