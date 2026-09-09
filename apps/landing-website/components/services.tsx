// components/Services.tsx
// Services section - shows what services FixMate offers

'use client';

import { useState } from 'react';
import Link from 'next/link';

const serviceCategories = [
  {
    name: 'Electrical',
    icon: '💡',
    services: [
      'Ceiling Fans',
      'Table Fans',
      'Exhaust Fans',
      'Mixer Grinders',
      'Induction Stoves',
      'Geysers',
      'Water Pumps',
    ],
  },
  {
    name: 'Home Appliances',
    icon: '🏠',
    services: [
      'Refrigerators',
      'Washing Machines',
      'Microwaves',
      'Chimneys',
      'Dishwashers',
      'Vacuum Cleaners',
      'Water Purifiers',
    ],
  },
  {
    name: 'Electronics',
    icon: '📺',
    services: [
      'LED/Smart TVs',
      'CCTV Cameras',
      'DVR/NVR Systems',
      'UPS/Inverters',
      'Laptops/Desktops',
      'Printers',
      'Routers',
    ],
  },
];

export default function Services() {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-lg text-gray-600">
            Expert repair services for all your devices
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {serviceCategories.map((category, index) => (
            <button
              key={index}
              onClick={() => setActiveCategory(index)}
              className={`px-6 py-3 rounded-full font-medium transition-colors ${
                activeCategory === index
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {serviceCategories[activeCategory].services.map((service, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-xl text-center hover:shadow-md transition-shadow"
            >
              <span className="text-2xl block mb-2">🔧</span>
              <span className="text-gray-800 font-medium">{service}</span>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link
            href="/services"
            className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-700"
          >
            View all services →
          </Link>
        </div>
      </div>
    </section>
  );
}