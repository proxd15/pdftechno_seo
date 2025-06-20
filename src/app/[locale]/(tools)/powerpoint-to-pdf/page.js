"use client"

import Script from 'next/script';
import PDFMerger from '@/components/tools/PDFMerger';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import PDFRotator from '@/components/tools/PDFRotator';
import PDFSplitter from '@/components/tools/PDFSplitter';
import PDFWatermark from '@/components/tools/PDFWatermark';
import WordToPdfConverter from '@/components/tools/WordToPdfConverter';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PowerPointToPdfConverter = dynamic(() => import('@/components/tools/PowerPointToPdfConverter'), { ssr: false });

export default function PowerPointToPDFPage() {
  return (
    <>
      <SEO
        title="PowerPoint to PDF Converter Online Free - PPTX to PDF | PDF Techno"
        description="Convert PowerPoint presentations (PPT, PPTX) to PDF online for free. Fast, secure, and easy PowerPoint to PDF converter. No registration required."
        keywords="PowerPoint to PDF, PPTX to PDF, convert PowerPoint to PDF, free PowerPoint to PDF converter, online PowerPoint to PDF, batch PowerPoint to PDF, secure PowerPoint to PDF, presentation to PDF, PowerPoint PDF converter, PowerPoint to PDF India, PPTX to PDF India, convert PowerPoint to PDF India, free PowerPoint to PDF converter India, online PowerPoint to PDF India, batch PowerPoint to PDF India, secure PowerPoint to PDF India, presentation to PDF India, PowerPoint PDF converter India, PowerPoint to PDF Hindi, PowerPoint to PDF Delhi, PowerPoint to PDF Mumbai, PowerPoint to PDF Bangalore, PowerPoint to PDF Chennai, PowerPoint to PDF Kolkata, best PowerPoint to PDF converter, accurate PowerPoint to PDF conversion, no registration PowerPoint to PDF, fast PowerPoint to PDF online, PowerPoint to PDF for students, PowerPoint to PDF for business, PowerPoint to PDF for government, PowerPoint to PDF for legal, PowerPoint to PDF for education, PowerPoint to PDF for India, PowerPoint to PDF free download, PowerPoint to PDF app India, PowerPoint to PDF software India, PowerPoint to PDF tool India, PowerPoint to PDF online free India, PowerPoint to PDF converter online India, PowerPoint to PDF without email, PowerPoint to PDF no watermark, PowerPoint to PDF unlimited, PowerPoint to PDF high quality, PowerPoint to PDF OCR India, scanned PowerPoint to PDF India, PPTX to PDF converter India, PPT to PDF India, PowerPoint to PDF converter Hindi, PowerPoint to PDF converter Delhi, PowerPoint to PDF converter Mumbai, PowerPoint to PDF converter Bangalore, PowerPoint to PDF converter Chennai, PowerPoint to PDF converter Kolkata"
        canonical="https://www.pdftechno.com/powerpoint-to-pdf"
        og={{
          title: "PowerPoint to PDF Converter Online Free - PPTX to PDF | PDF Techno",
          description: "Convert PowerPoint presentations (PPT, PPTX) to PDF online for free. Fast, secure, and easy PowerPoint to PDF converter. No registration required.",
          image: "/static/assets/powerpoint-to-pdf-og.webp",
          url: "https://www.pdftechno.com/powerpoint-to-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "PowerPoint to PDF Converter Online Free - PDF Techno",
          description: "Convert PowerPoint presentations (PPT, PPTX) to PDF online for free. Fast, secure, and easy PowerPoint to PDF converter.",
          image: "/static/assets/powerpoint-to-pdf-twitter.webp",
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
        <PowerPointToPdfConverter/>
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}