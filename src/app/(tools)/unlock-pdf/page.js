import UnlockPdf from '@/components/pages/UnlockPdf';

export const metadata = {
  title: 'Unlock PDF Online Free - Remove PDF Password | PDF Techno',
  description: 'Remove password protection from PDF files online. Unlock encrypted PDFs to edit, copy, and print. Free and secure.',
  keywords: 'unlock PDF, remove PDF password, decrypt PDF, PDF unlocker, remove PDF protection, PDF password remover',
  openGraph: {
    title: 'Unlock PDF Online Free - Remove PDF Password | PDF Techno',
    description: 'Remove password protection from PDF files online. Unlock encrypted PDFs easily.',
    url: 'https://www.pdftechno.com/unlock-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unlock PDF Online Free - PDF Techno',
    description: 'Remove password protection from PDF files online. Free and secure.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/unlock-pdf',
    languages: {
      'en-US': '/unlock-pdf',
      'es-ES': '/es/unlock-pdf',
      'fr-FR': '/fr/unlock-pdf',
    },
  },
};

export default function UnlockPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Unlock PDF - PDF Techno",
            "description": "Remove password protection from PDF files online. Unlock encrypted PDFs easily.",
            "url": "https://www.pdftechno.com/unlock-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Remove PDF passwords",
              "Unlock encrypted PDFs",
              "Remove printing restrictions",
              "Remove copying restrictions",
              "Batch unlocking",
              "Secure processing"
            ]
          })
        }}
      />
      <UnlockPdf />
    </>
  );
}