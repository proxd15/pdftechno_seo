// app/[locale]/(tools)/compress-pdf/page.js
"use client"

import Script from 'next/script';
import DragOverlay from '@/components/tools_utility/DragOverlay';
import PDFUnlock from '@/components/tools/PDFUnlock';

export default function PDFUnlocker() {
  return (
    <>
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
        <PDFUnlock />
        
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}