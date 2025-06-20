'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { submitContactForm, getContactSubjects } from '@/api/contact_api';

const ContactUs = () => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'general',
    message: ''
  });
  
  const [subjects, setSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});

  // Default subjects with translation keys
  const defaultSubjects = [
    { value: 'general', labelKey: 'contact.form.subjects.general' },
    { value: 'technical', labelKey: 'contact.form.subjects.technical' },
    { value: 'bug', labelKey: 'contact.form.subjects.bug' },
    { value: 'feature', labelKey: 'contact.form.subjects.feature' },
    { value: 'billing', labelKey: 'contact.form.subjects.billing' },
    { value: 'partnership', labelKey: 'contact.form.subjects.partnership' },
    { value: 'other', labelKey: 'contact.form.subjects.other' }
  ];

  // Load subject choices on component mount
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subjectChoices = await getContactSubjects();
        // If API returns subjects, use them, otherwise use default translated subjects
        if (subjectChoices && subjectChoices.length > 0) {
          setSubjects(subjectChoices);
        } else {
          setSubjects(defaultSubjects);
        }
      } catch (error) {
        console.error('Failed to load subjects:', error);
        // Fallback to default translated subjects
        setSubjects(defaultSubjects);
      }
    };
    loadSubjects();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('contact.form.validation.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('contact.form.validation.nameMinLength');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('contact.form.validation.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('contact.form.validation.emailInvalid');
    }
    
    if (!formData.message.trim()) {
      newErrors.message = t('contact.form.validation.messageRequired');
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('contact.form.validation.messageMinLength');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const result = await submitContactForm(formData);
      
      setSubmitStatus({
        type: 'success',
        message: result.message || t('contact.form.submit.success')
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: 'general',
        message: ''
      });
      
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error.message || t('contact.form.submit.error')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section - Clean and Simple */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('contact.header.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('contact.header.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-5 gap-16">
          
          {/* Contact Information - 2 columns */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('contact.info.title')}
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                {t('contact.info.description')}
              </p>
            </div>

            {/* Contact Info Cards */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#DA1F10] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {t('contact.info.cards.email.title')}
                  </h3>
                  <p className="text-gray-600">
                    {t('contact.info.cards.email.value')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#DA1F10] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {t('contact.info.cards.responseTime.title')}
                  </h3>
                  <p className="text-gray-600">
                    {t('contact.info.cards.responseTime.value')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-[#DA1F10] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {t('contact.info.cards.help.title')}
                  </h3>
                  <p className="text-gray-600">
                    {t('contact.info.cards.help.value')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form - 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                {t('contact.form.title')}
              </h3>
              
              {/* Success/Error Messages */}
              {submitStatus && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  submitStatus.type === 'success' 
                    ? 'bg-green-50 text-green-800 border-green-200' 
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-center">
                    {submitStatus.type === 'success' ? (
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{submitStatus.message}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name and Email in a row */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('contact.form.fields.name.label')} {t('contact.form.fields.name.required')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#DA1F10] focus:border-[#DA1F10] transition-colors ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('contact.form.fields.name.placeholder')}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('contact.form.fields.email.label')} {t('contact.form.fields.email.required')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#DA1F10] focus:border-[#DA1F10] transition-colors ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('contact.form.fields.email.placeholder')}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('contact.form.fields.subject.label')} {t('contact.form.fields.subject.required')}
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#DA1F10] focus:border-[#DA1F10] transition-colors"
                  >
                    {subjects.map((subject) => (
                      <option key={subject.value} value={subject.value}>
                        {subject.labelKey ? t(subject.labelKey) : subject.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('contact.form.fields.message.label')} {t('contact.form.fields.message.required')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#DA1F10] focus:border-[#DA1F10] transition-colors resize-none ${
                      errors.message ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('contact.form.fields.message.placeholder')}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    {t('contact.form.fields.message.characterCount', { count: formData.message.length })}
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#DA1F10] hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('contact.form.submit.sending')}
                    </div>
                  ) : (
                    t('contact.form.submit.button')
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;