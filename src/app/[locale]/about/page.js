// pages/about.js or app/about/page.js (depending on your Next.js version)

'use client'; // Add this if using app directory

import { useState, useEffect } from 'react';

const AboutUs = () => {
  const [activeValue, setActiveValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveValue((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const teamMembers = [
    {
      name: "Kshitiz Verma",
      role: "CEO",
      bio: "Visionary leader with a passion for innovation. Loves turning complex problems into simple solutions.",
      image: "/images/team/kshitiz.jpeg",
      linkedin: "#",
      skills: ["Strategy", "Leadership", "Product Vision"]
    },
    {
      name: "Priyank Singh",
      role: "Head of Operations",
      bio: " Loves optimizing processes and enhancing user experience. A true believer in data-driven decisions.", 
      image: "/images/team/priyank.jpeg",
      linkedin: "",
      skills: ["React", "Python", "AI/ML"]
    },
    {
      name: "Sagar Kumar",
      role: "Lead Developer",
      bio: "Backend wizard with a knack for building scalable systems. Loves solving complex problems.",
      image: "/images/team/sagar.jpeg",
      linkedin: "#",
      skills: ["Cloud", "PDF Processing", "DevOps"]
    },
    {
      name: "Anuj Singh",
      role: "Testing and R&D",
      bio: "Dedicated to product quality and innovation. Loves breaking things to make them better.",
      image: "/images/team/anuj.jpeg",
      linkedin: "#",
      skills: ["UX Design", "Support", "Analytics"]
    }
  ];

  const coreValues = [
    {
      letter: "A",
      title: "Accessibility",
      description: "Our platform is available wherever you are, whenever you need it. No barriers, just seamless access.",
      icon: "🌐",
      color: "bg-blue-500"
    },
    {
      letter: "S",
      title: "Simplicity",
      description: "Designed for everyone. No technical expertise required - just intuitive, powerful tools.",
      icon: "⚡",
      color: "bg-green-500"
    },
    {
      letter: "I",
      title: "Innovation",
      description: "Cutting-edge technology meets practical solutions. We're always pushing boundaries.",
      icon: "🚀",
      color: "bg-purple-500"
    },
    {
      letter: "C",
      title: "Customer Focus",
      description: "Your success is our mission. We listen, adapt, and deliver exactly what you need.",
      icon: "❤️",
      color: "bg-pink-500"
    },
    {
      letter: "S",
      title: "Security",
      description: "Bank-level security for your documents. Your privacy and data protection are non-negotiable.",
      icon: "🔒",
      color: "bg-indigo-500"
    }
  ];

  const stats = [
    { number: "50K+", label: "Happy Users", icon: "👥" },
    { number: "1M+", label: "Files Processed", icon: "📄" },
    { number: "25+", label: "PDF Tools", icon: "🛠️" },
    { number: "99.9%", label: "Uptime", icon: "⚡" }
  ];

  const features = [
    {
      title: "PDF Editing Made Simple",
      description: "Add text, images, signatures. Reorganize pages with drag & drop. Professional results in seconds.",
      icon: "✏️",
      highlight: "Most Popular"
    },
    {
      title: "Universal File Conversion", 
      description: "Convert between PDF, Word, Excel, PowerPoint, images and more. Perfect formatting guaranteed.",
      icon: "🔄",
      highlight: "New"
    },
    {
      title: "Smart Compression",
      description: "Reduce file sizes by up to 90% without quality loss. AI-powered optimization for any use case.",
      icon: "📦",
      highlight: ""
    },
    {
      title: "Advanced Security",
      description: "Password protection, digital signatures, and encryption. Enterprise-grade security for everyone.",
      icon: "🛡️",
      highlight: "Enterprise"
    },
    {
      title: "Form Builder Pro",
      description: "Create interactive forms, collect signatures, and automate workflows. No coding required.",
      icon: "📝",
      highlight: ""
    },
    {
      title: "Cloud Integration",
      description: "Works with Google Drive, Dropbox, OneDrive. Access your files from anywhere, anytime.",
      icon: "☁️",
      highlight: "Popular"
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
              <span>Launched in 2025</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              About{' '}
              <span className="text-[#DA1F10] inline-block transform hover:scale-105 transition-transform">
                PDF Techno
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mb-12">
              We're not just another PDF tool. We're your digital document powerhouse, 
              transforming how the world works with PDFs since 2025.
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
                <span>Our Story</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Revolutionizing PDF Management
              </h2>
              
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                Born from frustration with clunky PDF tools, PDF Techno emerged as the solution 
                the world was waiting for. Our team of developers, designers, and document experts 
                came together with one mission: make PDF work seamless, secure, and lightning-fast.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg text-gray-700">No software downloads required</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg text-gray-700">Enterprise-grade security for everyone</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg text-gray-700">Global accessibility from any device</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gray-900 rounded-3xl p-8 text-white transform hover:rotate-0 transition-transform duration-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    To democratize professional PDF tools and make document management 
                    effortless for everyone, everywhere.
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
              <span>Core Values</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Drives Us: <span className="text-[#DA1F10]">ASICS</span>
            </h2>
            <p className="text-xl text-gray-600">The principles that shape every decision we make</p>
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
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{value.description}</p>
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
              <span>Our Tools</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features, Simple Experience
            </h2>
            <p className="text-xl text-gray-600">Everything you need to work with PDFs, and then some</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="relative bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-[#DA1F10] hover:shadow-lg transition-all duration-300 group">
                {feature.highlight && (
                  <div className="absolute -top-3 left-6 bg-[#DA1F10] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {feature.highlight}
                  </div>
                )}
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
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
              <span>Meet the Team</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              The Minds Behind the Magic
            </h2>
            <p className="text-xl text-gray-600">Passionate innovators dedicated to your success</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="group">
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4">
                  <div className="relative overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-[#DA1F10] font-semibold mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{member.bio}</p>

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