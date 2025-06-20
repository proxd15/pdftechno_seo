// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PDFOCR = dynamic(() => import('@/components/tools/PDFOCR'), { ssr: false });

export default function OCRPDFPage() {
  return (
    <>
      <SEO
        title="OCR PDF Online Free - Convert Scanned PDF to Text | PDF Techno"
        description="Convert scanned PDF to searchable text with OCR online for free. Fast, secure, and accurate OCR PDF tool. No registration required."
        keywords="OCR PDF, scanned PDF to text, PDF OCR, convert scanned PDF, free OCR PDF, online OCR PDF, batch OCR PDF, secure OCR PDF, extract text from PDF, PDF OCR converter, OCR PDF India, scanned PDF to text India, PDF OCR India, convert scanned PDF India, free OCR PDF India, online OCR PDF India, batch OCR PDF India, secure OCR PDF India, extract text from PDF India, PDF OCR converter India, OCR PDF Hindi, OCR PDF Delhi, OCR PDF Mumbai, OCR PDF Bangalore, OCR PDF Chennai, OCR PDF Kolkata, best OCR PDF tool, accurate OCR PDF conversion, no registration OCR PDF, fast OCR PDF online, OCR PDF for students, OCR PDF for business, OCR PDF for government, OCR PDF for legal, OCR PDF for education, OCR PDF for India, OCR PDF free download, OCR PDF app India, OCR PDF software India, OCR PDF tool India, OCR PDF online free India, OCR PDF converter online India, OCR PDF without email, OCR PDF no watermark, OCR PDF unlimited, OCR PDF high quality, OCR PDF OCR India, scanned OCR PDF India, PDF OCR converter Hindi, PDF OCR converter Delhi, PDF OCR converter Mumbai, PDF OCR converter Bangalore, PDF OCR converter Chennai, PDF OCR converter Kolkata"
        canonical="https://www.pdftechno.com/ocr-pdf"
        og={{
          title: "OCR PDF Online Free - Convert Scanned PDF to Text | PDF Techno",
          description: "Convert scanned PDF to searchable text with OCR online for free. Fast, secure, and accurate OCR PDF tool. No registration required.",
          image: "/static/assets/ocr-pdf-og.webp",
          url: "https://www.pdftechno.com/ocr-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "OCR PDF Online Free - PDF Techno",
          description: "Convert scanned PDF to searchable text with OCR online for free. Fast, secure, and accurate OCR PDF tool.",
          image: "/static/assets/ocr-pdf-twitter.webp",
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
        <PDFOCR />
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}