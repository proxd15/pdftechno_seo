import XMLtoPdf from '@/components/pages/XMLtoPdf';

export const metadata = {
  title: 'Convert XML to PDF Online Free - XML to PDF | PDF Techno',
  description: 'Convert XML files to PDF online. Transform structured data into readable PDF documents. Free, fast, and secure.',
  keywords: 'XML to PDF, convert XML to PDF, XML converter, data to PDF, XML transformation',
  openGraph: {
    title: 'Convert XML to PDF Online Free - XML to PDF | PDF Techno',
    description: 'Convert XML files to PDF online. Transform structured data into readable PDF documents.',
    url: 'https://www.pdftechno.com/xml-to-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert XML to PDF Online Free - PDF Techno',
    description: 'Convert XML files to PDF online. Transform structured data into readable PDF documents.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/xml-to-pdf',
    languages: {
      'en-US': '/xml-to-pdf',
      'es-ES': '/es/xml-to-pdf',
      'fr-FR': '/fr/xml-to-pdf',
    },
  },
};

export default function XmlToPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "XML to PDF Converter - PDF Techno",
            "description": "Convert XML files to PDF online. Transform structured data into readable PDF documents.",
            "url": "https://www.pdftechno.com/xml-to-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Convert XML to PDF",
              "Preserve XML structure",
              "Formatted output",
              "Syntax highlighting",
              "Batch conversion",
              "Secure processing"
            ]
          })
        }}
      />
      <XMLtoPdf />
    </>
  );
}