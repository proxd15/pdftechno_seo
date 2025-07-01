import ProtectPdf from '@/components/pages/ProtectPdf';

export const metadata = {
  title: 'Protect PDF Online Free - Add Password to PDF | PDF Techno',
  description: 'Add password protection to PDF files online. Encrypt PDFs and restrict editing, copying, and printing. Free and secure.',
  keywords: 'protect PDF, add PDF password, encrypt PDF, PDF security, password protect PDF, secure PDF',
  openGraph: {
    title: 'Protect PDF Online Free - Add Password to PDF | PDF Techno',
    description: 'Add password protection to PDF files online. Encrypt PDFs and restrict access.',
    url: 'https://www.pdftechno.com/protect-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Protect PDF Online Free - PDF Techno',
    description: 'Add password protection to PDF files online. Free and secure.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/protect-pdf',
    languages: {
      'en-US': '/protect-pdf',
      'es-ES': '/es/protect-pdf',
      'fr-FR': '/fr/protect-pdf',
    },
  },
};

export default function ProtectPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Protect PDF - PDF Techno",
            "description": "Add password protection to PDF files online. Encrypt PDFs and restrict access.",
            "url": "https://www.pdftechno.com/protect-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Add PDF passwords",
              "Encrypt PDF files",
              "Set permissions",
              "Restrict printing",
              "Restrict copying",
              "256-bit encryption"
            ]
          })
        }}
      />
      <ProtectPdf />
    </>
  );
}