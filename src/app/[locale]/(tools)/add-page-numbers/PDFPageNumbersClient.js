// app/[locale]/(tools)/add-page-numbers/PDFPageNumbersClient.js
"use client"
import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import dynamic from 'next/dynamic';

const PDFPageNumbering = dynamic(() => import('@/components/tools/PDFPageNumbering'), { ssr: false });

export default function PDFPageNumbersClient() {
  return (
    <>
      {/* Load PDF.js library and worker from CDN */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          // Configure PDF.js worker
          if (typeof window !== 'undefined' && window.pdfjsLib) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
            console.log('PDF.js loaded and worker configured successfully');
          }
        }}
      />
      
      <PDFPageNumbering />
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}