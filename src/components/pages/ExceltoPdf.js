'use client';

import Script from 'next/script';
import dynamic from 'next/dynamic';
import DragOverlay from '@/components/tools_utility/DragOverlay';

// const ExcelToPdfConverter = dynamic(() => import('@/components/tools/ExcelToPdfConverter'), { ssr: false });

export default function ExceltoPdf() {
  return (
    <>    
      <main className="container mx-auto px-4 py-8 bg-white min-h-screen">
        {/* <ExcelToPdfConverter /> */}
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}