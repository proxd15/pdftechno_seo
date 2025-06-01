// app/[locale]/(tools)/add-page-numbers/page.js
import PDFPageNumbersClient from './PDFPageNumbersClient';

// Metadata export for App Router (Server Component)
export const metadata = {
  metadataBase: new URL('https://www.pdftechno.com'),
  title: 'Add Page Numbers to PDF Online Free - PDF Page Numbering Tool | PDF Techno',
  description: 'Add page numbers to PDF files online for free. Choose position, dimensions, format and typography. Automatic PDF page numbering tool with custom styling options.',
  keywords: 'add page numbers to pdf, pdf page numbering, insert page numbers in pdf, page numbers pdf online, number pdf pages, pdf page number tool, add footer page numbers to pdf, automatic page numbering pdf, online pdf page counter, free pdf page number adder, pdf page numbering online, custom page numbers pdf, pdf footer numbering, header page numbers pdf, pdf page formatting, sequential page numbering, roman numerals pdf pages, arabic numerals pdf, pdf page indexing, batch page numbering pdf',
  authors: [{ name: 'PDF Techno Team' }],
  
  // Open Graph Meta Tags
  openGraph: {
    siteName: 'PDF Techno - Free Online PDF Tools',
    title: 'Add Page Numbers to PDF Online - Free PDF Page Numbering Tool',
    description: 'Add page numbers to PDF files with custom position, format and styling. Free online PDF page numbering tool with advanced typography options.',
    type: 'website',
    url: '/add-page-numbers',
    images: [
      {
        url: '/static/assets/add-page-numbers-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Add Page Numbers to PDF - PDF Techno',
      }
    ],
    locale: 'en_US',
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Add Page Numbers to PDF Online Free - PDF Techno',
    description: 'Free online tool to add page numbers to PDF files. Custom position, format and typography options available.',
    images: ['/static/assets/add-page-numbers-twitter.jpg'],
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
    canonical: '/add-page-numbers',
    languages: {
      'en-US': '/en/add-page-numbers',
      'es-ES': '/es/add-page-numbers',
      'fr-FR': '/fr/add-page-numbers',
      'de-DE': '/de/add-page-numbers',
    },
  },
  
  // Additional meta tags
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'format-detection': 'telephone=no',
    'theme-color': '#DA1F10',
    'application-name': 'PDF Techno',
    'msapplication-TileColor': '#DA1F10',
    'google-site-verification': 'your-google-verification-code',
    'msvalidate.01': 'your-bing-verification-code',
  },
};

export default function PDFPageNumbersPage() {
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
              "name": "PDF Page Numbering Tool - PDF Techno",
              "description": "Free online tool to add page numbers to PDF files with custom formatting options",
              "url": "https://www.pdftechno.com/add-page-numbers",
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
                "Add page numbers to PDF",
                "Custom position and alignment",
                "Multiple number formats (Arabic, Roman)",
                "Font and size customization",
                "Header and footer placement",
                "Batch page numbering",
                "Preview before download"
              ],
              "softwareVersion": "2.0",
              "browserRequirements": "HTML5, JavaScript enabled"
            },
            {
              "@context": "https://schema.org",
              "@type": "HowTo",
              "name": "How to Add Page Numbers to PDF Files",
              "description": "Step-by-step guide to add page numbers to PDF documents online",
              "image": "https://www.pdftechno.com/static/assets/how-to-add-page-numbers.jpg",
              "step": [
                {
                  "@type": "HowToStep",
                  "name": "Upload PDF File",
                  "text": "Click 'Choose PDF file' or drag and drop your PDF document into the page numbering tool"
                },
                {
                  "@type": "HowToStep", 
                  "name": "Choose Position and Format",
                  "text": "Select where to place page numbers (header/footer) and choose numbering format (1,2,3 or i,ii,iii)"
                },
                {
                  "@type": "HowToStep",
                  "name": "Customize Appearance",
                  "text": "Adjust font size, style, color and alignment of page numbers to match your document"
                },
                {
                  "@type": "HowToStep",
                  "name": "Preview and Download",
                  "text": "Preview the numbered pages and download your PDF with page numbers added"
                }
              ]
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Can I add page numbers to any PDF file?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, you can add page numbers to any PDF file regardless of size or content. Our tool supports all standard PDF formats."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I customize the page number format?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, you can choose from multiple formats including Arabic numerals (1,2,3), Roman numerals (i,ii,iii), and customize font, size, and position."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is adding page numbers to PDF free?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our PDF page numbering tool is completely free with no file size limits or registration required."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I start page numbering from a specific number?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, you can specify the starting page number and choose which pages to include in the numbering sequence."
                  }
                }
              ]
            }
          ])
        }}
      />

      <main className="container mx-auto px-4 py-8 bg-white min-h-screen">
        {/* Use client component for interactive features */}
        <PDFPageNumbersClient />
      </main>
    </>
  );
}