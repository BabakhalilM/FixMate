// app/terms/page.tsx
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="pt-20 min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-gray-600 mb-4">Last updated: January 2024</p>
        <div className="space-y-4 text-gray-700">
          <p>By using FixMate, you agree to these terms. Please read them carefully.</p>
          <h2 className="text-2xl font-semibold mt-6">1. Acceptance of Terms</h2>
          <p>By creating an account, you agree to these terms.</p>
          <h2 className="text-2xl font-semibold mt-6">2. Our Services</h2>
          <p>FixMate connects customers with technicians for repair services.</p>
        </div>
        <Link href="/" className="inline-block mt-8 text-indigo-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}