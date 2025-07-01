import WordtoPdf from '@/components/pages/WordtoPdf';

export const metadata = {
  title: 'Convert Word to PDF Online Free - DOCX to PDF | PDF Techno',
  description: 'Convert Word documents to PDF online. Support for DOC and DOCX files. Free, fast, and secure Word to PDF converter.',
  keywords: 'Word to PDF, DOCX to PDF, DOC to PDF, convert Word to PDF, Word converter, Microsoft Word to PDF',
  openGraph: {
    title: 'Convert Word to PDF Online Free - DOCX to PDF | PDF Techno',
    description: 'Convert Word documents to PDF online. Support for DOC and DOCX files. Free, fast, and secure.',
    url: 'https://www.pdftechno.com/word-to-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert Word to PDF Online Free - PDF Techno',
    description: 'Convert Word documents to PDF online. Support for DOC and DOCX files.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/word-to-pdf',
    languages: {
      'en-US': '/word-to-pdf',
      'es-ES': '/es/word-to-pdf',
      'fr-FR': '/fr/word-to-pdf',
    },
  },
};

export default function WordToPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Word to PDF Converter - PDF Techno",
            "description": "Convert Word documents to PDF online. Support for DOC and DOCX files.",
            "url": "https://www.pdftechno.com/word-to-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Convert Word to PDF",
              "Support DOC and DOCX",
              "Preserve formatting",
              "Batch conversion",
              "Secure processing"
            ]
          })
        }}
      />
      <WordtoPdf />
    </>
  );
}