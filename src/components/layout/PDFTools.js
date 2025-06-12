'use client';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useI18n } from '@/i18n';
import { get } from 'sortablejs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const PDFTools = () => {
  const { t , getLocalizedHref } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTools, setFilteredTools] = useState([]);
  const [hoveredTool, setHoveredTool] = useState(null);
  
  // Tools array with translation keys
  const tools = [
    {
      id: 'merge-pdf',
      icon: '/images/icons/merge.png',
      titleKey: 'pdfTools.tools.mergePdf.title',
      descriptionKey: 'pdfTools.tools.mergePdf.description',
      comingSoon: false,
      href: getLocalizedHref('/merge-pdf')
    },
    {
      id: 'compress-pdf',
      icon: '/images/icons/compress.png',
      titleKey: 'pdfTools.tools.compressPdf.title',
      descriptionKey: 'pdfTools.tools.compressPdf.description',
      comingSoon: false,
      href: getLocalizedHref('/compress-pdf')
    },
    {
      id: 'split-pdf',
      icon: '/images/icons/split.png',
      titleKey: 'pdfTools.tools.splitPdf.title',
      descriptionKey: 'pdfTools.tools.splitPdf.description',
      comingSoon: false,
      href: getLocalizedHref('/split-pdf')
    },
    {
      id: 'unlock-pdf',
      icon: '/images/icons/unllock.png',
      titleKey: 'pdfTools.tools.unlockPdf.title',
      descriptionKey: 'pdfTools.tools.unlockPdf.description',
      comingSoon: false,
      href: getLocalizedHref('/unlock-pdf')
    },
    {
      id: 'protect-pdf',
      icon: '/images/icons/protect.png',
      titleKey: 'pdfTools.tools.protectPdf.title',
      descriptionKey: 'pdfTools.tools.protectPdf.description',
      comingSoon: false,
      href: getLocalizedHref('/protect-pdf')
    },
    {
      id: 'repair-pdf',
      icon: '/images/icons/repair.png',
      titleKey: 'pdfTools.tools.repairPdf.title',
      descriptionKey: 'pdfTools.tools.repairPdf.description',
      comingSoon: false,
      href: getLocalizedHref('/repair-pdf')
    },
    {
      id: 'excel-to-pdf',
      icon: '/images/icons/exceltopdf.png',
      titleKey: 'pdfTools.tools.excelToPdf.title',
      descriptionKey: 'pdfTools.tools.excelToPdf.description',
      comingSoon: false,
      href: getLocalizedHref('/excel-to-pdf')
    },
    {
      id: 'word-to-pdf',
      icon: '/images/icons/wordtopdf.png',
      titleKey: 'pdfTools.tools.wordToPdf.title',
      descriptionKey: 'pdfTools.tools.wordToPdf.description',
      comingSoon: false,
      href: getLocalizedHref('/word-to-pdf')
    },
    {
      id: 'powerpoint-to-pdf',
      icon: '/images/icons/ppttopdf.png',
      titleKey: 'pdfTools.tools.powerpointToPdf.title',
      descriptionKey: 'pdfTools.tools.powerpointToPdf.description',
      comingSoon: false,
      href: getLocalizedHref('/powerpoint-to-pdf')
    },
    {
      id: 'image-to-pdf',
      icon: '/images/icons/imgtopdf.png',
      titleKey: 'pdfTools.tools.imageToPdf.title',
      descriptionKey: 'pdfTools.tools.imageToPdf.description',
      comingSoon: false,
      href: getLocalizedHref('/image-to-pdf')
    },
    {
      id: 'pdf-to-image',
      icon: '/images/icons/pdftoimg.png',
      titleKey: 'pdfTools.tools.pdfToImage.title',
      descriptionKey: 'pdfTools.tools.pdfToImage.description',
      comingSoon: false,
      href: getLocalizedHref('/pdf-to-image')
    },
    {
      id: 'rotate-pdf',
      icon: '/images/icons/rotate.png',
      titleKey: 'pdfTools.tools.rotatePdf.title',
      descriptionKey: 'pdfTools.tools.rotatePdf.description',
      comingSoon: false,
      href: getLocalizedHref('/rotate-pdf')
    },
    {
      id: 'organize-pdf',
      icon: '/images/icons/organize.png',
      titleKey: 'pdfTools.tools.organizePdf.title',
      descriptionKey: 'pdfTools.tools.organizePdf.description',
      comingSoon: false,
      href: getLocalizedHref('/organize-pdf')
    },
    {
      id: 'pdf-to-pdf-a',
      icon: '/images/icons/pdftoa.png',
      titleKey: 'pdfTools.tools.pdfToPdfA.title',
      descriptionKey: 'pdfTools.tools.pdfToPdfA.description',
      comingSoon: false,
      href: getLocalizedHref('/pdf-to-pdfa')
    },
    {
      id: 'scan-pdf',
      icon: '/images/icons/scanpdf.png',
      titleKey: 'pdfTools.tools.scanPdf.title',
      descriptionKey: 'pdfTools.tools.scanPdf.description',
      comingSoon: false,
      href: getLocalizedHref('/scan-pdf')
    },
    {
      id: 'sign-pdf',
      icon: '/images/icons/signture.png',
      titleKey: 'pdfTools.tools.signPdf.title',
      descriptionKey: 'pdfTools.tools.signPdf.description',
      comingSoon: true,
      href: getLocalizedHref('/sign-pdf')
    },
    {
      id: 'watermark',
      icon: '/images/icons/watermark.png',
      titleKey: 'pdfTools.tools.watermark.title',
      descriptionKey: 'pdfTools.tools.watermark.description',
      comingSoon: false,
      href: getLocalizedHref('/watermark-pdf')
    },
    {
      id: 'ocr-pdf',
      icon: '/images/icons/pdftoocr.png',
      titleKey: 'pdfTools.tools.ocrPdf.title',
      descriptionKey: 'pdfTools.tools.ocrPdf.description',
      comingSoon: false,
      href: getLocalizedHref('/ocr-pdf')
    },
    {
      id: 'page-numbers',
      icon: '/images/icons/Frame.png',
      titleKey: 'pdfTools.tools.pageNumbers.title',
      descriptionKey: 'pdfTools.tools.pageNumbers.description',
      comingSoon: false,
      href: getLocalizedHref('/add-page-numbers')
    },
    {
      id: 'edit-pdf',
      icon: '/images/icons/edit.png',
      titleKey: 'pdfTools.tools.editPdf.title',
      descriptionKey: 'pdfTools.tools.editPdf.description',
      comingSoon: true,
      href: getLocalizedHref('/edit-pdf')
    },
    {
      id: 'pdf-to-word',
      icon: '/images/icons/pdftoword.png',
      titleKey: 'pdfTools.tools.pdfToWord.title',
      descriptionKey: 'pdfTools.tools.pdfToWord.description',
      comingSoon: false,
      href: getLocalizedHref('/pdf-to-word')
    },
    {
      id: 'pdf-to-powerpoint',
      icon: '/images/icons/pdftoppt.png',
      titleKey: 'pdfTools.tools.pdfToPowerpoint.title',
      descriptionKey: 'pdfTools.tools.pdfToPowerpoint.description',
      comingSoon: false,
      href: getLocalizedHref('/pdf-to-powerpoint')
    },
    {
      id: 'pdf-to-excel',
      icon: '/images/icons/pdf_to_excel.svg',
      titleKey: 'pdfTools.tools.pdfToExcel.title',
      descriptionKey: 'pdfTools.tools.pdfToExcel.description',
      comingSoon: false,
      href: getLocalizedHref('/pdf-to-excel')
    }
  ];

  // Initialize filtered tools on component mount
  useEffect(() => {
    setFilteredTools(tools);
  }, []);

  // Handle search with translated content
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredTools(tools);
    } else {
      const filtered = tools.filter(tool => {
        const title = t(tool.titleKey).toLowerCase();
        const description = t(tool.descriptionKey).toLowerCase();
        const searchTermLower = term.toLowerCase();
        
        return title.includes(searchTermLower) || description.includes(searchTermLower);
      });
      setFilteredTools(filtered);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-5xl sm:text-2xl font-bold bg-black bg-clip-text text-transparent mb-4">
              {t('pdfTools.header.title1')}
            </h1>
            <h2 className="text-2xl md:text-5xl sm:text-2xl font-bold mb-2">
              {t('pdfTools.header.title2')}{' '}
              <span className="bg-[#DA1F10] bg-clip-text text-transparent">
                {t('pdfTools.header.brand')}
              </span>
            </h2>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-gray-800 underline decoration-red-500 decoration-4 underline-offset-8">
              {t('pdfTools.header.subtitle')}
            </h3>
            <p className="text-2xl md:text-4xl font-bold text-[#DA1F10]">
              {t('pdfTools.header.freeLabel')}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <input 
              type="text" 
              placeholder={t('pdfTools.search.placeholder')}
              value={searchTerm}
              onChange={handleSearch}
              className="w-full py-4 px-6 pr-14 text-lg rounded-2xl border-2 border-red-200 focus:border-red-500 focus:outline-none bg-white shadow-lg transition-all duration-300 group-hover:shadow-xl"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search size={24} />
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool) => (
            <ToolCard 
              key={tool.id}
              tool={tool}
              isHovered={hoveredTool === tool.id}
              onHover={() => setHoveredTool(tool.id)}
              onLeave={() => setHoveredTool(null)}
              t={t}
            />
          ))}
        </div>
        
        {filteredTools.length === 0 && (
          <div className="text-center py-20">
            <div className="mb-6">
              <Search size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                {t('pdfTools.search.noResults.title')}
              </h3>
              <p className="text-gray-500">
                {t('pdfTools.search.noResults.description', { searchTerm })}
              </p>
            </div>
            <button 
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              onClick={() => setSearchTerm('')}
            >
              {t('pdfTools.search.noResults.showAllButton')}
            </button>
          </div>
        )}
      </div>
      <StatisticsSection />
    </div>
  );
};

// Updated Tool Card Component with translations
function ToolCard({ tool, isHovered, onHover, onLeave, t }) {
  return (
    <div
      className={`relative group cursor-pointer transition-all duration-300 ${
        tool.comingSoon ? 'cursor-not-allowed' : 'hover:scale-105'
      }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Card with fixed height for equal sizing */}
      <div className={`
        h-52 rounded-2xl p-6 shadow-lg border border-gray-100 
        transition-all duration-300 relative overflow-hidden
        ${tool.comingSoon 
          ? 'bg-gray-50 opacity-75' 
          : `bg-white hover:shadow-2xl ${isHovered ? 'shadow-2xl' : ''}`
        }
      `}>
        
        {/* Background Effect */}
        {!tool.comingSoon && (
          <div className={`
            absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 opacity-0 
            group-hover:opacity-100 transition-opacity duration-300
          `} />
        )}
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Icon Container */}
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center mb-4 
            transition-all duration-300 border
            ${tool.comingSoon 
              ? 'bg-gray-200 border-gray-300' 
              : 'bg-white border-red-100 group-hover:border-red-300 group-hover:scale-110'
            }
          `}>
            <img 
              src={tool.icon} 
              alt={`${t(tool.titleKey)} icon`} 
              className="w-8 h-8 object-contain"
            />
          </div>
          
          {/* Title */}
          <h3 className={`
            text-2xl font-bold mb-3 transition-colors duration-200 leading-tight
            ${tool.comingSoon ? 'text-gray-500' : 'text-gray-800 group-hover:text-red-700'}
          `}>
            {t(tool.titleKey)}
          </h3>
          
          {/* Description */}
          <p className={`
            text-sm leading-relaxed flex-1
            ${tool.comingSoon ? 'text-gray-400' : 'text-gray-600 group-hover:text-gray-700'}
          `}>
            {t(tool.descriptionKey)}
          </p>
        </div>
        
        {/* Coming Soon Badge */}
        {tool.comingSoon && (
          <div className="absolute top-4 right-4">
            <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {t('pdfTools.badges.comingSoon')}
            </span>
          </div>
        )}
        
        {/* Hover Arrow */}
        {!tool.comingSoon && (
          <div className={`
            absolute bottom-4 right-4 transform transition-all duration-300
            ${isHovered ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0'}
          `}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}

        {/* Clickable Link Overlay */}
        {!tool.comingSoon && (
          <a 
            href={tool.href} 
            className="absolute inset-0 z-20"
            aria-label={`Go to ${t(tool.titleKey)}`}
          />
        )}
      </div>
    </div>
  );
}

export default PDFTools;

const StatisticsSection = () => {
  const { t } = useI18n();
  const [statistics, setStatistics] = useState({
    total_conversions: 125000,
    total_users: 11000,
    unique_visitors: 0,
    last_updated: null
  });
  const [loading, setLoading] = useState(true);

  // Fetch statistics from API
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/statistics/`);
        const result = await response.json();
        
        if (result.status === 'success') {
          setStatistics(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
        // Keep default values if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  const stats = [
    {
      id: 1,
      value: `${formatNumber(statistics.total_conversions)}+`,
      labelKey: 'pdfTools.statistics.filesConverted',
      iconSpace: '/images/icons/file.svg'
    },
    {
      id: 2,
      value: `${formatNumber(statistics.total_users)}+`,
      labelKey: 'pdfTools.statistics.users',
      iconSpace: '/images/icons/user.svg'
    },
    {
      id: 3,
      value: '20+',
      labelKey: 'pdfTools.statistics.tools',
      iconSpace: '/images/icons/tools.svg'
    },
    {
      id: 4,
      value: 'Web',
      labelKey: 'pdfTools.statistics.crossPlatform',
      iconSpace: '/images/icons/platform.svg'
    }
  ];

  return (
    <div className="bg-[#F9F5F4] py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.id} className="text-center">
              {/* Icon Space */}
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="w-12 h-12 rounded">
                  <img src={stat.iconSpace} className="w-full h-full object-contain" alt={t(stat.labelKey)} />
                </div>
              </div>
              
              {/* Value */}
              <div className="text-2xl md:text-2xl font-bold text-gray-800 mb-2">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-20 mx-auto rounded"></div>
                ) : (
                  stat.value
                )}
              </div>
              
              {/* Label */}
              <div className="text-gray-600 font-medium">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};