// components/Hero.tsx
// Hero section - the first thing users see
// This is a CLIENT COMPONENT

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic
    console.log('Searching for:', searchQuery);
  };

  return (
    <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      <div className="container mx-auto px-4 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Your Devices,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Expert Repairs
              </span>
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-lg">
              Connect with trusted technicians for repair and maintenance of electrical, 
              electronic, and mechanical devices. Get a complete digital service history.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="What needs repair? (e.g., Fan, AC, TV)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
              <button
                type="submit"
                className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Find Technician
              </button>
            </form>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-300">⭐⭐⭐⭐⭐</span>
                <span>4.8/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👥</span>
                <span>10,000+ Repairs</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">⏰</span>
                <span>24/7 Service</span>
              </div>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="hidden lg:block relative">
            <div className="relative w-full h-[400px]">
              <div className="absolute inset-0 bg-white/10 rounded-2xl backdrop-blur-sm p-8">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="bg-white/20 rounded-xl p-4 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-2">🔧</span>
                    <span className="text-sm font-medium">Expert Technicians</span>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-2">⚡</span>
                    <span className="text-sm font-medium">Quick Service</span>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-2">📱</span>
                    <span className="text-sm font-medium">Digital History</span>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 flex flex-col items-center justify-center">
                    <span className="text-4xl mb-2">💰</span>
                    <span className="text-sm font-medium">Best Price</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-white text-gray-900 p-4 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="font-semibold">24/7 Support</p>
                  <p className="text-sm text-gray-600">Emergency repairs available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}