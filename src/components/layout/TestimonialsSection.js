'use client';
import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sparkles, FileText, Zap, Shield, Download, Edit3, Palette, RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n';

const TestimonialsSection = () => {
    const { t } = useI18n();
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    // Testimonials data with translation keys
    const testimonials = [
        {
            id: 1,
            nameKey: "home.testimonials.users.ankit.name",
            designationKey: "home.testimonials.users.ankit.designation",
            image: "/images/testimonials/2.jpeg",
            reviewKey: "home.testimonials.users.ankit.review",
            rating: 5
        },
        {
            id: 2,
            nameKey: "home.testimonials.users.anam.name",
            designationKey: "home.testimonials.users.anam.designation",
            image: "/images/testimonials/1.png",
            reviewKey: "home.testimonials.users.anam.review",
            rating: 5
        },
        {
            id: 3,
            nameKey: "home.testimonials.users.deepak.name",
            designationKey: "home.testimonials.users.deepak.designation",
            image: "/images/testimonials/4.png",
            reviewKey: "home.testimonials.users.deepak.review",
            rating: 5
        },
        {
            id: 4,
            nameKey: "home.testimonials.users.ali.name",
            designationKey: "home.testimonials.users.ali.designation",
            image: "/images/testimonials/6.jpeg",
            reviewKey: "home.testimonials.users.ali.review",
            rating: 5
        }
    ];

    // Auto-slide functionality
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(interval);
    }, [isAutoPlaying, testimonials.length]);

    // Pause auto-play on hover
    const handleMouseEnter = () => {
        setIsAutoPlaying(false);
    };

    // Resume auto-play on mouse leave
    const handleMouseLeave = () => {
        setIsAutoPlaying(true);
    };

    const goToNext = () => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    };

    const goToPrevious = () => {
        setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const goToSlide = (index) => {
        setCurrentTestimonial(index);
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                size={16}
                className={`${i < rating ? 'text-red-500 fill-current' : 'text-gray-300'
                    }`}
            />
        ));
    };

    return (
        <>
            <AIPowered />
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    {/* Section Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                            {t('home.testimonials.title')}
                        </h2>
                        <p className="text-gray-600">
                            {t('home.testimonials.subtitle')}
                        </p>
                    </div>

                    {/* Testimonial Card */}
                    <div className="max-w-4xl mx-auto">
                        <div 
                            className="relative rounded-xl p-4 border border-gray-100 bg-white shadow-lg"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            {/* Navigation Arrows */}
                            <button
                                onClick={goToPrevious}
                                className="absolute left-2 cursor-pointer top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50"
                                aria-label={t('home.testimonials.navigation.previous')}
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>

                            <button
                                onClick={goToNext}
                                className="absolute right-2 top-1/2 cursor-pointer transform -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50"
                                aria-label={t('home.testimonials.navigation.next')}
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            </button>

                            {/* Content */}
                            <div className="flex justify-center items-center gap-6 px-12 py-8">
                                {/* Review Content */}
                                <div className="flex-1 text-center">
                                    {/* User Image */}
                                    <div className="flex-shrink-0 flex justify-center mb-6">
                                        <img
                                            src={testimonials[currentTestimonial].image}
                                            alt={t(testimonials[currentTestimonial].nameKey)}
                                            className="w-20 h-20 rounded-full object-cover border-4 border-red-100 shadow-md"
                                        />
                                    </div>

                                    {/* Stars */}
                                    <div className="flex justify-center mb-4">
                                        {renderStars(testimonials[currentTestimonial].rating)}
                                    </div>

                                    {/* Review Text */}
                                    <p className="text-gray-700 text-xl md:text-2xl mb-6 italic leading-relaxed">
                                        "{t(testimonials[currentTestimonial].reviewKey)}"
                                    </p>

                                    {/* User Info */}
                                    <div>
                                        <h4 className="font-semibold text-gray-800 text-xl md:text-2xl">
                                            {t(testimonials[currentTestimonial].nameKey)}
                                        </h4>
                                        <p className="text-red-600 font-medium">
                                            {t(testimonials[currentTestimonial].designationKey)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Dots Navigation */}
                        <div className="flex justify-center mt-8 space-x-3">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`h-3 rounded-full cursor-pointer transition-all duration-300 ${
                                        index === currentTestimonial
                                            ? 'bg-red-500 w-8'
                                            : 'bg-gray-300 hover:bg-gray-400 w-3'
                                    }`}
                                    aria-label={t('home.testimonials.navigation.goToSlide', { number: index + 1 })}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default TestimonialsSection;

function AIPowered() {
    const { t } = useI18n();
    
    return (
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-24 justify-between mt-4 p-4 lg:p-8 bg-white rounded-lg">
            {/* Image Section */}
            <div className="flex-shrink-0 w-full lg:w-auto">
                <img
                    src="/images/ai_image.png"
                    alt={t('home.aiPowered.imageAlt')}
                    className="w-full h-48 lg:h-full object-cover rounded-lg shadow-sm"
                />
            </div>
            
            {/* Content Section */}
            <div className="flex-1 space-y-4 text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-sm font-medium text-red-700">
                    <Sparkles className="w-4 h-4" />
                    {t('home.aiPowered.badge')}
                </div>
                
                {/* Heading */}
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {t('home.aiPowered.title')}
                </h1>
                
                {/* Description */}
                <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                    {t('home.aiPowered.description1')}
                </p>
                
                <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                    {t('home.aiPowered.description2')}
                </p>
            </div>
        </div>
    );
}