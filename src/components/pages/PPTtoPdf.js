'use client';

import Script from 'next/script';
import dynamic from 'next/dynamic';
import DragOverlay from '@/components/tools_utility/DragOverlay';

const PowerPointToPdfConverter = dynamic(() => import('@/components/tools/PowerPointToPdfConverter'), { ssr: false });

export default function PPTtoPdf() {
  return (
    <>
      {/* Load PDF.js library and worker from CDN */}
      
      <main className="container mx-auto px-4 py-8 bg-white min-h-screen">
        <PowerPointToPdfConverter />
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}