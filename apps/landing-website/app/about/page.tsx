// app/about/page.tsx
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'About Us',
  description: 'Learn about FixMate - your trusted repair service platform',
};

export default function AboutPage() {
  return (
    <div className="pt-20 bg-white min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About <span className="text-indigo-600">FixMate</span>
          </h1>
          <p className="text-xl text-gray-600">
            We're on a mission to make device repair simple, transparent, and reliable
          </p>
        </div>

        {/* Mission */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-600 mb-6">
              FixMate connects customers with trusted technicians for repair and maintenance 
              of electrical, electronic, and mechanical devices while maintaining a complete 
              digital service history.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span className="text-gray-700">Connect with verified technicians</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span className="text-gray-700">Transparent pricing with estimates</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span className="text-gray-700">Digital service history for every repair</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span className="text-gray-700">Warranty and AMC protection</span>
              </li>
            </ul>
          </div>
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/10 rounded-xl">
                <div className="text-4xl mb-2">10K+</div>
                <div className="text-sm">Repairs Done</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-xl">
                <div className="text-4xl mb-2">4.8</div>
                <div className="text-sm">Average Rating</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-xl">
                <div className="text-4xl mb-2">500+</div>
                <div className="text-sm">Technicians</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-xl">
                <div className="text-4xl mb-2">50+</div>
                <div className="text-sm">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Amit Kumar', role: 'CEO & Founder', image: '👨‍💼' },
              { name: 'Priya Sharma', role: 'Head of Operations', image: '👩‍💼' },
              { name: 'Rahul Verma', role: 'Lead Developer', image: '👨‍💻' },
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}