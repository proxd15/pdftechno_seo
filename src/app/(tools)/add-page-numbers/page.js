import PageNumbers from '@/components/pages/PageNumbers';

export const metadata = {
  title: 'Add Page Numbers to PDF Online Free | PDF Techno',
  description: 'Add page numbers to PDF documents online. Customize position, format, and style of page numbering. Free and easy.',
  keywords: 'add page numbers PDF, PDF page numbers, number PDF pages, PDF pagination, page numbering',
  openGraph: {
    title: 'Add Page Numbers to PDF Online Free | PDF Techno',
    description: 'Add page numbers to PDF documents online. Customize position and format.',
    url: 'https://www.pdftechno.com/add-page-numbers',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Add Page Numbers to PDF Online Free - PDF Techno',
    description: 'Add page numbers to PDF documents online. Free and easy.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/add-page-numbers',
    languages: {
      'en-US': '/add-page-numbers',
      'es-ES': '/es/add-page-numbers',
      'fr-FR': '/fr/add-page-numbers',
    },
  },
};

export default function AddPageNumbersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Add Page Numbers - PDF Techno",
            "description": "Add page numbers to PDF documents online. Customize position and format.",
            "url": "https://www.pdftechno.com/add-page-numbers",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Add page numbers",
              "Custom positioning",
              "Various formats",
              "Font selection",
              "Skip pages option",
              "Batch processing"
            ]
          })
        }}
      />
      <PageNumbers />
    </>
  );
}