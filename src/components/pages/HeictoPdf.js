'use client';

import Script from 'next/script';
import dynamic from 'next/dynamic';
import DragOverlay from '@/components/tools_utility/DragOverlay';

// const HEICToPdfConverter = dynamic(() => import('@/components/tools/HEICToPdfConverter'), { ssr: false });

export default function HeictoPdf() {
  return (
    <>
      
      <main className="container mx-auto px-4 py-8 bg-white min-h-screen">
        {/* <HEICToPdfConverter /> */}
      </main>
      
      {/* Drag and drop overlay */}
      <DragOverlay />
    </>
  );
}