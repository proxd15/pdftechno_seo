// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PDFUnlock = dynamic(() => import('@/components/tools/PDFUnlock'), { ssr: false });

export default function UnlockPDFPage() {
  return (
    <>
      <SEO
        title="Unlock PDF Online Free - Remove PDF Password | PDF Techno"
        description="Unlock PDF files and remove password protection online for free. Fast, secure, and easy PDF unlock tool. No registration required."
        keywords="unlock PDF, remove PDF password, PDF unlocker, free PDF unlock, online PDF unlock, batch PDF unlock, secure PDF unlock, PDF password remover, PDF unlock tool, unlock PDF India, remove PDF password India, PDF unlocker India, free PDF unlock India, online PDF unlock India, batch PDF unlock India, secure PDF unlock India, PDF password remover India, PDF unlock tool India, unlock PDF Hindi, unlock PDF Delhi, unlock PDF Mumbai, unlock PDF Bangalore, unlock PDF Chennai, unlock PDF Kolkata, best PDF unlocker, fast PDF unlock, no registration PDF unlock, PDF unlock for students, PDF unlock for business, PDF unlock for government, PDF unlock for legal, PDF unlock for education, PDF unlock for India, PDF unlock free download, PDF unlock app India, PDF unlock software India, PDF unlock tool India, PDF unlock online free India, PDF unlocker online India, PDF unlock without email, PDF unlock no watermark, PDF unlock unlimited, PDF unlock high quality, PDF unlock OCR India, scanned PDF unlock India, PDF unlocker Hindi, PDF unlocker Delhi, PDF unlocker Mumbai, PDF unlocker Bangalore, PDF unlocker Chennai, PDF unlocker Kolkata"
        canonical="https://www.pdftechno.com/unlock-pdf"
        og={{
          title: "Unlock PDF Online Free - Remove PDF Password | PDF Techno",
          description: "Unlock PDF files and remove password protection online for free. Fast, secure, and easy PDF unlock tool. No registration required.",
          image: "/static/assets/unlock-pdf-og.webp",
          url: "https://www.pdftechno.com/unlock-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "Unlock PDF Online Free - PDF Techno",
          description: "Unlock PDF files and remove password protection online for free. Fast, secure, and easy PDF unlock tool.",
          image: "/static/assets/unlock-pdf-twitter.webp",
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
        <PDFUnlock />
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}