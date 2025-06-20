"use client"

import Script from 'next/script';
import dynamic from 'next/dynamic';
import PDFMerger from '@/components/tools/PDFMerger';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import PDFRotator from '@/components/tools/PDFRotator';
const PDFSplitter = dynamic(() => import('@/components/tools/PDFSplitter'), { ssr: false });
import SEO from '@/components/layout/SEO';

export default function PDFMergePage() {
  return (
    <>
      <SEO
        title="Split PDF Online Free - Extract PDF Pages | PDF Techno"
        description="Split PDF files online for free. Extract pages from PDF or split PDF into multiple files. Fast, secure, and easy PDF splitter tool. No registration required."
        keywords="split PDF, extract PDF pages, PDF splitter, split PDF online, extract pages from PDF, free PDF splitter, PDF page extractor, batch PDF split, online PDF splitter, secure PDF split, split PDF India, extract PDF pages India, PDF splitter India, split PDF online India, extract pages from PDF India, free PDF splitter India, PDF page extractor India, batch PDF split India, online PDF splitter India, secure PDF split India, split PDF Hindi, split PDF Delhi, split PDF Mumbai, split PDF Bangalore, split PDF Chennai, split PDF Kolkata, best PDF splitter, accurate PDF split, no registration PDF split, fast PDF split online, PDF split for students, PDF split for business, PDF split for government, PDF split for legal, PDF split for education, PDF split for India, PDF split free download, PDF split app India, PDF split software India, PDF split tool India, PDF split online free India, PDF splitter online India, PDF split without email, PDF split no watermark, PDF split unlimited, PDF split high quality, PDF split OCR India, scanned PDF split India, PDF splitter Hindi, PDF splitter Delhi, PDF splitter Mumbai, PDF splitter Bangalore, PDF splitter Chennai, PDF splitter Kolkata"
        canonical="https://www.pdftechno.com/split-pdf"
        og={{
          title: "Split PDF Online Free - Extract PDF Pages | PDF Techno",
          description: "Split PDF files online for free. Extract pages from PDF or split PDF into multiple files. Fast, secure, and easy PDF splitter tool. No registration required.",
          image: "/static/assets/split-pdf-og.webp",
          url: "https://www.pdftechno.com/split-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "Split PDF Online Free - PDF Techno",
          description: "Split PDF files online for free. Extract pages from PDF or split PDF into multiple files. Fast, secure, and easy PDF splitter tool.",
          image: "/static/assets/split-pdf-twitter.webp",
          creator: "@pdftechno"
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Split PDF - PDF Techno",
              "description": "Split PDF files online for free. Extract pages from PDF or split PDF into multiple files. Fast, secure, and easy PDF splitter tool.",
              "url": "https://www.pdftechno.com/split-pdf",
              "applicationCategory": "UtilitiesApplication",
              "operatingSystem": "Web Browser",
              "author": {
                "@type": "Organization",
                "name": "PDF Techno"
              },
              "featureList": [
                "Split PDF files",
                "Extract PDF pages",
                "No file size limits",
                "Secure processing",
                "Batch PDF split"
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
        <PDFSplitter/>
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}