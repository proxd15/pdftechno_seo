"use client"

import Script from 'next/script';
import PDFMerger from '@/components/tools/PDFMerger';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import PDFRotator from '@/components/tools/PDFRotator';
import PDFSplitter from '@/components/tools/PDFSplitter';
import PDFWatermark from '@/components/tools/PDFWatermark';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const WordToPdfConverter = dynamic(() => import('@/components/tools/WordToPdfConverter'), { ssr: false });

export default function PDFMergePage() {
  return (
    <>
      <SEO
        title="Word to PDF Converter Online Free - DOCX to PDF | PDF Techno"
        description="Convert Word documents (DOC, DOCX) to PDF online for free. Fast, secure, and easy Word to PDF converter. No registration required."
        keywords="Word to PDF, DOCX to PDF, convert Word to PDF, free Word to PDF converter, online Word to PDF, batch Word to PDF, secure Word to PDF, document to PDF, Word PDF converter, Word to PDF India, DOCX to PDF India, convert Word to PDF India, free Word to PDF converter India, online Word to PDF India, batch Word to PDF India, secure Word to PDF India, document to PDF India, Word PDF converter India, Word to PDF Hindi, Word to PDF Delhi, Word to PDF Mumbai, Word to PDF Bangalore, Word to PDF Chennai, Word to PDF Kolkata, best Word to PDF converter, accurate Word to PDF conversion, no registration Word to PDF, fast Word to PDF online, Word to PDF for students, Word to PDF for business, Word to PDF for government, Word to PDF for legal, Word to PDF for education, Word to PDF for India, Word to PDF free download, Word to PDF app India, Word to PDF software India, Word to PDF tool India, Word to PDF online free India, Word to PDF converter online India, Word to PDF without email, Word to PDF no watermark, Word to PDF unlimited, Word to PDF high quality, Word to PDF OCR India, scanned Word to PDF India, DOCX to PDF converter India, DOC to PDF India, Word to PDF converter Hindi, Word to PDF converter Delhi, Word to PDF converter Mumbai, Word to PDF converter Bangalore, Word to PDF converter Chennai, Word to PDF converter Kolkata"
        canonical="https://www.pdftechno.com/word-to-pdf"
        og={{
          title: "Word to PDF Converter Online Free - DOCX to PDF | PDF Techno",
          description: "Convert Word documents (DOC, DOCX) to PDF online for free. Fast, secure, and easy Word to PDF converter. No registration required.",
          image: "/static/assets/word-to-pdf-og.webp",
          url: "https://www.pdftechno.com/word-to-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "Word to PDF Converter Online Free - PDF Techno",
          description: "Convert Word documents (DOC, DOCX) to PDF online for free. Fast, secure, and easy Word to PDF converter.",
          image: "/static/assets/word-to-pdf-twitter.webp",
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
        <WordToPdfConverter/>
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}