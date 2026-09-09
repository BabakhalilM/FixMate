// app/services/[category]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serviceCategories } from '@/src/lib/data';

// Generate static paths for all categories
export async function generateStaticParams() {
  return serviceCategories.map((category) => ({
    category: category.slug,
  }));
}

// Get category data
function getCategory(slug: string) {
  return serviceCategories.find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: { params: { category: string } }) {
  const category = getCategory(params.category);
  if (!category) return { title: 'Category Not Found' };
  
  return {
    title: `${category.name} Repair Services`,
    description: `Professional ${category.name.toLowerCase()} repair services by expert technicians`,
  };
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = getCategory(params.category);
  
  if (!category) {
    notFound();
  }

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/services" className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 mb-4">
            ← Back to Services
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{category.icon}</span>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                {category.name} Repair
              </h1>
              <p className="text-xl text-gray-600 mt-2">
                Professional repair services for all {category.name.toLowerCase()} devices
              </p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {category.services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl p-6 hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-4xl mb-3">{service.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                  ⭐ 4.8 Rating
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                  🚀 100+ Repairs
                </span>
              </div>
              <Link
                href={`/services/${category.slug}/${service.slug}`}
                className="mt-4 inline-block text-indigo-600 font-semibold hover:text-indigo-700"
              >
                Book Now →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}