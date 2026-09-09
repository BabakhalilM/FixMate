// components/Features.tsx
// Features section - shows what makes FixMate special

'use client';

// import { motion } from 'framer-motion';  // Optional: for animations
import Link from 'next/link';

const features = [
  {
    icon: '🔧',
    title: 'Expert Technicians',
    description: 'All technicians are verified, experienced, and rated by customers.',
  },
  {
    icon: '⚡',
    title: 'Quick Service',
    description: 'Get same-day service with real-time tracking of your repair status.',
  },
  {
    icon: '📱',
    title: 'Digital History',
    description: 'Complete digital service history with QR code access for every repair.',
  },
  {
    icon: '💰',
    title: 'Transparent Pricing',
    description: 'No hidden costs. Get estimates before any work begins.',
  },
  {
    icon: '🔒',
    title: 'Secure Payments',
    description: 'Multiple payment options with complete security.',
  },
  {
    icon: '🛡️',
    title: 'Warranty Protection',
    description: 'All repairs come with warranty and AMC options.',
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose <span className="text-indigo-600">FixMate</span>
          </h2>
          <p className="text-lg text-gray-600">
            We make device repair simple, transparent, and hassle-free
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 p-8 rounded-2xl hover:shadow-lg transition-shadow group"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Link */}
        <div className="text-center mt-12">
          <Link
            href="/services"
            className="inline-flex items-center text-indigo-600 font-semibold hover:text-indigo-700"
          >
            Learn more about our services →
          </Link>
        </div>
      </div>
    </section>
  );
}