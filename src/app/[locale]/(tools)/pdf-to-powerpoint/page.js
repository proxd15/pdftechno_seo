// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PdfToPowerPointConverter = dynamic(() => import('@/components/tools/PdfToPowerPointConverter'), { ssr: false });

export default function PDFToPowerPointPage() {
  return (
    <>
      <SEO
        title="PDF to PowerPoint Converter Online Free - PDF to PPTX | PDF Techno"
        description="Convert PDF to PowerPoint (PPTX) online for free. Fast, secure, and easy PDF to PowerPoint converter. No registration required."
        keywords="PDF to PowerPoint, PDF to PPTX, convert PDF to PowerPoint, free PDF to PowerPoint converter, online PDF to PowerPoint, batch PDF to PowerPoint, secure PDF to PowerPoint, PDF PPT converter, PDF to PowerPoint India, PDF to PPTX India, convert PDF to PowerPoint India, free PDF to PowerPoint converter India, online PDF to PowerPoint India, batch PDF to PowerPoint India, secure PDF to PowerPoint India, PDF PPT converter India, PDF to PowerPoint Hindi, PDF to PowerPoint Delhi, PDF to PowerPoint Mumbai, PDF to PowerPoint Bangalore, PDF to PowerPoint Chennai, PDF to PowerPoint Kolkata, PDF to PPT, PDF to PPT converter, PDF to PPTX converter, PDF to PowerPoint tool, PDF to PowerPoint app, PDF to PowerPoint software, PDF to PowerPoint online free, PDF to PowerPoint converter online, PDF to PowerPoint merge, combine PDF to PowerPoint, multiple PDF to PowerPoint, PDF to PowerPoint without watermark, PDF to PowerPoint fast, PDF to PowerPoint secure, PDF to PowerPoint free download, PDF to PowerPoint for mobile, PDF to PowerPoint for PC, PDF to PowerPoint for Mac, PDF to PowerPoint for Android, PDF to PowerPoint for iPhone, PDF to PowerPoint for Windows, PDF to PowerPoint for Linux, PDF to PowerPoint for India, PDF to PowerPoint converter India, PDF to PowerPoint online India, PDF to PowerPoint tool India, PDF to PowerPoint app India, PDF to PowerPoint software India, PDF to PowerPoint merge India, combine PDF to PowerPoint India, multiple PDF to PowerPoint India, PDF to PowerPoint without watermark India, PDF to PowerPoint fast India, PDF to PowerPoint secure India, PDF to PowerPoint free download India, PDF to PowerPoint for mobile India, PDF to PowerPoint for PC India, PDF to PowerPoint for Mac India, PDF to PowerPoint for Android India, PDF to PowerPoint for iPhone India, PDF to PowerPoint for Windows India, PDF to PowerPoint for Linux India"
        canonical="https://www.pdftechno.com/pdf-to-powerpoint"
        og={{
          title: "PDF to PowerPoint Converter Online Free - PDF to PPTX | PDF Techno",
          description: "Convert PDF to PowerPoint (PPTX) online for free. Fast, secure, and easy PDF to PowerPoint converter. No registration required.",
          image: "/static/assets/pdf-to-powerpoint-og.webp",
          url: "https://www.pdftechno.com/pdf-to-powerpoint",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "PDF to PowerPoint Converter Online Free - PDF Techno",
          description: "Convert PDF to PowerPoint (PPTX) online for free. Fast, secure, and easy PDF to PowerPoint converter.",
          image: "/static/assets/pdf-to-powerpoint-twitter.webp",
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
        <PdfToPowerPointConverter />
        
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}