// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PdfToWordConverter = dynamic(() => import('@/components/tools/PdfToWordConverter'), { ssr: false });

export default function PDFtoWord() {
  return (
    <>
      <SEO
        title="PDF to Word Converter Online Free - Convert PDF to DOCX | PDF Techno"
        description="Convert PDF to Word (DOCX) online for free. Fast, secure, and accurate PDF to Word converter. No registration required."
        keywords="PDF to Word, convert PDF to Word, PDF to DOCX, free PDF to Word converter, online PDF to Word, batch PDF to Word, secure PDF to Word, extract text from PDF, PDF Word converter, PDF to Word India, convert PDF to Word India, PDF to DOCX India, free PDF to Word converter India, online PDF to Word India, batch PDF to Word India, secure PDF to Word India, extract text from PDF India, PDF Word converter India, PDF to Word Hindi, PDF to Word Delhi, PDF to Word Mumbai, PDF to Word Bangalore, PDF to Word Chennai, PDF to Word Kolkata, best PDF to Word converter, accurate PDF to Word conversion, no registration PDF to Word, fast PDF to Word online, PDF to Word for students, PDF to Word for business, PDF to Word for government, PDF to Word for legal, PDF to Word for education, PDF to Word for India, PDF to Word free download, PDF to Word app India, PDF to Word software India, PDF to Word tool India, PDF to Word online free India, PDF to Word converter online India, PDF to Word without email, PDF to Word no watermark, PDF to Word unlimited, PDF to Word high quality, PDF to Word OCR India, scanned PDF to Word India, PDF to Word DOCX India, PDF to Word DOC India, PDF to Word converter Hindi, PDF to Word converter Delhi, PDF to Word converter Mumbai, PDF to Word converter Bangalore, PDF to Word converter Chennai, PDF to Word converter Kolkata"
        canonical="https://www.pdftechno.com/pdf-to-word"
        og={{
          title: "PDF to Word Converter Online Free - Convert PDF to DOCX | PDF Techno",
          description: "Convert PDF to Word (DOCX) online for free. Fast, secure, and accurate PDF to Word converter. No registration required.",
          image: "/static/assets/pdf-to-word-og.webp",
          url: "https://www.pdftechno.com/pdf-to-word",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "PDF to Word Converter Online Free - PDF Techno",
          description: "Convert PDF to Word (DOCX) online for free. Fast, secure, and accurate PDF to Word converter.",
          image: "/static/assets/pdf-to-word-twitter.webp",
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
        <PdfToWordConverter />
        
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}