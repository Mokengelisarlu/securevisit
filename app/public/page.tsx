'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Toaster } from '@/components/ui/sonner';

// Cloned Sections
import Navigation from '@/features/landing/sections/Navigation';
import HeroSection from '@/features/landing/sections/HeroSection';
import FeaturesSection from '@/features/landing/sections/FeaturesSection';
import HowItWorksSection from '@/features/landing/sections/HowItWorksSection';
import SecuritySection from '@/features/landing/sections/SecuritySection';
import IntegrationsSection from '@/features/landing/sections/IntegrationsSection';
import UseCasesSection from '@/features/landing/sections/UseCasesSection';
import TestimonialSection from '@/features/landing/sections/TestimonialSection';
import AccountCTASection from '@/features/landing/sections/AccountCTASection';
import ContactSection from '@/features/landing/sections/ContactSection';
import Footer from '@/features/landing/sections/Footer';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait for all sections to mount before setting up global snap
    const timer = setTimeout(() => {
      const pinned = ScrollTrigger.getAll()
        .filter(st => st.vars.pin)
        .sort((a, b) => a.start - b.start);

      const maxScroll = ScrollTrigger.maxScroll(window);
      if (!maxScroll || pinned.length === 0) return;

      const pinnedRanges = pinned.map(st => ({
        start: st.start / maxScroll,
        end: (st.end ?? st.start) / maxScroll,
        center: (st.start + ((st.end ?? st.start) - st.start) * 0.5) / maxScroll,
      }));

      ScrollTrigger.create({
        snap: {
          snapTo: (value: number) => {
            const inPinned = pinnedRanges.some(
              r => value >= r.start - 0.02 && value <= r.end + 0.02
            );
            if (!inPinned) return value;

            const target = pinnedRanges.reduce(
              (closest, r) =>
                Math.abs(r.center - value) < Math.abs(closest - value)
                  ? r.center
                  : closest,
              pinnedRanges[0]?.center ?? 0
            );
            return target;
          },
          duration: { min: 0.15, max: 0.35 },
          delay: 0,
          ease: 'power2.out',
        },
      });
    }, 500);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div ref={mainRef} className="relative">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Toast notifications */}
      <Toaster position="top-center" />

      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <main className="relative">
        <HeroSection className="z-10" />
        <FeaturesSection className="z-20" />
        <HowItWorksSection className="z-30" />
        <SecuritySection className="z-40" />
        <IntegrationsSection className="z-50" />
        <UseCasesSection className="z-60" />
        <TestimonialSection className="z-70" />
        <AccountCTASection className="z-80" />
        <ContactSection className="z-90" />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
