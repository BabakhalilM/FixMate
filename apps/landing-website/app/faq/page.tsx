// app/faq/page.tsx
'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'What services does FixMate offer?',
    answer: 'FixMate offers repair services for electrical devices (fans, motors, pumps), home appliances (refrigerators, AC, washing machines), and electronics (TV, laptops, CCTV).',
  },
  {
    question: 'How do I book a repair?',
    answer: 'Simply search for your device, select a technician, choose a time slot, and confirm your booking. You\'ll get real-time updates on your repair status.',
  },
  {
    question: 'Are the technicians verified?',
    answer: 'Yes! All technicians are background verified, have relevant experience, and are rated by customers. You can see their ratings and reviews before booking.',
  },
  {
    question: 'What is the warranty on repairs?',
    answer: 'All repairs come with a warranty. The duration varies by service type. You also get a digital warranty card with QR code for easy access.',
  },
  {
    question: 'How does the digital service history work?',
    answer: 'Every repair gets a unique QR code. Scan it to access complete service history, invoices, warranty details, and technician information.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept UPI, credit/debit cards, net banking, and cash. You can also use our wallet for faster payments.',
  },
];

// export const metadata = {
//   title: 'FAQ',
//   description: 'Frequently asked questions about FixMate services',
// };

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="pt-20 bg-white min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600">
              Find answers to common questions about FixMate
            </p>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <span className="text-2xl text-indigo-600">
                    {openIndex === index ? '−' : '+'}
                  </span>
                </button>
                {openIndex === index && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Still have questions */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <a
              href="/contact"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}