import ImagetoPdf from '@/components/pages/ImagetoPdf';

export const metadata = {
  title: 'Convert Image to PDF Online Free - JPG to PDF | PDF Techno',
  description: 'Convert images to PDF online. Support for JPG, PNG, GIF, BMP, and more. Free, fast, and secure image to PDF converter.',
  keywords: 'Image to PDF, JPG to PDF, PNG to PDF, convert image to PDF, photo to PDF, picture to PDF',
  openGraph: {
    title: 'Convert Image to PDF Online Free - JPG to PDF | PDF Techno',
    description: 'Convert images to PDF online. Support for JPG, PNG, GIF, BMP, and more formats.',
    url: 'https://www.pdftechno.com/image-to-pdf',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert Image to PDF Online Free - PDF Techno',
    description: 'Convert images to PDF online. Support for JPG, PNG, GIF, BMP, and more.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/image-to-pdf',
    languages: {
      'en-US': '/image-to-pdf',
      'es-ES': '/es/image-to-pdf',
      'fr-FR': '/fr/image-to-pdf',
    },
  },
};

export default function ImageToPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Image to PDF Converter - PDF Techno",
            "description": "Convert images to PDF online. Support for JPG, PNG, GIF, BMP, and more formats.",
            "url": "https://www.pdftechno.com/image-to-pdf",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Convert images to PDF",
              "Support multiple formats",
              "Combine multiple images",
              "Adjust page size and orientation",
              "Batch conversion",
              "Secure processing"
            ]
          })
        }}
      />
      <ImagetoPdf />
    </>
  );
}