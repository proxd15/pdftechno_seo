// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PDFRepair = dynamic(() => import('@/components/tools/PDFRepair'), { ssr: false });

export default function RepairPDF() {
  return (
    <>
      <SEO
        title="Repair PDF Online Free - Fix Corrupted PDF Files | PDF Techno"
        description="Repair corrupted or damaged PDF files online for free. Fast, secure, and easy PDF repair tool. No registration required."
        keywords="repair PDF, fix PDF, corrupted PDF, damaged PDF, PDF repair tool, free PDF repair, online PDF repair, batch PDF repair, secure PDF repair, recover PDF, repair PDF India, fix PDF India, corrupted PDF India, damaged PDF India, PDF repair tool India, free PDF repair India, online PDF repair India, batch PDF repair India, secure PDF repair India, recover PDF India, repair PDF Hindi, repair PDF Delhi, repair PDF Mumbai, repair PDF Bangalore, repair PDF Chennai, repair PDF Kolkata, best PDF repair tool, fast PDF repair, no registration PDF repair, PDF repair for students, PDF repair for business, PDF repair for government, PDF repair for legal, PDF repair for education, PDF repair for India, PDF repair free download, PDF repair app India, PDF repair software India, PDF repair tool India, PDF repair online free India, PDF repairer online India, PDF repair without email, PDF repair no watermark, PDF repair unlimited, PDF repair high quality, PDF repair OCR India, scanned PDF repair India, PDF repairer Hindi, PDF repairer Delhi, PDF repairer Mumbai, PDF repairer Bangalore, PDF repairer Chennai, PDF repairer Kolkata"
        canonical="https://www.pdftechno.com/repair-pdf"
        og={{
          title: "Repair PDF Online Free - Fix Corrupted PDF Files | PDF Techno",
          description: "Repair corrupted or damaged PDF files online for free. Fast, secure, and easy PDF repair tool. No registration required.",
          image: "/static/assets/repair-pdf-og.webp",
          url: "https://www.pdftechno.com/repair-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "Repair PDF Online Free - PDF Techno",
          description: "Repair corrupted or damaged PDF files online for free. Fast, secure, and easy PDF repair tool.",
          image: "/static/assets/repair-pdf-twitter.webp",
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
        <PDFRepair/>
        
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}