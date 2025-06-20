"use client"

import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const ExcelToPdfConverter = dynamic(() => import('@/components/tools/ExcelToPdfConverter'), { ssr: false });

export default function ExcelToPDFPage() {
  return (
    <>
      <SEO
        title="Excel to PDF Converter Online Free - XLSX to PDF | PDF Techno"
        description="Convert Excel files (XLS, XLSX) to PDF online for free. Fast, secure, and easy Excel to PDF converter. No registration required."
        keywords="Excel to PDF, XLSX to PDF, convert Excel to PDF, free Excel to PDF converter, online Excel to PDF, batch Excel to PDF, secure Excel to PDF, spreadsheet to PDF, Excel PDF converter, Excel to PDF India, XLSX to PDF India, convert Excel to PDF India, free Excel to PDF converter India, online Excel to PDF India, batch Excel to PDF India, secure Excel to PDF India, spreadsheet to PDF India, Excel PDF converter India, Excel to PDF Hindi, Excel to PDF Delhi, Excel to PDF Mumbai, Excel to PDF Bangalore, Excel to PDF Chennai, Excel to PDF Kolkata, best Excel to PDF converter, accurate Excel to PDF conversion, no registration Excel to PDF, fast Excel to PDF online, Excel to PDF for students, Excel to PDF for business, Excel to PDF for government, Excel to PDF for legal, Excel to PDF for education, Excel to PDF for India, Excel to PDF free download, Excel to PDF app India, Excel to PDF software India, Excel to PDF tool India, Excel to PDF online free India, Excel to PDF converter online India, Excel to PDF without email, Excel to PDF no watermark, Excel to PDF unlimited, Excel to PDF high quality, Excel to PDF OCR India, scanned Excel to PDF India, XLSX to PDF converter India, XLS to PDF India, Excel to PDF converter Hindi, Excel to PDF converter Delhi, Excel to PDF converter Mumbai, Excel to PDF converter Bangalore, Excel to PDF converter Chennai, Excel to PDF converter Kolkata"
        canonical="https://www.pdftechno.com/excel-to-pdf"
        og={{
          title: "Excel to PDF Converter Online Free - XLSX to PDF | PDF Techno",
          description: "Convert Excel files (XLS, XLSX) to PDF online for free. Fast, secure, and easy Excel to PDF converter. No registration required.",
          image: "/static/assets/excel-to-pdf-og.webp",
          url: "https://www.pdftechno.com/excel-to-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "Excel to PDF Converter Online Free - PDF Techno",
          description: "Convert Excel files (XLS, XLSX) to PDF online for free. Fast, secure, and easy Excel to PDF converter.",
          image: "/static/assets/excel-to-pdf-twitter.webp",
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
        <ExcelToPdfConverter/>
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}