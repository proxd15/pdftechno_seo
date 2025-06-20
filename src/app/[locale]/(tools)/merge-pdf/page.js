"use client"

import Script from 'next/script';
import dynamic from 'next/dynamic';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import SEO from '@/components/layout/SEO';

const PDFMerger = dynamic(() => import('@/components/tools/PDFMerger'), { ssr: false });

export default function PDFMergePage() {
  return (
    <>
      <SEO
        title="Merge PDF Files Online Free - Combine PDFs | PDF Techno"
        description="Merge multiple PDF files into a single document online for free. Fast, secure, and easy PDF merging tool. No registration required."
        keywords="merge PDF, combine PDF, PDF merger, merge PDF files online, combine PDFs, free PDF merger, PDF joiner, batch PDF merge, online PDF merger, secure PDF merge, merge PDF India, combine PDF India, PDF merger India, merge PDF files online India, combine PDFs India, free PDF merger India, PDF joiner India, batch PDF merge India, online PDF merger India, secure PDF merge India, merge PDF Hindi, merge PDF Delhi, merge PDF Mumbai, merge PDF Bangalore, merge PDF Chennai, merge PDF Kolkata, best PDF merger, accurate PDF merge, no registration PDF merge, fast PDF merge online, PDF merge for students, PDF merge for business, PDF merge for government, PDF merge for legal, PDF merge for education, PDF merge for India, PDF merge free download, PDF merge app India, PDF merge software India, PDF merge tool India, PDF merge online free India, PDF merger online India, PDF merge without email, PDF merge no watermark, PDF merge unlimited, PDF merge high quality, PDF merge OCR India, scanned PDF merge India, PDF merger Hindi, PDF merger Delhi, PDF merger Mumbai, PDF merger Bangalore, PDF merger Chennai, PDF merger Kolkata"
        canonical="https://www.pdftechno.com/merge-pdf"
        og={{
          title: "Merge PDF Files Online Free - Combine PDFs | PDF Techno",
          description: "Merge multiple PDF files into a single document online for free. Fast, secure, and easy PDF merging tool. No registration required.",
          image: "/static/assets/merge-pdf-og.webp",
          url: "https://www.pdftechno.com/merge-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "Merge PDF Files Online Free - PDF Techno",
          description: "Merge multiple PDF files into a single document online for free. Fast, secure, and easy PDF merging tool.",
          image: "/static/assets/merge-pdf-twitter.webp",
          creator: "@pdftechno"
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Merge PDF - PDF Techno",
              "description": "Merge multiple PDF files into a single document online for free. Fast, secure, and easy PDF merging tool.",
              "url": "https://www.pdftechno.com/merge-pdf",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Web Browser",
              "author": {
                "@type": "Organization",
                "name": "PDF Techno"
              },
              "featureList": [
                "Merge PDF files",
                "Combine multiple PDFs",
                "No file size limits",
                "Secure processing",
                "Batch PDF merge"
              ]
            })
          }}
        />
      </SEO>
      {/* Load PDF.js library and worker from CDN */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          // Configure PDF.js worker
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
          console.log('PDF.js loaded and worker configured successfully');
        }}
      />
      
      <main className="container mx-auto px-4 py-8 bg-white min-h-screen">
        <PDFMerger />
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}