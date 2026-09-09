// app/layout.tsx
// This is the root layout - wraps ALL pages
// Runs on the server

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/src/lib/auth-context";

// Load Google Font
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

// Metadata for SEO - This appears in search results
export const metadata: Metadata = {
  title: {
    default: "FixMate - Smart Service & Repair Platform",
    template: "%s | FixMate", // %s will be replaced with page title
  },
  description:
    "Connect with trusted technicians for repair and maintenance of electrical, electronic, and mechanical devices.",
  keywords: [
    "repair",
    "service",
    "technician",
    "electrical",
    "electronics",
    "home appliances",
  ],
  authors: [{ name: "FixMate" }],
  openGraph: {
    title: "FixMate - Smart Service & Repair Platform",
    description: "Connect with trusted technicians for all your repair needs",
    url: "https://fixmate.com",
    siteName: "FixMate",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FixMate - Smart Service & Repair Platform",
    description: "Connect with trusted technicians for all your repair needs",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-gray-50`}>
        
        <AuthProvider>
          <Navbar />

          {/* Main content area - each page's content goes here */}
          <main className="min-h-screen">{children}</main>

          {/* Footer appears on ALL pages */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
