// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PDFToImage = dynamic(() => import('@/components/tools/PDFToImage'), { ssr: false });

export default function PDFToImagePage() {
  return (
    <>
      <SEO
        title="PDF to Image Converter Online Free - PDF to JPG, PNG | PDF Techno"
        description="Convert PDF to images (JPG, PNG) online for free. Fast, secure, and easy PDF to image converter. No registration required."
        keywords="PDF to image, PDF to JPG, PDF to PNG, convert PDF to image, free PDF to image converter, online PDF to image, batch PDF to image, secure PDF to image, extract images from PDF, PDF image converter, PDF to image India, PDF to JPG India, PDF to PNG India, convert PDF to image India, free PDF to image converter India, online PDF to image India, batch PDF to image India, secure PDF to image India, extract images from PDF India, PDF image converter India, PDF to image Hindi, PDF to image Delhi, PDF to image Mumbai, PDF to image Bangalore, PDF to image Chennai, PDF to image Kolkata, best PDF to image converter, accurate PDF to image conversion, no registration PDF to image, fast PDF to image online, PDF to image for students, PDF to image for business, PDF to image for government, PDF to image for legal, PDF to image for education, PDF to image for India, PDF to image free download, PDF to image app India, PDF to image software India, PDF to image tool India, PDF to image online free India, PDF to image converter online India, PDF to image without email, PDF to image no watermark, PDF to image unlimited, PDF to image high quality, PDF to image OCR India, scanned PDF to image India, PDF to JPG converter India, PDF to PNG converter India, PDF to image converter Hindi, PDF to image converter Delhi, PDF to image converter Mumbai, PDF to image converter Bangalore, PDF to image converter Chennai, PDF to image converter Kolkata"
        canonical="https://www.pdftechno.com/pdf-to-image"
        og={{
          title: "PDF to Image Converter Online Free - PDF to JPG, PNG | PDF Techno",
          description: "Convert PDF to images (JPG, PNG) online for free. Fast, secure, and easy PDF to image converter. No registration required.",
          image: "/static/assets/pdf-to-image-og.webp",
          url: "https://www.pdftechno.com/pdf-to-image",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "PDF to Image Converter Online Free - PDF Techno",
          description: "Convert PDF to images (JPG, PNG) online for free. Fast, secure, and easy PDF to image converter.",
          image: "/static/assets/pdf-to-image-twitter.webp",
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
        <PDFToImage/>
        
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}