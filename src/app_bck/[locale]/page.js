// app/[locale]/page.js
import HomeClient from '@/components/layout/HomeClient';
import PDFTools from '@/components/layout/PDFTools';
import TestimonialsSection from '@/components/layout/TestimonialsSection';

// Competitive metadata optimized to compete with iLovePDF and similar tools
export const metadata = {
  metadataBase: new URL('https://www.pdftechno.com'),
  title: 'PDF Techno - Free Online PDF Tools | Merge, Split, Convert & Edit PDFs',
  description: 'Free online PDF tools to merge, split, compress, convert and edit PDF files. 100% secure, no registration required. Transform documents with PDF Techno - the best alternative to expensive PDF software.',
  keywords: 'free PDF tools, online PDF editor, merge PDF, split PDF, compress PDF, PDF converter, Word to PDF, Excel to PDF, PowerPoint to PDF, PDF to Word, PDF to JPG, unlock PDF, protect PDF, sign PDF, watermark PDF, rotate PDF, organize PDF pages, PDF reader, OCR PDF, repair PDF, extract PDF pages, combine PDF files, PDF splitter, PDF compressor, PDF optimizer, secure PDF tools, batch PDF processing, online document converter, PDF manipulation, PDF utilities, web-based PDF editor, mobile PDF tools, PDF form filler, PDF annotation, digital signature PDF, PDF password remover, PDF page numbering, PDF bookmark editor, PDF text extraction, image to PDF converter, PDF quality enhancer, PDF file size reducer, PDF accessibility tools, PDF compliance checker, PDF archiving solution, PDF workflow automation',
  authors: [{ name: 'PDF Techno Team' }],
  
  // Enhanced Open Graph for better social sharing
  openGraph: {
    siteName: 'PDF Techno - Free Online PDF Tools',
    title: 'PDF Techno - Free Online PDF Tools | Best PDF Editor Alternative',
    description: 'Transform, edit and manage PDF files online for free. Merge, split, compress, convert and edit PDFs without software installation. Secure, fast and reliable PDF tools.',
    type: 'website',
    url: '/',
    locale: 'en_US',
    images: [
      {
        url: '/static/assets/pdf-techno-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PDF Techno - Free Online PDF Tools',
      }
    ],
  },

  // Twitter Card optimization
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Techno - Free Online PDF Tools',
    description: 'Free online PDF editor to merge, split, compress and convert PDF files. No registration required.',
    // images: ['/static/assets/pdf-techno-twitter-card.jpg'],
    creator: '@pdftechno',
  },

  // Technical SEO enhancements
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

  // Structured data hints
  category: 'Technology',
  classification: 'PDF Tools and Document Management',
  
  // Icons and manifest
  icons: {
    icon: [
      { url: '/images/techno_fav.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/techno_fav.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/images/techno_fav.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // Verification tags for search engines
  // verification: {
  //   google: 'your-google-verification-code',
  //   bing: 'your-bing-verification-code',
  // },

  // Alternative languages/locales
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'es-ES': '/es',
      'fr-FR': '/fr',
      'de-DE': '/de',
    },
  },

  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
    'theme-color': '#DA1F10',
    'application-name': 'PDF Techno',
    'msapplication-TileColor': '#DA1F10',
    'msapplication-config': '/static/assets/browserconfig.xml',
  },
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-4 items-center bg-gray-50">
      {/* Schema.org JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "PDF Techno",
              "url": "https://www.pdftechno.com",
              "description": "Free online PDF tools and document converter",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.pdftechno.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            },
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "PDF Techno",
              "description": "Free online PDF tools for merging, splitting, compressing and converting PDF files",
              "url": "https://www.pdftechno.com",
              "applicationCategory": "OfficeApplication",
              "operatingSystem": "Web Browser",
              "featureList": [
                "Merge PDF files",
                "Split PDF documents", 
                "Compress PDF files",
                "Convert documents to PDF",
                "PDF to Word converter",
                "Secure PDF protection",
                "Digital PDF signatures"
              ],
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "15000"
              }
            }
          ])
        }}
      />
      
      {/* Use client component for i18n functionality */}
      <HomeClient />
    </main>
  );
}