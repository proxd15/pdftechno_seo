// app/[locale]/(tools)/compress-pdf/page.js
import Script from 'next/script';
import PDFCompressClient from './PDFCompressClient';

// Metadata export for App Router (Server Component)
export const metadata = {
  metadataBase: new URL('https://www.pdftechno.com'),
  title: 'Compress PDF Online Free - Reduce PDF File Size | PDF Techno',
  description: 'Compress PDF files online for free. Reduce PDF file size by up to 99% while maintaining quality. Fast, secure, and easy PDF compression tool. No registration required.',
  keywords: 'compress PDF, PDF compressor, reduce PDF size, compress PDF online, shrink PDF file, PDF size reducer, minimize PDF file size, compress large PDF, free PDF compressor, PDF optimizer, compress PDF file, reduce file size, PDF compression tool, online PDF compressor, compress PDF without losing quality, batch PDF compression, compress multiple PDFs, PDF file compression, optimize PDF size, compress PDF documents, small PDF files, compress PDF for email, compress PDF for web',
  authors: [{ name: 'PDF Techno Team' }],
  
  // Open Graph Meta Tags
  openGraph: {
    siteName: 'PDF Techno - Free Online PDF Tools',
    title: 'Compress PDF Online Free - Reduce PDF File Size by 99%',
    description: 'Free online PDF compressor. Reduce PDF file size while maintaining quality. Fast, secure, and easy to use. Compress multiple PDFs at once.',
    type: 'website',
    url: '/compress-pdf',
    images: [
      {
        url: '/static/assets/compress-pdf-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Compress PDF Online - PDF Techno',
      }
    ],
    locale: 'en_US',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Compress PDF Online Free - PDF Techno',
    description: 'Reduce PDF file size by up to 99% while maintaining quality. Free online PDF compressor.',
    images: ['/static/assets/compress-pdf-twitter.jpg'],
    creator: '@pdftechno',
  },
  
  // Technical SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Icons
  icons: {
    icon: [
      { url: '/images/techno_fav.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/techno_fav.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/images/techno_fav.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  
  // Canonical and alternates
  alternates: {
    canonical: '/compress-pdf',
    languages: {
      'en-US': '/en/compress-pdf',
      'es-ES': '/es/compress-pdf',
      'fr-FR': '/fr/compress-pdf',
      'de-DE': '/de/compress-pdf',
    },
  },
  
  // Additional meta tags
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
    'theme-color': '#2563eb',
    'application-name': 'PDF Techno',
    'msapplication-TileColor': '#2563eb',
    'google-site-verification': 'your-google-verification-code',
    'msvalidate.01': 'your-bing-verification-code',
  },
};

export default function PDFCompressPage() {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "PDF Compressor - PDF Techno",
              "description": "Free online PDF compression tool to reduce file size while maintaining quality",
              "url": "https://www.pdftechno.com/compress-pdf",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Web Browser",
              "author": {
                "@type": "Organization",
                "name": "PDF Techno"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Compress PDF files",
                "Reduce file size up to 99%",
                "Maintain PDF quality",
                "Batch compression",
                "No file size limits",
                "Secure processing"
              ],
              "softwareVersion": "2.0",
              "browserRequirements": "HTML5, JavaScript enabled"
            },
            {
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": "How to Compress PDF Files Online",
              "description": "Step-by-step guide to compress PDF files and reduce file size",
              "image": "https://www.pdftechno.com/static/assets/how-to-compress-pdf.jpg",
              "step": [
                {
                  "@type": "HowToStep",
                  "name": "Upload PDF",
                  "text": "Click 'Choose PDF files' or drag and drop your PDF file into the compressor"
                },
                {
                  "@type": "HowToStep", 
                  "name": "Select Compression Level",
                  "text": "Choose the compression level based on your needs - high, medium, or low compression"
                },
                {
                  "@type": "HowToStep",
                  "name": "Compress PDF",
                  "text": "Click 'Compress PDF' button and wait for the compression to complete"
                },
                {
                  "@type": "HowToStep",
                  "name": "Download Compressed PDF",
                  "text": "Download your compressed PDF file with reduced file size"
                }
              ]
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How much can I compress a PDF file?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can typically reduce PDF file size by 60-99% depending on the original file content and compression level chosen."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is PDF compression free?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our PDF compression tool is completely free with no file size limits or registration required."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Will compressing affect PDF quality?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our smart compression algorithm maintains visual quality while significantly reducing file size. You can choose compression levels based on your quality needs."
                  }
                }
              ]
            }
          ])
        }}
      />

      <main className="container mx-auto px-4 py-8 bg-white min-h-screen">
        {/* Use client component for interactive features */}
        <PDFCompressClient />
      </main>
    </>
  );
}