'use client';
import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sparkles, FileText, Zap, Shield, Download, Edit3, Palette, RefreshCw } from 'lucide-react';

const TestimonialsSection = () => {
    const [currentTestimonial, setCurrentTestimonial] = useState(0);

    // Testimonials data
    const testimonials = [
        {
            id: 1,
            name: "Ankit Singh",
            designation: "Key Product Manager",
            image: "/images/testimonials/2.jpeg",
            review: "PDFTechno has revolutionized how our team handles documents. The merge and compress tools save us hours every week.",
            rating: 5
        },
        {
            id: 2,
            name: "Anam Azami",
            designation: "Category Manager",
            image: "/images/testimonials/1.png",
            review: "The ability to split and organize PDFs seamlessly has made my workflow incredibly efficient. Highly recommend!",
            rating: 5
        },
        {
            id: 3,
            name: "Deepak Kumar",
            designation: "Design Professional",
            image: "/images/testimonials/4.png",
            review: "The password protection features are game-changers for our legal documents. Everything works flawlessly.",
            rating: 5
        },
        {
            id: 4,
            name: "Ali Sher Waris",
            designation: "Sourcing Manager, Gap Inc.",
            image: "/images/testimonials/6.jpeg",
            review: "What sets PDFTechno apart is its simplicity. I use it daily to convert Excel sheets to PDF, and the output quality is consistently excellent. No more formatting issues!",
            rating: 5
        }
    ];

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
        <><AIPowered/>
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                        User Testimonials
                    </h2>
                    <p className="text-gray-600">
                        What our users say about PDF Techno
                    </p>
                </div>

                {/* Testimonial Card */}
                <div className="max-w-4xl mx-auto">
                    <div className="relative rounded-xl p-4 border border-gray-100">
                        {/* Navigation Arrows */}

                        {/* Content */}
                        <div className="flex justify-center items-center gap-6 px-8">
                            {/* User Image */}

                            {/* Review Content */}
                            <div className="flex-1 text-center">
                                {/* Stars */}
                                <div className="flex-shrink-0 flex justify-center mb-4">
                                    <img
                                        src={testimonials[currentTestimonial].image}
                                        alt={testimonials[currentTestimonial].name}
                                        className="w-20 h-20 rounded-full object-cover border-2 border-red-100"
                                    />
                                </div>
                                <div className="flex justify-center  mb-3">
                                    {renderStars(testimonials[currentTestimonial].rating)}
                                </div>

                                {/* Review Text */}
                                <p className="text-gray-700 text-2xl mb-4 italic leading-relaxed">
                                    "{testimonials[currentTestimonial].review}"
                                </p>

                                {/* User Info */}
                                <div>
                                    <h4 className="font-semibold text-gray-800 text-2xl">
                                        {testimonials[currentTestimonial].name}
                                    </h4>
                                    <p className="text-red-600 font-medium">
                                        {testimonials[currentTestimonial].designation}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dots Navigation */}
                    <div className="flex justify-center mt-6 space-x-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 ${index === currentTestimonial
                                        ? 'bg-red-500 w-6'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
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
    return (
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-24 justify-between mt-4 p-4 lg:p-8 bg-white rounded-lg">
            {/* Image Section */}
            <div className="flex-shrink-0 w-full lg:w-auto">
                <img
                    src="/images/ai_image.png"
                    alt="AI Powered"
                    className="w-full h-48 lg:h-full object-cover rounded-lg shadow-sm"
                />
            </div>
            
            {/* Content Section */}
            <div className="flex-1 space-y-4 text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full text-sm font-medium text-red-700">
                    <Sparkles className="w-4 h-4" />
                    AI Powered
                </div>
                
                {/* Heading */}
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Free AI powered PDF Tool
                </h1>
                
                {/* Description */}
                <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                    Effortlessly manage and transform your PDF documents with our advanced AI-powered tool. 
                    Designed for simplicity and efficiency, our tool offers a range of features to handle all your PDF needs with ease.
                </p>
                
                <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
                    Experience seamless document management and transformation with the power of artificial intelligence. 
                    From editing and signing to converting and organizing, our tool provides a comprehensive solution for your PDF tasks.
                </p>
                
                {/* CTA Button */}
                <div className="pt-2">
                    <button className="w-full sm:w-auto px-6 py-3 bg-red-600 cursor-pointer hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
                        Get Started Free
                    </button>
                </div>
            </div>
        </div>
    );
}