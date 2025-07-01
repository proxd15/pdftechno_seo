import SignPdf from '@/components/pages/SignPdf';

export const metadata = {
  title: 'Sign PDF Online Free - Add Digital Signature | PDF Techno',
  description: 'Add digital signatures to PDF documents online. Draw, type, or upload your signature. Free, fast, and legally binding.',
  keywords: 'sign PDF, digital signature, PDF signature, e-sign PDF, electronic signature, sign documents online',
  openGraph: {
    title: 'Sign PDF Online Free - Add Digital Signature | PDF Techno',
    description: 'Add digital signatures to PDF documents online. Draw, type, or upload your signature.',
    url: 'https://www.pdftechno.com/sign-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign PDF Online Free - PDF Techno',
    description: 'Add digital signatures to PDF documents online. Free and legally binding.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/sign-pdf',
    languages: {
      'en-US': '/sign-pdf',
      'es-ES': '/es/sign-pdf',
      'fr-FR': '/fr/sign-pdf',
    },
  },
};

export default function SignPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Sign PDF - PDF Techno",
            "description": "Add digital signatures to PDF documents online. Draw, type, or upload your signature.",
            "url": "https://www.pdftechno.com/sign-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Digital signatures",
              "Draw signatures",
              "Type signatures",
              "Upload signature images",
              "Multiple signatures",
              "Legally binding"
            ]
          })
        }}
      />
      <SignPdf />
    </>
  );
}