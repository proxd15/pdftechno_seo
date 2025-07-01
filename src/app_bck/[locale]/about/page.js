'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';

const AboutUs = () => {
  const { t } = useI18n();
  const [activeValue, setActiveValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveValue((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Team members data with translation keys
  const teamMembers = [
    {
      nameKey: "about.team.members.kshitiz.name",
      roleKey: "about.team.members.kshitiz.role",
      bioKey: "about.team.members.kshitiz.bio",
      image: "/images/team/kshitiz.jpeg",
      linkedin: "#",
      skills: ["Strategy", "Leadership", "Product Vision"]
    },
    {
      nameKey: "about.team.members.priyank.name",
      roleKey: "about.team.members.priyank.role",
      bioKey: "about.team.members.priyank.bio",
      image: "/images/team/priyank.jpeg",
      linkedin: "",
      skills: ["React", "Python", "AI/ML"]
    },
    {
      nameKey: "about.team.members.sagar.name",
      roleKey: "about.team.members.sagar.role",
      bioKey: "about.team.members.sagar.bio",
      image: "/images/team/sagar.jpeg",
      linkedin: "#",
      skills: ["Cloud", "PDF Processing", "DevOps"]
    },
  ];

  // Core values with translation keys
  const coreValues = [
    {
      letter: "A",
      titleKey: "about.values.items.accessibility.title",
      descriptionKey: "about.values.items.accessibility.description",
      icon: "🌐",
      color: "bg-blue-500"
    },
    {
      letter: "S",
      titleKey: "about.values.items.simplicity.title",
      descriptionKey: "about.values.items.simplicity.description",
      icon: "⚡",
      color: "bg-green-500"
    },
    {
      letter: "I",
      titleKey: "about.values.items.innovation.title",
      descriptionKey: "about.values.items.innovation.description",
      icon: "🚀",
      color: "bg-purple-500"
    },
    {
      letter: "C",
      titleKey: "about.values.items.customerFocus.title",
      descriptionKey: "about.values.items.customerFocus.description",
      icon: "❤️",
      color: "bg-pink-500"
    },
    {
      letter: "S",
      titleKey: "about.values.items.security.title",
      descriptionKey: "about.values.items.security.description",
      icon: "🔒",
      color: "bg-indigo-500"
    }
  ];

  // Statistics with translation keys
  const stats = [
    { number: "50K+", labelKey: "about.stats.happyUsers", icon: "👥" },
    { number: "1M+", labelKey: "about.stats.filesProcessed", icon: "📄" },
    { number: "25+", labelKey: "about.stats.pdfTools", icon: "🛠️" },
    { number: "99.9%", labelKey: "about.stats.uptime", icon: "⚡" }
  ];

  // Features with translation keys
  const features = [
    {
      titleKey: "about.features.items.pdfEditing.title",
      descriptionKey: "about.features.items.pdfEditing.description",
      icon: "✏️",
      highlightKey: "about.features.items.pdfEditing.highlight"
    },
    {
      titleKey: "about.features.items.fileConversion.title",
      descriptionKey: "about.features.items.fileConversion.description",
      icon: "🔄",
      highlightKey: "about.features.items.fileConversion.highlight"
    },
    {
      titleKey: "about.features.items.smartCompression.title",
      descriptionKey: "about.features.items.smartCompression.description",
      icon: "📦",
      highlightKey: ""
    },
    {
      titleKey: "about.features.items.advancedSecurity.title",
      descriptionKey: "about.features.items.advancedSecurity.description",
      icon: "🛡️",
      highlightKey: "about.features.items.advancedSecurity.highlight"
    },
    {
      titleKey: "about.features.items.formBuilder.title",
      descriptionKey: "about.features.items.formBuilder.description",
      icon: "📝",
      highlightKey: ""
    },
    {
      titleKey: "about.features.items.cloudIntegration.title",
      descriptionKey: "about.features.items.cloudIntegration.description",
      icon: "☁️",
      highlightKey: "about.features.items.cloudIntegration.highlight"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic Hero Section */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-[#DA1F10] px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span>🚀</span>
              <span>{t('about.hero.launchBadge')}</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              {t('about.hero.title')}{' '}
              <span className="text-[#DA1F10] inline-block transform hover:scale-105 transition-transform">
                {t('about.hero.brand')}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
              {t('about.hero.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Company Story Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <span>💡</span>
                <span>{t('about.story.badge')}</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {t('about.story.title')}
              </h2>
              
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                {t('about.story.description')}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg text-gray-700">{t('about.story.features.noDownload')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg text-gray-700">{t('about.story.features.security')}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg text-gray-700">{t('about.story.features.accessibility')}</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gray-900 rounded-3xl p-8 text-white transform hover:rotate-0 transition-transform duration-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold mb-4">{t('about.story.mission.title')}</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {t('about.story.mission.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Values Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span>⭐</span>
              <span>{t('about.values.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t('about.values.title')} <span className="text-[#DA1F10]">ASICS</span>
            </h2>
            <p className="text-xl text-gray-600">{t('about.values.subtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreValues.map((value, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 ${
                  activeValue === index ? 'ring-4 ring-[#DA1F10] ring-opacity-50' : ''
                }`}
                onMouseEnter={() => setActiveValue(index)}
              >
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 ${value.color} rounded-2xl flex items-center justify-center text-white font-bold text-2xl mr-4 transform rotate-12 hover:rotate-0 transition-transform`}>
                    {value.letter}
                  </div>
                  <div className="text-4xl">{value.icon}</div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{t(value.titleKey)}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{t(value.descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span>🛠️</span>
              <span>{t('about.features.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t('about.features.title')}
            </h2>
            <p className="text-xl text-gray-600">{t('about.features.subtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="relative bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-[#DA1F10] hover:shadow-lg transition-all duration-300 group">
                {feature.highlightKey && t(feature.highlightKey) && (
                  <div className="absolute -top-3 left-6 bg-[#DA1F10] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {t(feature.highlightKey)}
                  </div>
                )}
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{t(feature.titleKey)}</h3>
                <p className="text-gray-600 leading-relaxed">{t(feature.descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span>👥</span>
              <span>{t('about.team.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t('about.team.title')}
            </h2>
            <p className="text-xl text-gray-600">{t('about.team.subtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4">
                  <div className="relative overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={t(member.nameKey)}
                      className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{t(member.nameKey)}</h3>
                    <p className="text-[#DA1F10] font-semibold mb-3">{t(member.roleKey)}</p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{t(member.bioKey)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    
    </div>
  );
};

export default AboutUs;