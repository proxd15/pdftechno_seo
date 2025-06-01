// app/[locale]/HomeClient.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/i18n';
import PDFTools from '@/components/layout/PDFTools';
import TestimonialsSection from '@/components/layout/TestimonialsSection';

export default function HomeClient() {
  const { t, getLocalizedHref } = useI18n();

  return (
    <>
      {/* Header */}
      <PDFTools />
      <TestimonialsSection />
    </>
  );
}