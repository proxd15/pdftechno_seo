import PdftoPPT from '@/components/pages/PdftoPPT';

export const metadata = {
  title: 'Convert PDF to PowerPoint Online Free - PDF to PPT | PDF Techno',
  description: 'Convert PDF files to PowerPoint presentations online. Transform PDF pages into editable PPT/PPTX slides. Free and secure.',
  keywords: 'PDF to PowerPoint, PDF to PPT, PDF to PPTX, convert PDF to PowerPoint, PDF to presentation',
  openGraph: {
    title: 'Convert PDF to PowerPoint Online Free - PDF to PPT | PDF Techno',
    description: 'Convert PDF files to PowerPoint presentations online. Transform PDF pages into editable slides.',
    url: 'https://www.pdftechno.com/pdf-to-powerpoint',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert PDF to PowerPoint Online Free - PDF Techno',
    description: 'Convert PDF files to PowerPoint presentations online. Free and secure.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/pdf-to-powerpoint',
    languages: {
      'en-US': '/pdf-to-powerpoint',
      'es-ES': '/es/pdf-to-powerpoint',
      'fr-FR': '/fr/pdf-to-powerpoint',
    },
  },
};

export default function PdfToPowerpointPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "PDF to PowerPoint Converter - PDF Techno",
            "description": "Convert PDF files to PowerPoint presentations online. Transform PDF pages into editable slides.",
            "url": "https://www.pdftechno.com/pdf-to-powerpoint",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Convert PDF to PowerPoint",
              "Create editable slides",
              "Preserve layout",
              "Extract images and text",
              "Batch conversion",
              "Secure processing"
            ]
          })
        }}
      />
      <PdftoPPT />
    </>
  );
}