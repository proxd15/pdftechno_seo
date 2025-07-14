import PdftoImage from '@/components/pages/PdftoImage';

export const metadata = {
  title: 'Convert PDF to JPG Online Free – High Quality Images',
  description: 'Easily convert PDF to JPG online for free. Get high-quality image output with fast and secure processing. No downloads or sign-up required.',
  keywords: 'convert pdf to jpg online free high quality, PDF to Image, PDF to JPG, PDF to PNG, convert PDF to image, PDF to picture, extract PDF images',
  openGraph: {
    title: 'Convert PDF to Image Online Free - PDF to JPG/PNG | PDF Techno',
    description: 'Convert PDF pages to images online. Export PDF as JPG, PNG, or other image formats.',
    url: 'https://www.pdftechno.com/pdf-to-image',
    siteName: 'PDF Techno',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert PDF to Image Online Free - PDF Techno',
    description: 'Convert PDF pages to images online. Export PDF as JPG, PNG, or other formats.',
    creator: '@pdftechno',
  },
  alternates: {
    canonical: 'https://www.pdftechno.com/pdf-to-image',
    languages: {
      'en-US': '/pdf-to-image',
      'es-ES': '/es/pdf-to-image',
      'fr-FR': '/fr/pdf-to-image',
    },
  },
};

export default function PdfToImagePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "PDF to Image Converter - PDF Techno",
            "description": "Convert PDF pages to images online. Export PDF as JPG, PNG, or other image formats.",
            "url": "https://www.pdftechno.com/pdf-to-image",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "Web Browser",
            "author": {
              "@type": "Organization",
              "name": "PDF Techno"
            },
            "featureList": [
              "Convert PDF to images",
              "Support JPG, PNG formats",
              "High quality output",
              "Convert all or specific pages",
              "Batch conversion",
              "Secure processing"
            ]
          })
        }}
      />
      <PdftoImage />
    </>
  );
}