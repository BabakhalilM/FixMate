// components/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Only the home page has a transparent/dark-hero navbar.
  // Every other page always shows the solid white navbar with dark text.
  const isHome = pathname === "/";

  // Detect scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Treat non-home pages the same as a "scrolled" state so text/logo
  // are always dark-on-white and stay visible.
  const useSolidStyle = !isHome || isScrolled;

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        useSolidStyle
          ? "bg-white shadow-md"
          : isMenuOpen
            ? "bg-white md:bg-transparent md:shadow-none"
            : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div
              className={`w-10 h-10 bg-indigo-600 ${
                useSolidStyle || isMenuOpen ? "bg-indigo-600" : "bg-white"
              } rounded-lg flex items-center justify-center`}
            >
              <span
                className={`${
                  useSolidStyle || isMenuOpen ? "text-white" : "text-indigo-600"
                } font-bold text-xl`}
              >
                F
              </span>
            </div>
            <span
              className={`text-2xl font-bold ${
                useSolidStyle || isMenuOpen ? "text-indigo-600" : "text-white"
              }`}
            >
              FixMate
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  pathname === link.href
                    ? "text-indigo-600 font-semibold"
                    : useSolidStyle
                      ? "text-gray-800 hover:text-indigo-600"
                      : "text-gray-100 hover:text-indigo-200"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className={`transition-colors ${
                  useSolidStyle
                    ? "text-gray-700 hover:text-indigo-600"
                    : "text-white hover:text-indigo-200"
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 hover:text-indigo-600"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className={`w-6 h-6 ${useSolidStyle ? "text-gray-700" : "text-white"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t bg-white">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 text-gray-700 hover:text-indigo-600 ${
                  pathname === link.href ? "text-indigo-600 font-semibold" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 space-y-2">
              <Link
                href="/login"
                className="block text-center text-indigo-600 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="block text-center bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
