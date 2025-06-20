// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PDFtoPDFA = dynamic(() => import('@/components/tools/PDFtoPDFA'), { ssr: false });

export default function PDFToPDFAPage() {
  return (
    <>
      <SEO
        title="PDF to PDF/A Converter Online Free - PDF/A Compliance | PDF Techno"
        description="Convert PDF to PDF/A for long-term archiving and compliance online for free. Fast, secure, and easy PDF to PDF/A converter. No registration required."
        keywords="PDF to PDF/A, convert PDF to PDF/A, PDF/A compliance, free PDF to PDF/A converter, online PDF to PDF/A, batch PDF to PDF/A, secure PDF to PDF/A, PDF archiving, PDF/A converter, PDF to PDF/A India, convert PDF to PDF/A India, PDF/A compliance India, free PDF to PDF/A converter India, online PDF to PDF/A India, batch PDF to PDF/A India, secure PDF to PDF/A India, PDF archiving India, PDF/A converter India, PDF to PDF/A Hindi, PDF to PDF/A Delhi, PDF to PDF/A Mumbai, PDF to PDF/A Bangalore, PDF to PDF/A Chennai, PDF to PDF/A Kolkata, best PDF to PDF/A converter, accurate PDF to PDF/A conversion, no registration PDF to PDF/A, fast PDF to PDF/A online, PDF to PDF/A for students, PDF to PDF/A for business, PDF to PDF/A for government, PDF to PDF/A for legal, PDF to PDF/A for education, PDF to PDF/A for India, PDF to PDF/A free download, PDF to PDF/A app India, PDF to PDF/A software India, PDF to PDF/A tool India, PDF to PDF/A online free India, PDF to PDF/A converter online India, PDF to PDF/A without email, PDF to PDF/A no watermark, PDF to PDF/A unlimited, PDF to PDF/A high quality, PDF to PDF/A OCR India, scanned PDF to PDF/A India, PDF/A converter Hindi, PDF/A converter Delhi, PDF/A converter Mumbai, PDF/A converter Bangalore, PDF/A converter Chennai, PDF/A converter Kolkata"
        canonical="https://www.pdftechno.com/pdf-to-pdfa"
        og={{
          title: "PDF to PDF/A Converter Online Free - PDF/A Compliance | PDF Techno",
          description: "Convert PDF to PDF/A for long-term archiving and compliance online for free. Fast, secure, and easy PDF to PDF/A converter. No registration required.",
          image: "/static/assets/pdf-to-pdfa-og.webp",
          url: "https://www.pdftechno.com/pdf-to-pdfa",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "PDF to PDF/A Converter Online Free - PDF Techno",
          description: "Convert PDF to PDF/A for long-term archiving and compliance online for free. Fast, secure, and easy PDF to PDF/A converter.",
          image: "/static/assets/pdf-to-pdfa-twitter.webp",
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
        <PDFtoPDFA />
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}