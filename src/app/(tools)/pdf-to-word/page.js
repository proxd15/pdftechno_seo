import PdftoWord from '@/components/pages/PdftoWord';

export const metadata = {
  title: 'Convert PDF to Word Online Free - PDF to DOCX | PDF Techno',
  description: 'Convert PDF files to editable Word documents online. Extract text and images from PDF to DOC/DOCX. Free, fast, and secure.',
  keywords: 'PDF to Word, PDF to DOCX, PDF to DOC, convert PDF to Word, PDF converter, extract PDF text',
  openGraph: {
    title: 'Convert PDF to Word Online Free - PDF to DOCX | PDF Techno',
    description: 'Convert PDF files to editable Word documents online. Extract text and images from PDF.',
    url: 'https://www.pdftechno.com/pdf-to-word',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert PDF to Word Online Free - PDF Techno',
    description: 'Convert PDF files to editable Word documents online. Free, fast, and secure.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/pdf-to-word',
    languages: {
      'en-US': '/pdf-to-word',
      'es-ES': '/es/pdf-to-word',
      'fr-FR': '/fr/pdf-to-word',
    },
  },
};

export default function PdfToWordPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "PDF to Word Converter - PDF Techno",
            "description": "Convert PDF files to editable Word documents online. Extract text and images from PDF.",
            "url": "https://www.pdftechno.com/pdf-to-word",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Convert PDF to Word",
              "Preserve formatting",
              "Extract text and images",
              "OCR for scanned PDFs",
              "Batch conversion",
              "Secure processing"
            ]
          })
        }}
      />
      <PdftoWord />
    </>
  );
}