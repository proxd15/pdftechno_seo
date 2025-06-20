"use client"

import Script from 'next/script';
import PDFMerger from '@/components/tools/PDFMerger';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PDFRotator = dynamic(() => import('@/components/tools/PDFRotator'), { ssr: false });

export default function RotatePDFPage() {
  return (
    <>
      <SEO
        title="Rotate PDF Online Free - Rotate PDF Pages | PDF Techno"
        description="Rotate PDF pages online for free. Fast, secure, and easy PDF rotation tool. No registration required."
        keywords="rotate PDF, rotate PDF pages, PDF rotation, free PDF rotate, online PDF rotate, batch PDF rotate, secure PDF rotate, PDF page rotator, PDF rotate tool, rotate PDF India, rotate PDF pages India, PDF rotation India, free PDF rotate India, online PDF rotate India, batch PDF rotate India, secure PDF rotate India, PDF page rotator India, PDF rotate tool India, rotate PDF Hindi, rotate PDF Delhi, rotate PDF Mumbai, rotate PDF Bangalore, rotate PDF Chennai, rotate PDF Kolkata, best PDF rotator, fast PDF rotate, no registration PDF rotate, PDF rotate for students, PDF rotate for business, PDF rotate for government, PDF rotate for legal, PDF rotate for education, PDF rotate for India, PDF rotate free download, PDF rotate app India, PDF rotate software India, PDF rotate tool India, PDF rotate online free India, PDF rotator online India, PDF rotate without email, PDF rotate no watermark, PDF rotate unlimited, PDF rotate high quality, PDF rotate OCR India, scanned PDF rotate India, PDF rotator Hindi, PDF rotator Delhi, PDF rotator Mumbai, PDF rotator Bangalore, PDF rotator Chennai, PDF rotator Kolkata"
        canonical="https://www.pdftechno.com/rotate-pdf"
        og={{
          title: "Rotate PDF Online Free - Rotate PDF Pages | PDF Techno",
          description: "Rotate PDF pages online for free. Fast, secure, and easy PDF rotation tool. No registration required.",
          image: "/static/assets/rotate-pdf-og.webp",
          url: "https://www.pdftechno.com/rotate-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "Rotate PDF Online Free - PDF Techno",
          description: "Rotate PDF pages online for free. Fast, secure, and easy PDF rotation tool.",
          image: "/static/assets/rotate-pdf-twitter.webp",
          creator: "@pdftechno"
        }}
      />
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
        <PDFRotator/>
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}