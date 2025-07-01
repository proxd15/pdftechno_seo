import PPTtoPdf from '@/components/pages/PPTtoPdf';

export const metadata = {
  title: 'Convert PowerPoint to PDF Online Free - PPT to PDF | PDF Techno',
  description: 'Convert PowerPoint presentations to PDF online. Support for PPT and PPTX files. Free, fast, and secure.',
  keywords: 'PowerPoint to PDF, PPT to PDF, PPTX to PDF, convert PowerPoint to PDF, presentation to PDF',
  openGraph: {
    title: 'Convert PowerPoint to PDF Online Free - PPT to PDF | PDF Techno',
    description: 'Convert PowerPoint presentations to PDF online. Support for PPT and PPTX files.',
    url: 'https://www.pdftechno.com/powerpoint-to-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert PowerPoint to PDF Online Free - PDF Techno',
    description: 'Convert PowerPoint presentations to PDF online. Support for PPT and PPTX files.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/powerpoint-to-pdf',
    languages: {
      'en-US': '/powerpoint-to-pdf',
      'es-ES': '/es/powerpoint-to-pdf',
      'fr-FR': '/fr/powerpoint-to-pdf',
    },
  },
};

export default function PowerpointToPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "PowerPoint to PDF Converter - PDF Techno",
            "description": "Convert PowerPoint presentations to PDF online. Support for PPT and PPTX files.",
            "url": "https://www.pdftechno.com/powerpoint-to-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Convert PowerPoint to PDF",
              "Support PPT and PPTX",
              "Preserve slide layouts",
              "Convert animations to static",
              "Batch conversion",
              "Secure processing"
            ]
          })
        }}
      />
      <PPTtoPdf />
    </>
  );
}