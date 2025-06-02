'use client';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const PDFTools = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTools, setFilteredTools] = useState([]);
  const [hoveredTool, setHoveredTool] = useState(null);
  
  // Original tools array with image icons
  const tools = [
    {
      id: 'merge-pdf',
      icon: '/images/icons/merge.png',
      title: 'Merge PDF',
      description: 'Merge multiple PDFs into one file.',
      comingSoon: false,
      href: '/tools/merge-pdf'
    },
    {
      id: 'compress-pdf',
      icon: '/images/icons/compress.png',
      title: 'Compress PDF',
      description: 'Reduce file size',
      comingSoon: false,
      href: '/tools/compress-pdf'
    },
    {
      id: 'split-pdf',
      icon: '/images/icons/split.png',
      title: 'Split PDF',
      description: 'Separate a PDF into individual pages.',
      comingSoon: false,
      href: '/tools/split-pdf'
    },
    {
      id: 'unlock-pdf',
      icon: '/images/icons/unllock.png',
      title: 'Unlock PDF',
      description: 'Easily unlock and remove password from pdf',
      comingSoon: false,
      href: '/tools/unlock-pdf'
    },
    {
      id: 'protect-pdf',
      icon: '/images/icons/protect.png',
      title: 'Protect PDF',
      description: 'Secure your PDF with a password',
      comingSoon: false,
      href: '/tools/protect-pdf'
    },
    {
      id: 'repair-pdf',
      icon: '/images/icons/repair.png',
      title: 'Repair PDF',
      description: 'Fix and restore damaged PDF files',
      comingSoon: false,
      href: '/tools/repair-pdf'
    },
    {
      id: 'excel-to-pdf',
      icon: '/images/icons/exceltopdf.png',
      title: 'Excel to PDF',
      description: 'Transform excel sheets into pdfs',
      comingSoon: false,
      href: '/tools/excel-to-pdf'
    },
    {
      id: 'word-to-pdf',
      icon: '/images/icons/wordtopdf.png',
      title: 'Word to PDF',
      description: 'Convert Word documents into PDFs.',
      comingSoon: false,
      href: '/tools/word-to-pdf'
    },
    {
      id: 'powerpoint-to-pdf',
      icon: '/images/icons/ppttopdf.png',
      title: 'Powerpoint to PDF',
      description: 'Turn your Powerpoint(ppt) slides into pdf.',
      comingSoon: false,
      href: '/tools/powerpoint-to-pdf'
    },
    {
      id: 'image-to-pdf',
      icon: '/images/icons/imgtopdf.png',
      title: 'Image to PDF',
      description: 'Convert all type images(PNG, JPG, JPEG) into a PDF file.',
      comingSoon: false,
      href: '/tools/image-to-pdf'
    },
    {
      id: 'pdf-to-image',
      icon: '/images/icons/pdftoimg.png',
      title: 'PDF to Image',
      description: 'Extract all type images from PDFs as JPG, PNG, TIFF, BMP files.',
      comingSoon: false,
      href: '/tools/pdf-to-image'
    },
    {
      id: 'rotate-pdf',
      icon: '/images/icons/rotate.png',
      title: 'Rotate PDF',
      description: 'Adjust the orientation of your PDF pages.',
      comingSoon: false,
      href: '/tools/rotate-pdf'
    },
    {
      id: 'organize-pdf',
      icon: '/images/icons/organize.png',
      title: 'Organize PDF',
      description: 'Rearrange, merge, or delete pages in your PDF.',
      comingSoon: false,
      href: '/tools/organize-pdf'
    },
    {
      id: 'pdf-to-pdf-a',
      icon: '/images/icons/pdftoa.png',
      title: 'PDF to PDF/A',
      description: 'Archive PDFs in PDF/A format.',
      comingSoon: false,
      href: '/tools/pdf-to-pdfa'
    },
    {
      id: 'scan-pdf',
      icon: '/images/icons/scanpdf.png',
      title: 'Scan PDF',
      description: 'Scan any documents directly into PDF format.',
      comingSoon: false,
      href: '/tools/scan-pdf'
    },
    {
      id: 'sign-pdf',
      icon: '/images/icons/signture.png',
      title: 'Sign PDF',
      description: 'Sign yourself or request for electronic signature',
      comingSoon: true,
      href: '/tools/sign-pdf'
    },
    {
      id: 'watermark',
      icon: '/images/icons/watermark.png',
      title: 'Watermark',
      description: 'Add custom watermarks to your documents',
      comingSoon: false,
      href: '/tools/watermark-pdf'
    },
    {
      id: 'ocr-pdf',
      icon: '/images/icons/pdftoocr.png',
      title: 'OCR PDF',
      description: 'Extract text from PDFs.',
      comingSoon: false,
      href: '/tools/ocr-pdf'
    },
    {
      id: 'page-numbers',
      icon: '/images/icons/Frame.png',
      title: 'Page Numbers',
      description: 'Combine PDFs in the order',
      comingSoon: false,
      href: '/tools/add-page-numbers'
    },
    {
      id: 'edit-pdf',
      icon: '/images/icons/edit.png',
      title: 'Edit PDF',
      description: 'Change text and images in PDFs.',
      comingSoon: true,
      href: '/tools/edit-pdf'
    },
    {
      id: 'pdf-to-word',
      icon: '/images/icons/pdftoword.png',
      title: 'PDF To Word',
      description: 'Transform PDFs into word files',
      comingSoon: false,
      href: '/tools/pdf-to-word'
    },
    {
      id: 'pdf-to-powerpoint',
      icon: '/images/icons/pdftoppt.png',
      title: 'PDF to Powerpoint',
      description: 'Convert PDFs into editable PowerPoint(ppt).',
      comingSoon: false,
      href: '/tools/pdf-to-powerpoint'
    },
    {
      id: 'pdf-to-excel',
      icon: '/images/icons/pdf_to_excel.svg',
      title: 'PDF To Excel',
      description: 'Transform PDFs into excel sheets',
      comingSoon: false,
      href: '/tools/pdf-to-excel'
    }
  ];

  // Initialize filtered tools on component mount
  useEffect(() => {
    setFilteredTools(tools);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.trim() === '') {
      setFilteredTools(tools);
    } else {
      const filtered = tools.filter(tool => 
        tool.title.toLowerCase().includes(term.toLowerCase()) || 
        tool.description.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredTools(filtered);
    }
  };
  
  return (
    
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-8">
            <h1 className="text-5xl md:text-5xl font-bold bg-black bg-clip-text text-transparent mb-4">
              Transform Documents
            </h1>
            <h2 className="text-5xl md:text-5xl font-bold mb-2">
              Seamlessly with our{' '}
              <span className="bg-[#DA1F10] bg-clip-text text-transparent">
                PDF Techno
              </span>
            </h2>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-4xl font-bold text-gray-800 underline decoration-red-500 decoration-4 underline-offset-8">
              A Tool For Every PDF Need
            </h3>
            <p className="text-4xl font-bold text-[#DA1F10]">100% Free</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search tools..." 
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
            />
          ))}
        </div>
        
        {filteredTools.length === 0 && (
          <div className="text-center py-20">
            <div className="mb-6">
              <Search size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">No tools found</h3>
              <p className="text-gray-500">No tools match your search for "{searchTerm}"</p>
            </div>
            <button 
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              onClick={() => setSearchTerm('')}
            >
              Show all tools
            </button>
          </div>
        )}
      </div>
      <StatisticsSection />
    </div>
  );
};

// Modern Tool Card Component with equal sizing
function ToolCard({ tool, isHovered, onHover, onLeave }) {
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
              alt={`${tool.title} icon`} 
              className="w-8 h-8 object-contain"
            />
          </div>
          
          {/* Title */}
          <h3 className={`
            text-2xl font-bold mb-3 transition-colors duration-200 leading-tight
            ${tool.comingSoon ? 'text-gray-500' : 'text-gray-800 group-hover:text-red-700'}
          `}>
            {tool.title}
          </h3>
          
          {/* Description */}
          <p className={`
            text-sm leading-relaxed flex-1
            ${tool.comingSoon ? 'text-gray-400' : 'text-gray-600 group-hover:text-gray-700'}
          `}>
            {tool.description}
          </p>
        </div>
        
        {/* Coming Soon Badge */}
        {tool.comingSoon && (
          <div className="absolute top-4 right-4">
            <span className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Coming Soon
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
            aria-label={`Go to ${tool.title}`}
          />
        )}
      </div>
    </div>
  );
}

export default PDFTools;

const StatisticsSection = () => {
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
      label: 'Files Converted',
      iconSpace: '/images/icons/file.svg' // Leave space for icon
    },
    {
      id: 2,
      value: `${formatNumber(statistics.total_users)}+`,
      label: 'Users',
      iconSpace: '/images/icons/user.svg' // Leave space for icon
    },
    {
      id: 3,
      value: '20+',
      label: 'Tools',
      iconSpace: '/images/icons/tools.svg' // Leave space for icon
    },
    {
      id: 4,
      value: 'Web',
      label: 'Cross-Platform',
      iconSpace: '/images/icons/platform.svg' // Leave space for icon
    }
  ];

  return (
    <div className="bg-[#F9F5F4] py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.id} className="text-center">
              {/* Icon Space - Leave empty for now */}
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                
                <div className="w-12 h-12 rounded">
                  <img src={stat.iconSpace} className="w-full h-full object-contain" />
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
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
