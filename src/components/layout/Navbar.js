'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FaChevronDown, FaBars, FaTimes, FaUser } from 'react-icons/fa';
import { useI18n } from '@/i18n';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, right: 'auto' });
  const pathname = usePathname();
  const { t, locale, changeLocale, getLocalizedHref } = useI18n();
  const { isAuthenticated, user, logout } = useAuth();
  const profileDropdownRef = useRef(null);
  const logoutConfirmRef = useRef(null);
  const toolsMenuRef = useRef(null);
  const toolsButtonRef = useRef(null);
  const toolsMenuTimeout = useRef(null);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      // Close menus when resizing
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate menu position based on button position and viewport
  const calculateMenuPosition = () => {
    if (!toolsButtonRef.current) return;
    
    const buttonRect = toolsButtonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const menuWidth = 1200; // Default menu width
    const adjustedMenuWidth = Math.min(menuWidth, viewportWidth - 40); // 40px margin
    
    // Calculate ideal left position (center the menu under the button)
    const idealLeft = buttonRect.left + (buttonRect.width / 2) - (adjustedMenuWidth / 2);
    
    // Ensure menu doesn't go outside viewport
    const minLeft = 30; // 20px from left edge
    const maxLeft = viewportWidth - adjustedMenuWidth - 20; // 20px from right edge
    
    const finalLeft = Math.max(minLeft, Math.min(idealLeft, maxLeft));
    
    setMenuPosition({
      left: finalLeft,
      right: 'auto'
    });
  };

  // Handle tools menu hover with delay
  const handleToolsMenuEnter = () => {
    if (toolsMenuTimeout.current) {
      clearTimeout(toolsMenuTimeout.current);
    }
    calculateMenuPosition();
    setIsToolsMenuOpen(true);
  };

  const handleToolsMenuLeave = () => {
    toolsMenuTimeout.current = setTimeout(() => {
      setIsToolsMenuOpen(false);
    }, 150); // 150ms delay before closing
  };

  const handleToolsMenuMouseEnter = () => {
    if (toolsMenuTimeout.current) {
      clearTimeout(toolsMenuTimeout.current);
    }
  };

  const handleToolsMenuMouseLeave = () => {
    toolsMenuTimeout.current = setTimeout(() => {
      setIsToolsMenuOpen(false);
    }, 150);
  };

  // When mobile menu opens, prevent body scrolling
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      
      if (logoutConfirmRef.current && !logoutConfirmRef.current.contains(event.target)) {
        setShowLogoutConfirm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toolsMenuTimeout.current) {
        clearTimeout(toolsMenuTimeout.current);
      }
    };
  }, []);

  // Close mobile menu when a link is clicked
  const handleLinkClick = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Show logout confirmation
  const confirmLogout = () => {
    setIsProfileMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      // Redirect handled in logout function
    } catch (error) {
      console.error('Logout failed:', error);
      // You could add error handling here
    }
  };

  // Cancel logout
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      {/* Add custom CSS for animations */}
      <style jsx>{`
        .mobile-menu-overlay {
          transition: opacity 0.3s ease-in-out;
        }
        
        .mobile-menu-panel {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .mobile-menu-enter {
          transform: translateX(-100%);
        }
        
        .mobile-menu-enter-active {
          transform: translateX(0);
        }
        
        .mobile-menu-exit {
          transform: translateX(0);
        }
        
        .mobile-menu-exit-active {
          transform: translateX(-100%);
        }
        
        .mobile-menu-content {
          animation: slideInContent 0.4s ease-out 0.1s both;
        }
        
        .tools-dropdown {
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }
        
        .tools-dropdown-enter {
          opacity: 0;
          transform: translateY(-10px);
        }
        
        .tools-dropdown-enter-active {
          opacity: 1;
          transform: translateY(0);
        }
        
        @keyframes slideInContent {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      <header className="bg-white fixed shadow-sm py-[5px] z-50 w-full">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className='flex gap-16'>
            <Link href={getLocalizedHref('/')} className="flex items-center z-10">
              <Image
                src="/images/logo_pdf.png"
                alt="PDF Techno"
                width={130}
                height={40}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/130x40?text=PDF+Techno";
                }}
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-16">
              <div className="flex items-center">
                <Link
                  href={getLocalizedHref('/')}
                  className="px-4 py-2 text-gray-800 hover:text-red-600"
                >
                  {t('navbar.home')}
                </Link>
                <Link
                  href={getLocalizedHref('/merge-pdf')}
                  className="px-4 py-2 text-gray-800 hover:text-red-600"
                >
                  {t('navbar.merge')}
                </Link>

                <Link
                  href={getLocalizedHref('/compress-pdf')}
                  className="px-4 py-2 text-gray-800 hover:text-red-600"
                >
                  {t('navbar.compress')}
                </Link>

                <div
                  ref={toolsButtonRef}
                  className="relative"
                  onMouseEnter={handleToolsMenuEnter}
                  onMouseLeave={handleToolsMenuLeave}
                >
                  <button
                    className="flex items-center cursor-pointer px-4 py-2 text-gray-800 hover:text-red-600"
                  >
                    {t('navbar.allTools')} <FaChevronDown className="ml-1 h-3 w-3" />
                  </button>

                  {/* Tools dropdown menu */}
                  {isToolsMenuOpen && (
                    <div 
                      ref={toolsMenuRef}
                      className={`tools-dropdown fixed mt-1 bg-white px-4 py-4 border border-gray-200 shadow-lg rounded z-50 ${
                        isToolsMenuOpen ? 'tools-dropdown-enter-active' : 'tools-dropdown-enter'
                      }`}
                      style={{
                        left: `${menuPosition.left}px`,
                        right: menuPosition.right,
                        width: `${Math.min(1300, window.innerWidth - 40)}px`,
                        maxWidth: '95vw'
                      }}
                      onMouseEnter={handleToolsMenuMouseEnter}
                      onMouseLeave={handleToolsMenuMouseLeave}
                    >
                      <div className="grid grid-cols-6 gap-0">
                        {/* Tool Categories */}
                        <div className="col-span-6 grid grid-cols-6">
                          {/* Column 1: Organize PDF */}
                          <div className="p-4 flex flex-col ">
                            <h3 className="font-bold text-gray-800 mb-3">{t('navbar.organize.title')}</h3>
                            <ul className="space-y-3">
                              <li>
                                <Link href={getLocalizedHref('/merge-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/merge.png"
                                      width={25}
                                      height={25}
                                      alt="Merge Icon"
                                    />
                                  </span>
                                  {t('navbar.organize.merge')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/split-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/split.png"
                                      width={25}
                                      height={25}
                                      alt="Split Icon"
                                    />
                                  </span>
                                  {t('navbar.organize.split')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/rotate-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/rotate.png"
                                      width={25}
                                      height={25}
                                      alt="Rotate Icon"
                                    />
                                  </span>
                                  {t('navbar.organize.rotate')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/organize-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/organize.png"
                                      width={25}
                                      height={25}
                                      alt="Organize Icon"
                                    />
                                  </span>
                                  {t('navbar.organize.organize')}
                                </Link>
                              </li>
                            </ul>
                          </div>

                          {/* Column 2: Convert to PDF */}
                          <div className="p-4 flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-3">{t('navbar.convertTo.title')}</h3>
                            <ul className="space-y-3">
                              <li>
                                <Link href={getLocalizedHref('/word-to-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/wordtopdf.png"
                                      width={25}
                                      height={25}
                                      alt="Word to PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.convertTo.word')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/excel-to-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/exceltopdf.png"
                                      width={25}
                                      height={25}
                                      alt="Excel to PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.convertTo.excel')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/powerpoint-to-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/ppttopdf.png"
                                      width={25}
                                      height={25}
                                      alt="Powerpoint to PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.convertTo.powerpoint')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/image-to-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/imgtopdf.png"
                                      width={25}
                                      height={25}
                                      alt="Image to PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.convertTo.image')}
                                </Link>
                              </li>
                            </ul>
                          </div>

                          {/* Column 3: Convert from PDF */}
                          <div className="p-4 flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-3">{t('navbar.convertFrom.title')}</h3>
                            <ul className="space-y-3">
                              <li>
                                <Link href={getLocalizedHref('/pdf-to-word')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/pdftoword.png"
                                      width={25}
                                      height={25}
                                      alt="PDF to Word Icon"
                                    />
                                  </span>
                                  {t('navbar.convertFrom.word')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/pdf-to-powerpoint')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/pdftoppt.png"
                                      width={25}
                                      height={25}
                                      alt="PDF to Powerpoint Icon"
                                    />
                                  </span>
                                  {t('navbar.convertFrom.powerpoint')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/pdf-to-image')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/pdftoimg.png"
                                      width={25}
                                      height={25}
                                      alt="PDF to Image Icon"
                                    />
                                  </span>
                                  {t('navbar.convertFrom.image')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/pdf-to-excel')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/pdf_to_excel.svg"
                                      width={25}
                                      height={25}
                                      alt="PDF to Excel Icon"
                                    />
                                  </span>
                                  {t('navbar.convertFrom.excel')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/pdf-to-pdfa')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/pdftoa.png"
                                      width={25}
                                      height={25}
                                      alt="PDF to PDF/A Icon"
                                    />
                                  </span>
                                  {t('navbar.convertFrom.pdfa')}
                                </Link>
                              </li>
                            </ul>
                          </div>

                          {/* Column 4: PDF Security */}
                          <div className="p-4 flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-3">{t('navbar.security.title')}</h3>
                            <ul className="space-y-3">
                              <li>
                                <Link href={getLocalizedHref('/unlock-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/unllock.png"
                                      width={25}
                                      height={25}
                                      alt="Unlock PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.security.unlock')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/protect-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/protect.png"
                                      width={25}
                                      height={25}
                                      alt="Protect PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.security.protect')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/sign-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/signture.png"
                                      width={25}
                                      height={25}
                                      alt="Sign PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.security.sign')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/watermark-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/watermark.png"
                                      width={25}
                                      height={25}
                                      alt="Watermark PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.security.watermark')}
                                </Link>
                              </li>
                            </ul>
                          </div>

                          {/* Column 5: Optimize PDF */}
                          <div className="p-4 flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-3">{t('navbar.optimize.title')}</h3>
                            <ul className="space-y-3">
                              <li>
                                <Link href={getLocalizedHref('/compress-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/compress.png"
                                      width={25}
                                      height={25}
                                      alt="Compress PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.optimize.compress')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/repair-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/repair.png"
                                      width={25}
                                      height={25}
                                      alt="Repair PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.optimize.repair')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/ocr-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/pdftoocr.png"
                                      width={25}
                                      height={25}
                                      alt="OCR PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.optimize.ocr')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/scan-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/scanpdf.png"
                                      width={25}
                                      height={25}
                                      alt="Scan PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.optimize.scan')}
                                </Link>
                              </li>
                            </ul>
                          </div>

                          {/* Column 6: Edit PDF */}
                          <div className="p-4 flex flex-col">
                            <h3 className="font-bold text-gray-800 mb-3">{t('navbar.edit.title')}</h3>
                            <ul className="space-y-3">
                              <li>
                                <Link href={getLocalizedHref('/add-page-numbers')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/Frame.png"
                                      width={25}
                                      height={25}
                                      alt="Page Numbers Icon"
                                    />
                                  </span>
                                  {t('navbar.edit.pageNumbers')}
                                </Link>
                              </li>
                              <li>
                                <Link href={getLocalizedHref('/edit-pdf')} className="flex items-center text-gray-700 hover:text-red-600">
                                  <span className="w-5 h-5 mr-2 inline-block">
                                    <Image
                                      src="/images/icons/edit.png"
                                      width={25}
                                      height={25}
                                      alt="Edit PDF Icon"
                                    />
                                  </span>
                                  {t('navbar.edit.edit')}
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
              </div>
            </div>
            </div>

            {/* Desktop Right side with Profile dropdown instead of login/signup */}
            <div className="hidden lg:flex items-center">
              <select
                className="mr-4 text-black cursor-pointer border border-gray-300 rounded px-2 py-1"
                value={locale}
                onChange={(e) => changeLocale(e.target.value)}
              >
                <option value="en">{t('navbar.languages.en')}</option>
                <option value="es">{t('navbar.languages.es')}</option>
                <option value="fr">{t('navbar.languages.fr')}</option>
              </select>

              {isAuthenticated ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    <FaUser className="h-5 w-5 text-red-600" />
                    <span className="ml-2">{user?.name || 'User'}</span>
                    <FaChevronDown className="ml-1 h-3 w-3" />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <Link
                        href={getLocalizedHref('/profile')}
                        className="block px-4 py-2 cursor-pointer text-gray-700 hover:bg-gray-100 hover:text-red-600"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href={getLocalizedHref('/my-files')}
                        className="block px-4 py-2 text-gray-700 cursor-pointer hover:bg-gray-100 hover:text-red-600"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        My Files
                      </Link>
                      <button
                        onClick={confirmLogout}
                        className="block w-full text-left px-4 cursor-pointer py-2 text-gray-700 hover:bg-gray-100 hover:text-red-600"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href={getLocalizedHref('/login')}
                    className="px-4 py-2 text-red-600 hover:text-red-800"
                  >
                    {t('navbar.login')}
                  </Link>
                  <Link
                    href={getLocalizedHref('/register')}
                    className="ml-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    {t('navbar.signUp')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden z-10">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <FaTimes className="h-6 w-6 text-red-600" />
                ) : (
                  <FaBars className="h-6 w-6 text-red-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Left Slide Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 backdrop-filter backdrop-blur-md mobile-menu-overlay"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Slide Panel */}
            <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-xl mobile-menu-panel ${
              isMobileMenuOpen ? 'mobile-menu-enter-active' : 'mobile-menu-enter'
            }`}>
              {/* Header with close button */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center">
                  <Image
                    src="/images/logo_pdf.png"
                    alt="PDF Techno"
                    width={100}
                    height={30}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/100x30?text=PDF+Techno";
                    }}
                  />
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <FaTimes className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Menu Content */}
              <div className="h-full overflow-y-auto pb-20">
                <div className="mobile-menu-content p-4 space-y-6">
                  {/* Home Link */}
                  <Link
                    href={getLocalizedHref('/')}
                    className="block text-lg font-medium text-gray-800 hover:text-red-600 py-2 border-b border-gray-100"
                    onClick={handleLinkClick}
                  >
                    {t('navbar.home')}
                  </Link>

                  {/* User Profile Section */}
                  {isAuthenticated && (
                    <div className="py-4 border-b border-gray-200">
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                          <FaUser className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{user?.name || 'User'}</div>
                          <div className="text-sm text-gray-600">Logged in</div>
                        </div>
                      </div>
                      <div className="space-y-2 ml-2">
                        <Link
                          href={getLocalizedHref('/profile')}
                          className="block py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded px-2"
                          onClick={handleLinkClick}
                        >
                          Profile
                        </Link>
                        <Link
                          href={getLocalizedHref('/my-files')}
                          className="block py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded px-2"
                          onClick={handleLinkClick}
                        >
                          My Files
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left py-2 text-gray-700 hover:text-red-600 hover:bg-gray-50 rounded px-2"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Language Selector */}
                  <div className="py-4 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      className="w-full py-2 px-3 text-gray-800 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={locale}
                      onChange={(e) => {
                        changeLocale(e.target.value);
                      }}
                    >
                      <option value="en">{t('navbar.languages.en')}</option>
                      <option value="es">{t('navbar.languages.es')}</option>
                      <option value="fr">{t('navbar.languages.fr')}</option>
                    </select>
                  </div>

                  {/* Tools Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">All Tools</h3>
                    
                    {/* Organize PDF */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                        {t('navbar.organize.title')}
                      </h4>
                      <div className="space-y-1 ml-2">
                        <Link
                          href={getLocalizedHref('/merge-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/merge.png" width={20} height={20} alt="Merge" className="mr-3" />
                          {t('navbar.organize.merge')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/split-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/split.png" width={20} height={20} alt="Split" className="mr-3" />
                          {t('navbar.organize.split')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/rotate-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/rotate.png" width={20} height={20} alt="Rotate" className="mr-3" />
                          {t('navbar.organize.rotate')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/organize-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/organize.png" width={20} height={20} alt="Organize" className="mr-3" />
                          {t('navbar.organize.organize')}
                        </Link>
                      </div>
                    </div>

                    {/* Convert to PDF */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                        {t('navbar.convertTo.title')}
                      </h4>
                      <div className="space-y-1 ml-2">
                        <Link
                          href={getLocalizedHref('/word-to-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/wordtopdf.png" width={20} height={20} alt="Word to PDF" className="mr-3" />
                          {t('navbar.convertTo.word')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/excel-to-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/exceltopdf.png" width={20} height={20} alt="Excel to PDF" className="mr-3" />
                          {t('navbar.convertTo.excel')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/powerpoint-to-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/ppttopdf.png" width={20} height={20} alt="PowerPoint to PDF" className="mr-3" />
                          {t('navbar.convertTo.powerpoint')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/image-to-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/imgtopdf.png" width={20} height={20} alt="Image to PDF" className="mr-3" />
                          {t('navbar.convertTo.image')}
                        </Link>
                      </div>
                    </div>

                    {/* Convert from PDF */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                        {t('navbar.convertFrom.title')}
                      </h4>
                      <div className="space-y-1 ml-2">
                        <Link
                          href={getLocalizedHref('/pdf-to-word')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/pdftoword.png" width={20} height={20} alt="PDF to Word" className="mr-3" />
                          {t('navbar.convertFrom.word')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/pdf-to-powerpoint')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/pdftoppt.png" width={20} height={20} alt="PDF to PowerPoint" className="mr-3" />
                          {t('navbar.convertFrom.powerpoint')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/pdf-to-image')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/pdftoimg.png" width={20} height={20} alt="PDF to Image" className="mr-3" />
                          {t('navbar.convertFrom.image')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/pdf-to-excel')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/pdf_to_excel.svg" width={20} height={20} alt="PDF to Excel" className="mr-3" />
                          {t('navbar.convertFrom.excel')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/pdf-to-pdfa')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/pdftoa.png" width={20} height={20} alt="PDF to PDF/A" className="mr-3" />
                          {t('navbar.convertFrom.pdfa')}
                        </Link>
                      </div>
                    </div>

                    {/* PDF Security */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                        {t('navbar.security.title')}
                      </h4>
                      <div className="space-y-1 ml-2">
                        <Link
                          href={getLocalizedHref('/unlock-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/unllock.png" width={20} height={20} alt="Unlock PDF" className="mr-3" />
                          {t('navbar.security.unlock')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/protect-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/protect.png" width={20} height={20} alt="Protect PDF" className="mr-3" />
                          {t('navbar.security.protect')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/sign-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/signture.png" width={20} height={20} alt="Sign PDF" className="mr-3" />
                          {t('navbar.security.sign')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/watermark-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/watermark.png" width={20} height={20} alt="Watermark PDF" className="mr-3" />
                          {t('navbar.security.watermark')}
                        </Link>
                      </div>
                    </div>

                    {/* Optimize PDF */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                        {t('navbar.optimize.title')}
                      </h4>
                      <div className="space-y-1 ml-2">
                        <Link
                          href={getLocalizedHref('/compress-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/compress.png" width={20} height={20} alt="Compress PDF" className="mr-3" />
                          {t('navbar.optimize.compress')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/repair-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/repair.png" width={20} height={20} alt="Repair PDF" className="mr-3" />
                          {t('navbar.optimize.repair')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/ocr-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/pdftoocr.png" width={20} height={20} alt="OCR PDF" className="mr-3" />
                          {t('navbar.optimize.ocr')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/scan-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/scanpdf.png" width={20} height={20} alt="Scan PDF" className="mr-3" />
                          {t('navbar.optimize.scan')}
                        </Link>
                      </div>
                    </div>

                    {/* Edit PDF */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 text-sm uppercase tracking-wide">
                        {t('navbar.edit.title')}
                      </h4>
                      <div className="space-y-1 ml-2">
                        <Link
                          href={getLocalizedHref('/add-page-numbers')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/Frame.png" width={20} height={20} alt="Page Numbers" className="mr-3" />
                          {t('navbar.edit.pageNumbers')}
                        </Link>
                        <Link
                          href={getLocalizedHref('/edit-pdf')}
                          className="flex items-center py-2 px-2 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                          onClick={handleLinkClick}
                        >
                          <Image src="/images/icons/edit.png" width={20} height={20} alt="Edit PDF" className="mr-3" />
                          {t('navbar.edit.edit')}
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Auth Buttons - show only if not authenticated */}
                  {!isAuthenticated && (
                    <div className="pt-6 border-t border-gray-200 space-y-3">
                      <Link
                        href={getLocalizedHref('/login')}
                        className="block w-full py-3 px-4 bg-gray-100 text-center text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={handleLinkClick}
                      >
                        {t('navbar.login')}
                      </Link>
                      <Link
                        href={getLocalizedHref('/register')}
                        className="block w-full py-3 px-4 bg-red-600 text-center text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                        onClick={handleLinkClick}
                      >
                        {t('navbar.signUp')}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showLogoutConfirm && (
          <div className="fixed inset-0 backdrop-filter backdrop-blur-md flex items-center justify-center z-50">
            <div 
              ref={logoutConfirmRef}
              className="bg-white rounded-lg shadow-xl max-w-md mx-4 w-full overflow-hidden animate-fade-in"
            >
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
              </div>
              <div className="p-5">
                <p className="text-gray-600">Are you sure you want to log out from your account?</p>
              </div>
              <div className="p-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={cancelLogout}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}