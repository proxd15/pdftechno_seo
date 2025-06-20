// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import PdfToPowerPointConverter from '@/components/tools/PdfToPowerPointConverter';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PdfToExcelConverter = dynamic(() => import('@/components/tools/PdfToExcelConverter'), { ssr: false });

export default function PDFToExcelPage() {
  return (
    <>
      <SEO
        title="PDF to Excel Converter Online Free - Convert PDF to XLSX | PDF Techno"
        description="Convert PDF to Excel (XLSX) online for free. Fast, secure, and accurate PDF to Excel converter. No registration required."
        keywords="PDF to Excel, convert PDF to Excel, PDF to XLSX, free PDF to Excel converter, online PDF to Excel, batch PDF to Excel, secure PDF to Excel, extract tables from PDF, PDF Excel converter, PDF to Excel India, convert PDF to Excel India, PDF to XLSX India, free PDF to Excel converter India, online PDF to Excel India, batch PDF to Excel India, secure PDF to Excel India, extract tables from PDF India, PDF Excel converter India, PDF to Excel Hindi, PDF to Excel Delhi, PDF to Excel Mumbai, PDF to Excel Bangalore, PDF to Excel Chennai, PDF to Excel Kolkata, best PDF to Excel converter, accurate PDF to Excel conversion, no registration PDF to Excel, fast PDF to Excel online, PDF to Excel for students, PDF to Excel for business, PDF to Excel for government, PDF to Excel for legal, PDF to Excel for education, PDF to Excel for India, PDF to Excel free download, PDF to Excel app India, PDF to Excel software India, PDF to Excel tool India, PDF to Excel online free India, PDF to Excel converter online India, PDF to Excel without email, PDF to Excel no watermark, PDF to Excel unlimited, PDF to Excel high quality, PDF to Excel OCR India, scanned PDF to Excel India, PDF to XLSX converter India, PDF to Excel converter Hindi, PDF to Excel converter Delhi, PDF to Excel converter Mumbai, PDF to Excel converter Bangalore, PDF to Excel converter Chennai, PDF to Excel converter Kolkata"
        canonical="https://www.pdftechno.com/pdf-to-excel"
        og={{
          title: "PDF to Excel Converter Online Free - Convert PDF to XLSX | PDF Techno",
          description: "Convert PDF to Excel (XLSX) online for free. Fast, secure, and accurate PDF to Excel converter. No registration required.",
          image: "/static/assets/pdf-to-excel-og.webp",
          url: "https://www.pdftechno.com/pdf-to-excel",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "PDF to Excel Converter Online Free - PDF Techno",
          description: "Convert PDF to Excel (XLSX) online for free. Fast, secure, and accurate PDF to Excel converter.",
          image: "/static/assets/pdf-to-excel-twitter.webp",
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
        <PdfToExcelConverter />
        
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}