'use client';

import Script from 'next/script';
import dynamic from 'next/dynamic';
import DragOverlay from '@/components/tools_utility/DragOverlay';

// const ImageToPdfConverter = dynamic(() => import('@/components/tools/ImageToPdfConverter'), { ssr: false });

export default function ImagetoPdf() {
  return (
    <>

            <main className="container mx-auto px-4 py-8 bg-white min-h-screen">
        {/* <ImageToPdfConverter /> */}
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}