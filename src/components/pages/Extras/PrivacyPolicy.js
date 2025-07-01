"use client"
import React, { useState } from 'react';
import Head from 'next/head';

const PrivacyPolicy = () => {
  const [activeSection, setActiveSection] = useState(null);

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <>
      <Head>
        <title>Privacy Policy - PDFTechno</title>
        <meta name="description" content="Privacy Policy for PDFTechno - Learn how we collect, use, and protect your personal data" />
        <meta name="keywords" content="PDFTechno privacy, PDFTechno privacy policy, PDFTechno data protection, PDFTechno user privacy, PDFTechno privacy India, PDFTechno privacy compliance, PDFTechno privacy terms, PDFTechno privacy practices, PDFTechno privacy statement, PDFTechno privacy rules, PDFTechno privacy guidelines, PDFTechno privacy agreement, PDFTechno privacy for business, PDFTechno privacy for students, PDFTechno privacy for government, PDFTechno privacy for education, PDFTechno privacy for legal, PDFTechno privacy for professionals, PDFTechno company privacy, PDFTechno company privacy policy, PDFTechno company data protection, PDFTechno company user privacy, PDFTechno company privacy India, PDFTechno company privacy compliance, PDFTechno company privacy terms, PDFTechno company privacy practices, PDFTechno company privacy statement, PDFTechno company privacy rules, PDFTechno company privacy guidelines, PDFTechno company privacy agreement, PDFTechno company privacy for business, PDFTechno company privacy for students, PDFTechno company privacy for government, PDFTechno company privacy for education, PDFTechno company privacy for legal, PDFTechno company privacy for professionals, PDFTechno data security, PDFTechno user data, PDFTechno data collection, PDFTechno data usage, PDFTechno data sharing, PDFTechno data retention, PDFTechno data rights, PDFTechno data subject, PDFTechno data controller, PDFTechno data processor, PDFTechno data compliance, PDFTechno data rules, PDFTechno data guidelines, PDFTechno data agreement, PDFTechno data for business, PDFTechno data for students, PDFTechno data for government, PDFTechno data for education, PDFTechno data for legal, PDFTechno data for professionals" />
      </Head>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="text-black p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-center">
              Privacy Policy
            </h1>
          </div>

          {/* Table of Contents */}
          <div className="bg-blue-50 border-b border-blue-200 p-6">
            <h2 className="text-xl font-bold text-blue-800 mb-4">Table of Contents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
              {[
                "1. Introduction/Overview",
                "2. Definitions", 
                "3. Types of Data Collected",
                "4. Data Collection Methods",
                "5. Purpose of Data Collection",
                "6. Data Usage",
                "7. Data Sharing & Third Parties",
                "8. Data Retention",
                "9. Data Security",
                "10. User Rights",
                "11. Cookies & Tracking",
                "12. Policy Changes",
                "13. Contact Information"
              ].map((item, index) => (
                <a key={index} href={`#section-${index + 1}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Section 1: Introduction */}
            <section id="section-1">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                1. Introduction/Overview
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <p className="text-blue-800">
                    <strong>Welcome to PDFTechno</strong> - www.pdftechno.com ("Website," "Service," "Provider," "Controller/Data Controller," "Application/This Application," "we," "us," or "our"), operated by <strong>[PDFTechno]</strong> ("Proprietorship"), a proprietorship firm incorporated under the laws of India and headquartered at <strong>Latehar, Jharkhand, India</strong>.
                  </p>
                </div>

                <p className="text-gray-700">
                  This Privacy Policy outlines how we collect, use, store, and protect and disclosure of personal data of users ("you," "User") while using our services. By accessing or using www.pdftechno.com, you consent to the practices described herein.
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">🏛️ Legal Compliance</h3>
                  <p className="text-green-700 text-sm">
                    This policy complies with:
                  </p>
                  <ul className="text-green-700 text-sm list-disc list-inside mt-2 space-y-1">
                    <li>Information Technology Act, 2000</li>
                    <li>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</li>
                    <li>The Digital Personal Data Protection Act, 2023</li>
                    <li>Other applicable Indian laws</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">📊 Automatic Data Collection</h3>
                  <p className="text-yellow-700 text-sm">
                    Every time a user or automated system enters PDFTechno, generic statistics and information are gathered including: IP address, browser types, operating system, referrer websites, access dates/times, and other security-related data.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Definitions */}
            <section id="section-2">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                2. Definitions
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    term: "Personal Data (or Data)",
                    definition: "Information that identifies or relates to a natural person (e.g., name, email, IP address). Any information that directly, indirectly, or in connection with other information allows for identification of a natural person."
                  },
                  {
                    term: "Processing",
                    definition: "Any operation performed on Personal Data (e.g., collection, storage, deletion, etc.)."
                  },
                  {
                    term: "Data Subject",
                    definition: "The individual to whom Personal Data relates."
                  },
                  {
                    term: "Usage Data",
                    definition: "Information collected automatically through this Application including IP addresses, URI addresses, request times, browser features, operating system details, and user behavior patterns."
                  },
                  {
                    term: "User",
                    definition: "The individual using this Application who, unless otherwise specified, coincides with the Data Subject."
                  },
                  {
                    term: "Consent",
                    definition: "Any informed and unequivocal expression of will voluntarily given by the data subject in the form of a declaration or other clear affirmative act."
                  },
                  {
                    term: "Profiling",
                    definition: "Any form of automated processing of personal data to evaluate certain personal aspects relating to a natural person, particularly to analyze or predict work performance, economic situation, health, preferences, interests, reliability, behavior, or location."
                  },
                  {
                    term: "Data Controller (PDFTechno)",
                    definition: "The entity which determines the purposes and means of processing Personal Data, including security measures concerning the operation and use of this Application."
                  }
                ].map((item, index) => (
                  <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-gray-800 mb-2">"{item.term}"</h3>
                    <p className="text-gray-700 text-sm">{item.definition}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Types of Data Collected */}
            <section id="section-3">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                3. Types of Data Collected
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-blue-800 mb-2">📝 Personal Data</h3>
                    <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                      <li>Name/Company name</li>
                      <li>Email address</li>
                      <li>Phone number</li>
                      <li>Billing address</li>
                      <li>Payment details (via Razorpay)</li>
                      <li>IP address</li>
                      <li>Device information</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-bold text-green-800 mb-2">🔍 Non-Personal Data</h3>
                    <ul className="text-green-700 text-sm space-y-1 list-disc list-inside">
                      <li>Browser type</li>
                      <li>Operating system</li>
                      <li>Usage statistics</li>
                      <li>Geo-location</li>
                      <li>Cookies</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-bold text-red-800 mb-2">🔐 Sensitive Data</h3>
                    <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                      <li>Passwords (encrypted)</li>
                      <li>Payment information</li>
                      <li>Biometric data (if applicable)</li>
                    </ul>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-bold text-purple-800 mb-2">📄 Uploaded Files</h3>
                    <ul className="text-purple-700 text-sm space-y-1 list-disc list-inside">
                      <li>Documents processed</li>
                      <li>PDF files</li>
                      <li>Images</li>
                      <li>Other file types</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-800 mb-2">🔢 Detailed Data Types Collected:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm text-orange-700">
                    <span>• First name</span>
                    <span>• Email address</span>
                    <span>• Password</span>
                    <span>• VAT Number</span>
                    <span>• Company name</span>
                    <span>• Country</span>
                    <span>• Cookies</span>
                    <span>• Usage Data</span>
                    <span>• IP address</span>
                    <span>• Browsing history</span>
                    <span>• Session statistics</span>
                    <span>• Device information</span>
                    <span>• City location</span>
                    <span>• Browser information</span>
                    <span>• Service communication data</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Data Collection Methods */}
            <section id="section-4">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                4. Data Collection Methods
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-800 mb-2">👤 Directly from You</h3>
                  <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                    <li>Registration forms</li>
                    <li>Account creation</li>
                    <li>Payment processing</li>
                    <li>User submissions</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-bold text-green-800 mb-2">🤖 Automatically</h3>
                  <ul className="text-green-700 text-sm space-y-1 list-disc list-inside">
                    <li>Cookies</li>
                    <li>Log files</li>
                    <li>Analytics tools</li>
                    <li>Google Analytics</li>
                  </ul>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-bold text-purple-800 mb-2">🔗 Third Parties</h3>
                  <ul className="text-purple-700 text-sm space-y-1 list-disc list-inside">
                    <li>Payment gateways (Razorpay)</li>
                    <li>Cloud storage providers</li>
                    <li>Advertising partners</li>
                    <li>Analytics services</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">🛡️ Security Measures</h3>
                <p className="text-yellow-700 text-sm">
                  PDFTechno implements necessary security measures to guard against unauthorized access, disclosure, alteration, or destruction of data. Processing adheres to organizational protocols relevant to stated goals.
                </p>
              </div>
            </section>

            {/* Section 5: Purpose of Data Collection */}
            <section id="section-5">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                5. Purpose of Data Collection & Processing of Personal Data
              </h2>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-bold text-green-800 mb-2">🎯 Service Delivery</h3>
                    <p className="text-green-700 text-sm">Process transactions, provide tools, send invoices and maintain user accounts.</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-bold text-blue-800 mb-2">⚖️ Legal Compliance</h3>
                    <p className="text-blue-700 text-sm">Comply with Indian tax laws, fraud prevention, regulatory requirements under IT Act, 2000.</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-bold text-purple-800 mb-2">💼 Legitimate Interests</h3>
                    <p className="text-purple-700 text-sm">Improving user experience, marketing, and customer support.</p>
                  </div>
                </div>

                {/* Detailed Processing Purposes */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">Detailed Processing Purposes:</h3>
                  
                  {/* Advertising */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <button 
                      className="w-full text-left font-semibold text-orange-800 flex justify-between items-center"
                      onClick={() => toggleSection('advertising')}
                    >
                      📢 Advertising
                      <span className="text-sm">{activeSection === 'advertising' ? '▼' : '▶'}</span>
                    </button>
                    {activeSection === 'advertising' && (
                      <div className="mt-3 space-y-3">
                        <p className="text-orange-700 text-sm">
                          This service permits the use of user data for communication related to advertising, shown as banners and other ads based on user interests and activity.
                        </p>
                        
                        <div className="bg-white rounded p-3">
                          <h4 className="font-semibold text-orange-800 mb-2">Google Ad Manager (Google Ireland Limited)</h4>
                          <ul className="text-orange-700 text-sm space-y-1 list-disc list-inside">
                            <li>Allows advertising campaigns with external networks</li>
                            <li>Uses "DoubleClick" Cookie to track user behavior</li>
                            <li>Users can disable cookies via Google Ad Settings</li>
                            <li>Processing Location: Ireland</li>
                          </ul>
                        </div>

                        <div className="bg-white rounded p-3">
                          <h4 className="font-semibold text-orange-800 mb-2">Google AdSense</h4>
                          <ul className="text-orange-700 text-sm space-y-1 list-disc list-inside">
                            <li>Online service for ad placement on third-party sites</li>
                            <li>Algorithm selects ads based on site content</li>
                            <li>Enables interest-based targeting through user profiles</li>
                            <li>Operated by Alphabet Inc, Mountain View, CA</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Analytics */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <button 
                      className="w-full text-left font-semibold text-blue-800 flex justify-between items-center"
                      onClick={() => toggleSection('analytics')}
                    >
                      📊 Analytics
                      <span className="text-sm">{activeSection === 'analytics' ? '▼' : '▶'}</span>
                    </button>
                    {activeSection === 'analytics' && (
                      <div className="mt-3 space-y-3">
                        <div className="bg-white rounded p-3">
                          <h4 className="font-semibold text-blue-800 mb-2">Google Analytics 4 (Google Ireland Limited)</h4>
                          <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                            <li>Web analysis service to track and examine application use</li>
                            <li>IP addresses discarded before data logging</li>
                            <li>Data processed: browser info, city, device info, session statistics</li>
                            <li>Processing Location: Ireland</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Processing */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <button 
                      className="w-full text-left font-semibold text-green-800 flex justify-between items-center"
                      onClick={() => toggleSection('payments')}
                    >
                      💳 Payment Processing
                      <span className="text-sm">{activeSection === 'payments' ? '▼' : '▶'}</span>
                    </button>
                    {activeSection === 'payments' && (
                      <div className="mt-3">
                        <div className="bg-white rounded p-3">
                          <h4 className="font-semibold text-green-800 mb-2">Razorpay (Razorpay Software Private Limited)</h4>
                          <p className="text-green-700 text-sm">
                            Payment service enabling online payments with secure transaction processing and invoice notifications.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Infrastructure & Cloud Services */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <button 
                      className="w-full text-left font-semibold text-purple-800 flex justify-between items-center"
                      onClick={() => toggleSection('infrastructure')}
                    >
                      ☁️ Infrastructure & Cloud Services
                      <span className="text-sm">{activeSection === 'infrastructure' ? '▼' : '▶'}</span>
                    </button>
                    {activeSection === 'infrastructure' && (
                      <div className="mt-3">
                        <div className="bg-white rounded p-3">
                          <h4 className="font-semibold text-purple-800 mb-2">AWS (Amazon Web Services)</h4>
                          <ul className="text-purple-700 text-sm space-y-1 list-disc list-inside">
                            <li>Backend infrastructure: hosting, storage, database, content-delivery</li>
                            <li>Data processed: Cookies, server logs, authentication data, usage metrics</li>
                            <li>Processing Location: Primarily United States and selected AWS Regions</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">📋 Legal Basis for Processing</h3>
                  <ul className="text-gray-700 text-sm space-y-1 list-disc list-inside">
                    <li>Users have given consent for specific purposes</li>
                    <li>Data provision necessary for contract performance</li>
                    <li>Processing necessary for legal compliance</li>
                    <li>Processing related to public interest or official authority</li>
                    <li>Processing necessary for legitimate interests</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6: Data Usage */}
            <section id="section-6">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                6. Data Usage
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3">Your data is used to:</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">📄</span>
                    <span className="text-blue-700 text-sm">Facilitate document processing (PDF conversions, compressing, merging, splitting, organizing, rotating, optimizing, editing, repairing, reading, scanning, OCR, protection, unlocking, watermark, and e-signing)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">📧</span>
                    <span className="text-blue-700 text-sm">Send transactional emails (invoices, service updates)</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">🎯</span>
                    <span className="text-blue-700 text-sm">Personalize content and advertisements</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600 font-bold">🔒</span>
                    <span className="text-blue-700 text-sm">Conduct security audits and prevent misuse</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7: Data Sharing & Third Parties */}
            <section id="section-7">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                7. Data Sharing & Third Parties
              </h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-3">We may share data with:</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-600 font-bold">💳</span>
                      <div>
                        <span className="text-yellow-700 text-sm font-medium">Payment Processors:</span>
                        <span className="text-yellow-700 text-sm"> To complete transactions (with Razorpay)</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-600 font-bold">☁️</span>
                      <div>
                        <span className="text-yellow-700 text-sm font-medium">Cloud Service Providers:</span>
                        <span className="text-yellow-700 text-sm"> For secure file storage and processing (AWS)</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-600 font-bold">📊</span>
                      <div>
                        <span className="text-yellow-700 text-sm font-medium">Third-Party Processors:</span>
                        <span className="text-yellow-700 text-sm"> For analytics tools (Google Analytics, Google AdSense, etc.)</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-yellow-600 font-bold">⚖️</span>
                      <div>
                        <span className="text-yellow-700 text-sm font-medium">Legal Authorities:</span>
                        <span className="text-yellow-700 text-sm"> If required by Indian law, court orders, or government requests</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">🌍 International Data Transfers</h3>
                  <p className="text-red-700 text-sm">
                    <strong>Note:</strong> Data may be transferred to third-party servers outside India. We ensure compliance with Indian data protection standards.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">🔗 Third-Party Services Used:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <span className="font-medium">Payment Gateway:</span>
                      <br />RazorPay
                    </div>
                    <div className="text-center">
                      <span className="font-medium">Analytics:</span>
                      <br />Google Analytics
                    </div>
                    <div className="text-center">
                      <span className="font-medium">Hosting:</span>
                      <br />AWS
                    </div>
                    <div className="text-center">
                      <span className="font-medium">Advertising:</span>
                      <br />Google AdSense
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 8: Data Retention */}
            <section id="section-8">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                8. Data Retention
              </h2>
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-3 text-left">Data Type</th>
                        <th className="border border-gray-300 p-3 text-left">Retention Period</th>
                        <th className="border border-gray-300 p-3 text-left">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-3 font-medium">User Files (Uploaded)</td>
                        <td className="border border-gray-300 p-3">15 minutes / 2 hours / 7 days</td>
                        <td className="border border-gray-300 p-3">Based on account type (as per T&C Clause 4)</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 p-3 font-medium">Account Data</td>
                        <td className="border border-gray-300 p-3">3 years post-closure</td>
                        <td className="border border-gray-300 p-3">Legal compliance requirements</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-3 font-medium">Payment Records</td>
                        <td className="border border-gray-300 p-3">7 years</td>
                        <td className="border border-gray-300 p-3">Indian tax law requirements</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">📋 General Retention Rules</h3>
                  <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                    <li>Personal Data processed and stored for as long as required by collection purpose</li>
                    <li>May be retained longer due to legal obligations or user consent</li>
                    <li>Contract-related data retained until contract fully performed</li>
                    <li>Legitimate interest data retained as long as needed to fulfill purposes</li>
                    <li>Once retention period expires, Personal Data shall be deleted</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 9: Data Security */}
            <section id="section-9">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                9. Data Security
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-bold text-green-800 mb-2">🔐 Encryption</h3>
                  <p className="text-green-700 text-sm">SSL/TLS for data transmission to ensure secure communication.</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-800 mb-2">👥 Access Controls</h3>
                  <p className="text-blue-700 text-sm">Restricted employee access and server access with multi-factor authentication.</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-bold text-purple-800 mb-2">🔍 Regular Audits</h3>
                  <p className="text-purple-700 text-sm">Vulnerability assessments and penetration testing for security validation.</p>
                </div>
              </div>
            </section>

            {/* Section 10: User Rights */}
            <section id="section-10">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                10. User Rights
              </h2>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-3">🇮🇳 Under Indian Law, you may:</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">👁️</span>
                      <div>
                        <span className="text-green-700 text-sm font-medium">Access/Correct Data:</span>
                        <span className="text-green-700 text-sm"> Request a copy or update inaccuracies of your personal data</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">🗑️</span>
                      <div>
                        <span className="text-green-700 text-sm font-medium">Delete Data:</span>
                        <span className="text-green-700 text-sm"> Ask for erasure (subject to legal obligations)</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">✋</span>
                      <div>
                        <span className="text-green-700 text-sm font-medium">Withdraw Consent:</span>
                        <span className="text-green-700 text-sm"> Opt out of non-essential communications</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">📝</span>
                      <div>
                        <span className="text-green-700 text-sm font-medium">Lodge Complaints:</span>
                        <span className="text-green-700 text-sm"> Contact our Grievance Officer</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-3">🌍 GDPR-Style Rights (Where Applicable):</h3>
                  <div className="space-y-2">
                    {[
                      { icon: "🔄", title: "Withdraw Consent", desc: "Withdraw consent where previously given for data processing" },
                      { icon: "🚫", title: "Object to Processing", desc: "Object to processing if carried out on legal basis other than consent" },
                      { icon: "📖", title: "Access Data", desc: "Learn if data is being processed and obtain copy of data" },
                      { icon: "✏️", title: "Verify and Rectify", desc: "Verify accuracy and ask for updates or corrections" },
                      { icon: "⏸️", title: "Restrict Processing", desc: "Restrict processing of data for purposes other than storage" },
                      { icon: "🗑️", title: "Data Deletion", desc: "Obtain erasure of data from PDFTechno" },
                      { icon: "📤", title: "Data Portability", desc: "Receive data in structured, machine-readable format" },
                      { icon: "⚖️", title: "Lodge Complaint", desc: "Bring claim before competent data protection authority" }
                    ].map((right, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-blue-600">{right.icon}</span>
                        <div>
                          <span className="text-blue-700 text-sm font-medium">{right.title}:</span>
                          <span className="text-blue-700 text-sm"> {right.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">📞 How to Exercise Rights</h3>
                  <p className="text-yellow-700 text-sm">
                    Any requests to exercise user rights can be directed to PDFTechno through the contact details provided. Requests are free of charge and will be answered within one month, providing required information by law.
                  </p>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-800 mb-2">🎯 Right to Object to Marketing</h3>
                  <p className="text-orange-700 text-sm">
                    Where Personal Data is processed for direct marketing purposes, users can object to that processing at any time, free of charge and without providing justification.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 11: Cookies & Tracking */}
            <section id="section-11">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                11. Cookies & Tracking Technologies
              </h2>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-blue-800 text-center">
                  <strong>🍪 See our detailed Cookie Policy for comprehensive information about our use of cookies and tracking technologies.</strong>
                </p>
              </div>
            </section>

            {/* Section 12: Policy Changes */}
            <section id="section-12">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                12. Changes to the Privacy Policy
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">📝 Policy Updates</h3>
                <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                  <li>We reserve the right to amend this policy</li>
                  <li>Changes will be notified via email or website banners</li>
                  <li>Updates will be posted on this page</li>
                  <li>Continued use constitutes acceptance</li>
                  <li>New policy applies to your next visit</li>
                </ul>
              </div>
            </section>

            {/* Section 13: Contact Information */}
            <section id="section-13">
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                13. Contact Information
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4 text-center">📞 Grievance Officer</h3>
                <div className="grid gap-4 md:grid-cols-3 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Name:</p>
                    <p className="font-medium text-gray-800">[Name to be filled]</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email:</p>
                    <p className="font-medium text-gray-800">[Email to be filled]</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address:</p>
                    <p className="font-medium text-gray-800">[Address to be filled]</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Third-Party Services Details */}
            <section>
              <h2 className="text-2xl font-bold text-[#DA1F10] mb-4 border-b-2 border-red-100 pb-2">
                Additional Third-Party Service Details
              </h2>
              <div className="space-y-4">
                
                {/* Social Media Integration */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <button 
                    className="w-full text-left font-semibold text-blue-800 flex justify-between items-center"
                    onClick={() => toggleSection('social')}
                  >
                    📱 Social Media Integration
                    <span className="text-sm">{activeSection === 'social' ? '▼' : '▶'}</span>
                  </button>
                  {activeSection === 'social' && (
                    <div className="mt-3 space-y-3">
                      <div className="bg-white rounded p-3">
                        <h4 className="font-semibold text-blue-800 mb-2">Facebook Components</h4>
                        <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                          <li>Facebook plug-ins integrated on website</li>
                          <li>Operated by Facebook, Inc, Menlo Park, CA</li>
                          <li>Automatically downloads Facebook components when page accessed</li>
                          <li>Collects information about visited subpages</li>
                          <li>Users can prevent data transmission by logging out before visiting</li>
                        </ul>
                      </div>
                      
                      <div className="bg-white rounded p-3">
                        <h4 className="font-semibold text-blue-800 mb-2">Twitter Integration</h4>
                        <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                          <li>Twitter buttons integrated for content sharing</li>
                          <li>Operated by Twitter, Inc, San Francisco, CA</li>
                          <li>Enables users to disseminate website content</li>
                          <li>Collects data about specific subpage visits</li>
                        </ul>
                      </div>

                      <div className="bg-white rounded p-3">
                        <h4 className="font-semibold text-blue-800 mb-2">YouTube Components</h4>
                        <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                          <li>YouTube videos embedded on website</li>
                          <li>Operated by YouTube, LLC (Google subsidiary)</li>
                          <li>Automatically downloads video components</li>
                          <li>YouTube and Google informed of specific subpage visits</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Services */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <button 
                    className="w-full text-left font-semibold text-green-800 flex justify-between items-center"
                    onClick={() => toggleSection('google')}
                  >
                    🔍 Google Services
                    <span className="text-sm">{activeSection === 'google' ? '▼' : '▶'}</span>
                  </button>
                  {activeSection === 'google' && (
                    <div className="mt-3 space-y-3">
                      <div className="bg-white rounded p-3">
                        <h4 className="font-semibold text-green-800 mb-2">Google Remarketing</h4>
                        <ul className="text-green-700 text-sm space-y-1 list-disc list-inside">
                          <li>Feature of Google AdWords for targeted advertising</li>
                          <li>Displays ads to users who previously visited website</li>
                          <li>Creates user-related advertisements based on interests</li>
                          <li>Uses cookies to recognize returning visitors</li>
                        </ul>
                      </div>

                      <div className="bg-white rounded p-3">
                        <h4 className="font-semibold text-green-800 mb-2">Google AdWords</h4>
                        <ul className="text-green-700 text-sm space-y-1 list-disc list-inside">
                          <li>Internet advertising service for search results and display ads</li>
                          <li>Allows keyword-based ad placement</li>
                          <li>Uses conversion cookies (30-day validity)</li>
                          <li>Tracks ad effectiveness and generates visit statistics</li>
                        </ul>
                      </div>

                      <div className="bg-white rounded p-3">
                        <h4 className="font-semibold text-green-800 mb-2">Google reCAPTCHA</h4>
                        <ul className="text-green-700 text-sm space-y-1 list-disc list-inside">
                          <li>Protects input forms from automated abuse</li>
                          <li>Distinguishes human input from machine processing</li>
                          <li>Transmits referrer URL, IP address, user behavior data</li>
                          <li>Used to digitize books and optimize Google services</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                This privacy policy is effective as of the date specified above and complies with applicable Indian data protection laws.
              </p>
              <p className="text-xs text-gray-500">
                For any queries regarding this privacy policy, please contact our Grievance Officer using the details provided above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;