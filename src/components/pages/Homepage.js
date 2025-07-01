'use client';

import HomeClient from '@/components/layout/HomeClient';

export default function HomePage() {
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
      
      <HomeClient />
    </main>
  );
}