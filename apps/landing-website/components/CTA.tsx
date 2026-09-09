// components/CTA.tsx
// Call to Action - Final section before footer

import Link from 'next/link';

export default function CTA() {
  return (
    <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Get Your Device Fixed?
        </h2>
        <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
          Join thousands of satisfied customers. Book your repair today!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Now
          </Link>
          <Link
            href="/services"
            className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
          >
            Explore Services
          </Link>
        </div>
        <p className="text-sm text-indigo-200 mt-6">
          🚀 No registration fee. Free estimates.
        </p>
      </div>
    </section>
  );
}