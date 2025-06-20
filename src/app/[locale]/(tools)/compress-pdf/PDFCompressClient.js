// app/[locale]/(tools)/compress-pdf/PDFCompressClient.js
"use client"
import Script from 'next/script';
import dynamic from 'next/dynamic';
import DragOverlay from '@/components/tools_utility/DragOverlay';

const PDFCompressor = dynamic(() => import('@/components/tools/PDFCompressor'), { ssr: false });

export default function PDFCompressClient() {
  return (
    <>
      {/* Load PDF.js library from CDN */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          // Configure PDF.js worker
          if (typeof window !== 'undefined' && window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
          }
        }}
      />
      
      <PDFCompressor />
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}