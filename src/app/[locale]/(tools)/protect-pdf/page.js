// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PDFProtector = dynamic(() => import('@/components/tools/PDFProtector'), { ssr: false });

export default function PDFProtect() {
  return (
    <>
      <SEO
        title="Protect PDF Online Free - Encrypt & Password Protect PDF | PDF Techno"
        description="Protect your PDF files with password encryption online for free. Fast, secure, and easy PDF protection tool. No registration required."
        keywords="protect PDF, encrypt PDF, password protect PDF, secure PDF, free PDF protection, online PDF protector, batch PDF protection, PDF encryption, PDF password tool, protect PDF India, encrypt PDF India, password protect PDF India, secure PDF India, free PDF protection India, online PDF protector India, batch PDF protection India, PDF encryption India, PDF password tool India, protect PDF Hindi, protect PDF Delhi, protect PDF Mumbai, protect PDF Bangalore, protect PDF Chennai, protect PDF Kolkata, best PDF protector, strong PDF encryption, no registration PDF protection, fast PDF protection online, PDF protection for students, PDF protection for business, PDF protection for government, PDF protection for legal, PDF protection for education, PDF protection for India, PDF protection free download, PDF protection app India, PDF protection software India, PDF protection tool India, PDF protection online free India, PDF protector online India, PDF protection without email, PDF protection no watermark, PDF protection unlimited, PDF protection high security, PDF protection OCR India, scanned PDF protection India, PDF protector Hindi, PDF protector Delhi, PDF protector Mumbai, PDF protector Bangalore, PDF protector Chennai, PDF protector Kolkata"
        canonical="https://www.pdftechno.com/protect-pdf"
        og={{
          title: "Protect PDF Online Free - Encrypt & Password Protect PDF | PDF Techno",
          description: "Protect your PDF files with password encryption online for free. Fast, secure, and easy PDF protection tool. No registration required.",
          image: "/static/assets/protect-pdf-og.webp",
          url: "https://www.pdftechno.com/protect-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "Protect PDF Online Free - PDF Techno",
          description: "Protect your PDF files with password encryption online for free. Fast, secure, and easy PDF protection tool.",
          image: "/static/assets/protect-pdf-twitter.webp",
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
        <PDFProtector />
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}