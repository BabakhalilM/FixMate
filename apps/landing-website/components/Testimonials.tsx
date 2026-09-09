// components/Testimonials.tsx
// Testimonials section - social proof

'use client';

import { useState } from 'react';

const testimonials = [
  {
    id: 1,
    name: 'Nasiha',
    role: 'Homeowner',
    image: '👩',
    content: 'FixMate fixed my AC in just 2 hours! The technician was professional and the pricing was transparent. Highly recommended!',
    rating: 5,
  },
  {
    id: 2,
    name: 'Rahul Verma',
    role: 'Business Owner',
    image: '👨',
    content: 'We use FixMate for all our office equipment repairs. Their service history tracking is incredibly useful for maintenance.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Ananya Patel',
    role: 'Homemaker',
    image: '👩',
    content: 'The digital warranty and QR code for each repair is genius! I can easily track all my device service history.',
    rating: 5,
  },
];

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-gray-600">
            Real reviews from real FixMate users
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-50 p-8 md:p-12 rounded-2xl relative">
            <div className="flex flex-col items-center text-center">
              <div className="text-6xl mb-4">{testimonials[currentIndex].image}</div>
              <div className="text-yellow-400 text-2xl mb-4">
                {'⭐'.repeat(testimonials[currentIndex].rating)}
              </div>
              <p className="text-lg text-gray-700 mb-6">
                "{testimonials[currentIndex].content}"
              </p>
              <div>
                <p className="font-bold text-gray-900">{testimonials[currentIndex].name}</p>
                <p className="text-gray-500">{testimonials[currentIndex].role}</p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prev}
                className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                ←
              </button>
              <button
                onClick={next}
                className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                →
              </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}