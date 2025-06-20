// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import PDFCompressor from '@/components/tools/PDFCompressor';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import DraggableGrid from '@/components/tools/DraggableGrid';
import PDFOrganizer from '@/components/tools/PDFOrganizer';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const ImageToPdfConverter = dynamic(() => import('@/components/tools/ImageToPdfConverter'), { ssr: false });

export default function PDFCompressPage() {
  return (
    <>
      <SEO
        title="Image to PDF Converter Online Free - JPG, PNG to PDF | PDF Techno"
        description="Convert images (JPG, PNG, BMP, GIF) to PDF online for free. Fast, secure, and easy image to PDF converter. No registration required."
        keywords="image to PDF, JPG to PDF, PNG to PDF, convert image to PDF, free image to PDF converter, online image to PDF, batch image to PDF, secure image to PDF, photo to PDF, image PDF converter, image to PDF India, JPG to PDF India, PNG to PDF India, convert image to PDF India, free image to PDF converter India, online image to PDF India, batch image to PDF India, secure image to PDF India, photo to PDF India, image PDF converter India, image to PDF Hindi, image to PDF Delhi, image to PDF Mumbai, image to PDF Bangalore, image to PDF Chennai, image to PDF Kolkata, picture to PDF, photo PDF maker, image PDF maker, image to PDF tool, image to PDF app, image to PDF software, image to PDF online free, image to PDF converter online, image to PDF merge, combine images to PDF, multiple images to PDF, image to PDF without watermark, image to PDF fast, image to PDF secure, image to PDF free download, image to PDF for mobile, image to PDF for PC, image to PDF for Mac, image to PDF for Android, image to PDF for iPhone, image to PDF for Windows, image to PDF for Linux, image to PDF for India, image to PDF converter India, image to PDF online India, image to PDF tool India, image to PDF app India, image to PDF software India, image to PDF merge India, combine images to PDF India, multiple images to PDF India, image to PDF without watermark India, image to PDF fast India, image to PDF secure India, image to PDF free download India, image to PDF for mobile India, image to PDF for PC India, image to PDF for Mac India, image to PDF for Android India, image to PDF for iPhone India, image to PDF for Windows India, image to PDF for Linux India"
        canonical="https://www.pdftechno.com/image-to-pdf"
        og={{
          title: "Image to PDF Converter Online Free - JPG, PNG to PDF | PDF Techno",
          description: "Convert images (JPG, PNG, BMP, GIF) to PDF online for free. Fast, secure, and easy image to PDF converter. No registration required.",
          image: "/static/assets/image-to-pdf-og.webp",
          url: "https://www.pdftechno.com/image-to-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "Image to PDF Converter Online Free - PDF Techno",
          description: "Convert images (JPG, PNG, BMP, GIF) to PDF online for free. Fast, secure, and easy image to PDF converter.",
          image: "/static/assets/image-to-pdf-twitter.webp",
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
        <ImageToPdfConverter />
        
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}