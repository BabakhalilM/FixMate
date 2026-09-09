// app/page.tsx
// This is the home page - runs on the server by default
// This page is STATIC - content is generated at build time

import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Testimonials from '@/components/Testimonials';
import CTA from '@/components/CTA';
import Services from '@/components/services';

// Metadata for this page specifically
export const metadata = {
  title: 'Home',  // Will become "Home | FixMate"
};

export default function HomePage() {
  return (
    <>
      {/* Each section is a separate component for reusability */}
      <Hero />
      <Features />
      <Services />
      <Testimonials />
      <CTA />
    </>
  );
}