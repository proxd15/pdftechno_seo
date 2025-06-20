// src/app/page.js
import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

export default function RootPage() {
  // Use server-side redirect for better SEO
  redirect(`/${defaultLocale}`);
}