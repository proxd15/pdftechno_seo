// src/components/layout/Footer.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { useI18n } from '@/i18n';

export default function Footer() {
  const { t, locale, changeLocale } = useI18n();
  const currentYear = new Date().getFullYear();

  // Helper to get localized href
  const getLocalizedHref = (href) => {
    return `/${locale}${href === '/' ? '' : href}`;
  };

  return (
    <footer className="bg-[#F3E6E6] from-gray-900 to-gray-800 text-black">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
          {/* Column 1: Logo and Description */}
          <div className="space-y-4">
            <Link href={'/'} className="inline-block">
              <Image
                src="/images/logo_pdftechno.png"
                alt="PDF Techno"
                width={160}
                height={50}
                className="mb-3 p-1 rounded"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/160x50?text=PDF+Techno";
                }}
              />
            </Link>
            <p className="text-[#787878] text-sm">
              {t('footer.companyDescription')}
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="https://www.facebook.com/pdftechno.in" target='_blank' className="bg-red-600 hover:bg-red-700 h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300">
                <FaFacebookF color='#fff' />
              </a>
              <a href="https://www.instagram.com/pdftechno/" target='_blank' className="bg-red-600 hover:bg-red-700 h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300">
                <FaInstagram color='#fff' />
              </a>
              <a href="https://x.com/pdftechno" target='_blank' className="bg-red-600 hover:bg-red-700 h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300">
                <FaTwitter color='#fff' />
              </a>
              <a href="https://www.linkedin.com/company/pdftechno/posts/?feedView=all" target='_blank' className="bg-red-600 hover:bg-red-700 h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300">
                <FaLinkedinIn color='#fff' />
              </a>
              <a href="https://www.youtube.com/channel/UCNi6IstqvPMo_yev9Ze7d5A" target='_blank' className="bg-red-600 hover:bg-red-700 h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-300">
                <FaYoutube color='#fff' />
              </a>
            </div>
            
            <div className="mt-4">
              <select 
                className="bg-[#DA1F10] text-white border border-none rounded px-3 py-2 w-full"
                value={locale}
                onChange={(e) => changeLocale(e.target.value)}
              >
                <option value="en">{t('navbar.languages.en')}</option>
                <option value="es">{t('navbar.languages.es')}</option>
                <option value="fr">{t('navbar.languages.fr')}</option>
              </select>
            </div>
          </div>
          
          {/* Column 2: Popular Tools */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-black">{t('footer.popularTools')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={'/merge-pdf'} className="text-[#787878] hover:text-red-500 transition-colors duration-300">
                  {t('navbar.organize.merge')}
                </Link>
              </li>
              <li>
                <Link href={'/compress-pdf'} className="text-[#787878] hover:text-red-500 transition-colors duration-300">
                  {t('navbar.optimize.compress')}
                </Link>
              </li>
              <li>
                <Link href={'/pdf-to-word'} className="text-[#787878] hover:text-red-500 transition-colors duration-300">
                  {t('navbar.convertFrom.word')}
                </Link>
              </li>
              <li>
                <Link href={'/sign-pdf'} className="text-[#787878] hover:text-red-500 transition-colors duration-300">
                  {t('navbar.security.sign')}
                </Link>
              </li>
              <li>
                <Link href={'/edit-pdf'} className="text-[#787878] hover:text-red-500 transition-colors duration-300">
                  {t('navbar.edit.edit')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Company */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-black">{t('footer.company')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href={'/about'} className="text-[#787878] hover:text-red-500 transition-colors duration-300">
                  {t('footer.aboutUs')}
                </Link>
              </li>
              <li>
                <Link href={'/contact'} className="text-[#787878] hover:text-red-500 transition-colors duration-300">
                  {t('footer.contact')}
                </Link>
              </li>
              <li>
                <Link href={'/terms'} className="text-[#787878] hover:text-red-500 transition-colors duration-300">
                  {t('footer.termsOfService')}
                </Link>
              </li>
              <li>
                <Link href={'/privacy'} className="text-[#787878] hover:text-red-500 transition-colors duration-300">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 4: Support */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-black">Support</h3>
            <p className="text-[#787878] mb-4">Need help? Contact our support team.</p>
            <Link 
              href={'/contact'} 
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded inline-block transition-colors duration-300"
            >
              Contact Us
            </Link>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm">
            {t('footer.copyright').replace('{year}', currentYear)} 
            <span className="ml-2">Made in India 🇮🇳</span>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link href={'/terms'} className="text-gray-400 hover:text-black text-sm">
              Terms and Conditions
            </Link>
            <Link href={'/privacy'} className="text-gray-400 hover:text-black text-sm">
              Privacy Policy
            </Link>
            <Link href={'/cookie-policy'} className="text-gray-400 hover:text-black text-sm">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}