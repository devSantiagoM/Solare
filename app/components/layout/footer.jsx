'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

export function Footer() {
  // Refs para los iconos
  const facebookRef = useRef(null);
  const instagramRef = useRef(null);
  const linkedinRef = useRef(null);

  useEffect(() => {
    // Animación inicial de aparición desde abajo
    gsap.from([facebookRef.current, instagramRef.current, linkedinRef.current], {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      duration: 0.5,
      ease: "power3.out",
    });

    // Animación de hover
    const icons = [
      facebookRef.current,
      instagramRef.current,
      linkedinRef.current
    ];

    icons.forEach((icon) => {
      icon.addEventListener('mouseenter', () => {
        gsap.to(icon, { scale: 1.1, rotation: 5, duration: 0.3 });
      });
      icon.addEventListener('mouseleave', () => {
        gsap.to(icon, { scale: 1, rotation: 0, duration: 0.3 });
      });
    });
  }, []);

  return (
    <footer className="bg-[#001427] text-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-12">
          <div className="flex-1">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Discover the Difference
            </h2>
            <p className="text-lg text-white/80 max-w-md">
              Experience innovative telecommunications solutions that connect communities and empower businesses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 lg:gap-16">
            <div className="min-w-[200px]">
              <h3 className="text-xl font-semibold mb-4 text-[#F4D03F]">Quienes Somos?</h3>
              <ul className="space-y-3">
                <li><Link href="/about-us" className="text-white/80 hover:text-white transition-colors">Sobre Nosotros</Link></li>
                <li><Link href="/what-we-do" className="text-white/80 hover:text-white transition-colors">Que Hacemos?</Link></li>
                <li><Link href="/faqs" className="text-white/80 hover:text-white transition-colors">FAQs</Link></li>
              </ul>
            </div>

            <div className="min-w-[200px]">
              <h3 className="text-xl font-semibold mb-4 text-[#F4D03F]">Novedades</h3>
              <ul className="space-y-3">
                <li><Link href="/residential" className="text-white/80 hover:text-white transition-colors">Mujeres</Link></li>
                <li><Link href="/business" className="text-white/80 hover:text-white transition-colors">Niñas/os</Link></li>
                <li><Link href="/hospitality" className="text-white/80 hover:text-white transition-colors">Hombres</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          <Link href="/contact" className="text-3xl md:text-4xl font-bold text-white hover:text-[#F4D03F] transition-colors underline underline-offset-4">
            Contact Us
          </Link>

          <div className="flex gap-6">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              ref={facebookRef}
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white p-4 rounded-full shadow-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              ref={instagramRef}
              className="bg-gradient-to-r from-[#E4405F] to-[#C13584] hover:from-[#D63384] hover:to-[#B02A37] text-white p-4 rounded-full shadow-lg transition-all"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              ref={linkedinRef}
              className="bg-[#0A66C2] hover:bg-[#004182] text-white p-4 rounded-full shadow-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            © 2025 Solare. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-white/60 hover:text-white text-sm transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-white/60 hover:text-white text-sm transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
