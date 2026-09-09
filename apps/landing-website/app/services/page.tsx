// app/services/page.tsx
import Link from 'next/link';
import { serviceCategories } from '@/src/lib/data';

export const metadata = {
  title: 'Our Services',
  description: 'Expert repair services for electrical, electronic, and mechanical devices',
};

export default function ServicesPage() {
  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Services
          </h1>
          <p className="text-xl text-gray-600">
            Expert repair and maintenance services for all your devices
          </p>
        </div>

        {/* All Categories */}
        <div className="space-y-16">
          {serviceCategories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-4xl">{category.icon}</span>
                  {category.name}
                </h2>
                <Link
                  href={`/services/${category.slug}`}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                  View All →
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {category.services.slice(0, 8).map((service) => (
                  <Link
                    key={service.id}
                    href={`/services/${category.slug}/${service.slug}`}
                    className="bg-white p-6 rounded-xl hover:shadow-lg transition-all hover:-translate-y-1"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{service.icon}</div>
                      <h3 className="font-semibold text-gray-800">{service.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-indigo-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Need a Repair Not Listed?
          </h2>
          <p className="text-indigo-100 mb-6">
            Contact us and we'll find the right technician for you
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}