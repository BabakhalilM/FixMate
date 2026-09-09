// app/blog/page.tsx
import Link from 'next/link';

export default function BlogPage() {
  const posts = [
    { id: 1, title: '5 Signs Your AC Needs Servicing', slug: 'ac-servicing' },
    { id: 2, title: 'How to Extend Refrigerator Life', slug: 'refrigerator-life' },
    { id: 3, title: 'Understanding Warranty and AMC', slug: 'warranty-amc' },
  ];

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-6">Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
              <Link href={`/blog/${post.slug}`} className="text-indigo-600 hover:underline">
                Read More →
              </Link>
            </div>
          ))}
        </div>
        <Link href="/" className="inline-block mt-8 text-indigo-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}