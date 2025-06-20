// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import dynamic from 'next/dynamic';
import PDFCompressor from '@/components/tools/PDFCompressor';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import DraggableGrid from '@/components/tools/DraggableGrid';
import SEO from '@/components/layout/SEO';

const PDFOrganizer = dynamic(() => import('@/components/tools/PDFOrganizer'), { ssr: false });

export default function PDFCompressPage() {
  return (
    <>
      <SEO
        title="Organize PDF Online Free - Reorder, Delete, and Rotate Pages | PDF Techno"
        description="Organize PDF pages online for free. Reorder, delete, and rotate PDF pages. Fast, secure, and easy PDF organizer tool. No registration required."
        keywords="organize PDF, reorder PDF pages, delete PDF pages, rotate PDF pages, PDF organizer, free PDF organizer, online PDF organizer, batch PDF organize, secure PDF organize, PDF page management, organize PDF India, reorder PDF pages India, delete PDF pages India, rotate PDF pages India, PDF organizer India, free PDF organizer India, online PDF organizer India, batch PDF organize India, secure PDF organize India, PDF page management India, organize PDF Hindi, organize PDF Delhi, organize PDF Mumbai, organize PDF Bangalore, organize PDF Chennai, organize PDF Kolkata, best PDF organizer, fast PDF organize, no registration PDF organize, PDF organize for students, PDF organize for business, PDF organize for government, PDF organize for legal, PDF organize for education, PDF organize for India, PDF organize free download, PDF organize app India, PDF organize software India, PDF organize tool India, PDF organize online free India, PDF organizer online India, PDF organize without email, PDF organize no watermark, PDF organize unlimited, PDF organize high quality, PDF organize OCR India, scanned PDF organize India, PDF organizer Hindi, PDF organizer Delhi, PDF organizer Mumbai, PDF organizer Bangalore, PDF organizer Chennai, PDF organizer Kolkata"
        canonical="https://www.pdftechno.com/organize-pdf"
        og={{
          title: "Organize PDF Online Free - Reorder, Delete, and Rotate Pages | PDF Techno",
          description: "Organize PDF pages online for free. Reorder, delete, and rotate PDF pages. Fast, secure, and easy PDF organizer tool. No registration required.",
          image: "/static/assets/organize-pdf-og.webp",
          url: "https://www.pdftechno.com/organize-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "Organize PDF Online Free - PDF Techno",
          description: "Organize PDF pages online for free. Reorder, delete, and rotate PDF pages. Fast, secure, and easy PDF organizer tool.",
          image: "/static/assets/organize-pdf-twitter.webp",
          creator: "@pdftechno"
        }}
      />
      {/* Load PDF.js library from CDN */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          // Configure PDF.js worker
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        }}
      />
      
      <main className="container mx-auto px-4 py-8 bg-white min-h-screen">
        <PDFOrganizer />
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}