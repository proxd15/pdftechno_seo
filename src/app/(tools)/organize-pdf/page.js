import OrganizePdf from '@/components/pages/OrganizePdf';

export const metadata = {
  title: 'Organize PDF Pages Online Free - Reorder Pages | PDF Techno',
  description: 'Organize and reorder PDF pages online. Rearrange, delete, or add pages to your PDF. Free, fast, and secure.',
  keywords: 'organize PDF, reorder PDF pages, rearrange PDF, PDF page organizer, sort PDF pages',
  openGraph: {
    title: 'Organize PDF Pages Online Free - Reorder Pages | PDF Techno',
    description: 'Organize and reorder PDF pages online. Rearrange, delete, or add pages to your PDF. Free and secure.',
    url: 'https://www.pdftechno.com/organize-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Organize PDF Pages Online Free - PDF Techno',
    description: 'Organize and reorder PDF pages online. Rearrange, delete, or add pages to your PDF.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/organize-pdf',
    languages: {
      'en-US': '/organize-pdf',
      'es-ES': '/es/organize-pdf',
      'fr-FR': '/fr/organize-pdf',
    },
  },
};

export default function OrganizePdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Organize PDF - PDF Techno",
            "description": "Organize and reorder PDF pages online. Rearrange, delete, or add pages to your PDF.",
            "url": "https://www.pdftechno.com/organize-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Organize PDF pages",
              "Reorder pages",
              "Delete pages",
              "Add pages",
              "Drag and drop interface",
              "Secure processing"
            ]
          })
        }}
      />
      <OrganizePdf />
    </>
  );
}