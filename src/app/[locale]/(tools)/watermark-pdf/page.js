"use client"

import Script from 'next/script';
import PDFMerger from '@/components/tools/PDFMerger';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import PDFRotator from '@/components/tools/PDFRotator';
import PDFSplitter from '@/components/tools/PDFSplitter';
import dynamic from 'next/dynamic';
import SEO from '@/components/layout/SEO';

const PDFWatermark = dynamic(() => import('@/components/tools/PDFWatermark'), { ssr: false });

export default function PDFMergePage() {
  return (
    <>
      <SEO
        title="Watermark PDF Online Free - Add Text or Image Watermark | PDF Techno"
        description="Add watermark to PDF files online for free. Insert text or image watermark. Fast, secure, and easy PDF watermark tool. No registration required."
        keywords="watermark PDF, add watermark to PDF, PDF watermark tool, text watermark PDF, image watermark PDF, free PDF watermark, online PDF watermark, batch PDF watermark, secure PDF watermark, insert watermark PDF, watermark PDF online India, PDF watermark India, add watermark to PDF India, free PDF watermark India, PDF watermark tool India, watermark PDF Hindi, watermark PDF Delhi, watermark PDF Mumbai, watermark PDF Bangalore, watermark PDF Chennai, watermark PDF Kolkata, PDF watermarking, PDF watermark software, PDF watermark app, PDF watermark generator, PDF watermark remover, PDF watermark editor, PDF watermark stamp, PDF watermark batch, PDF watermark secure, PDF watermark protection, PDF watermark customization, PDF watermark transparency, PDF watermark opacity, PDF watermark color, PDF watermark font, PDF watermark size, PDF watermark position, PDF watermark rotation, PDF watermark layer, PDF watermark overlay, PDF watermark background, PDF watermark foreground, PDF watermark logo, PDF watermark signature, PDF watermark brand, PDF watermark copyright, PDF watermark confidential, PDF watermark draft, PDF watermark sample, PDF watermark template, PDF watermark design, PDF watermark style, PDF watermark format, PDF watermark pattern, PDF watermark India online, PDF watermark India free, PDF watermark India tool, PDF watermark India app, PDF watermark India software, PDF watermark India generator, PDF watermark India remover, PDF watermark India editor, PDF watermark India stamp, PDF watermark India batch, PDF watermark India secure, PDF watermark India protection, PDF watermark India customization, PDF watermark India transparency, PDF watermark India opacity, PDF watermark India color, PDF watermark India font, PDF watermark India size, PDF watermark India position, PDF watermark India rotation, PDF watermark India layer, PDF watermark India overlay, PDF watermark India background, PDF watermark India foreground, PDF watermark India logo, PDF watermark India signature, PDF watermark India brand, PDF watermark India copyright, PDF watermark India confidential, PDF watermark India draft, PDF watermark India sample, PDF watermark India template, PDF watermark India design, PDF watermark India style, PDF watermark India format, PDF watermark India pattern"
        canonical="https://www.pdftechno.com/watermark-pdf"
        og={{
          title: "Watermark PDF Online Free - Add Text or Image Watermark | PDF Techno",
          description: "Add watermark to PDF files online for free. Insert text or image watermark. Fast, secure, and easy PDF watermark tool. No registration required.",
          image: "/static/assets/watermark-pdf-og.webp",
          url: "https://www.pdftechno.com/watermark-pdf",
          siteName: "PDF Techno",
          locale: "en_US"
        }}
        twitter={{
          card: "summary_large_image",
          title: "Watermark PDF Online Free - PDF Techno",
          description: "Add watermark to PDF files online for free. Insert text or image watermark. Fast, secure, and easy PDF watermark tool.",
          image: "/static/assets/watermark-pdf-twitter.webp",
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
        <PDFWatermark/>
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}