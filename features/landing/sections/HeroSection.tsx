'use client';
import { useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play, Tablet, Bell, Printer } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  className?: string;
}

const HeroSection = ({ className = '' }: HeroSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const photoCardRef = useRef<HTMLDivElement>(null);
  const contentCardRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLElement | null)[]>([]);

  // Auto-play entrance animation on mount
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Initial states
      gsap.set([photoCardRef.current, contentCardRef.current], {
        opacity: 0,
        scale: 0.98,
      });
      gsap.set(photoCardRef.current, { x: -40 });
      gsap.set(contentCardRef.current, { x: 40 });
      gsap.set(accentRef.current, { opacity: 0, scale: 0.6, rotation: -6 });
      gsap.set(textRefs.current, { opacity: 0, y: 18 });

      // Entrance animation
      tl.to([photoCardRef.current, contentCardRef.current], {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.8,
        stagger: 0.1,
      })
        .to(
          accentRef.current,
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.6,
          },
          '-=0.5'
        )
        .to(
          textRefs.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
          },
          '-=0.4'
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Scroll-driven exit animation
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onLeaveBack: () => {
            // Reset all elements to visible when scrolling back to top
            gsap.to([photoCardRef.current, contentCardRef.current], {
              opacity: 1,
              x: 0,
              duration: 0.3,
            });
            gsap.to(accentRef.current, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.3,
            });
          },
        },
      });

      // EXIT phase (70% - 100%)
      scrollTl
        .fromTo(
          photoCardRef.current,
          { x: 0, opacity: 1 },
          { x: '-18vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          contentCardRef.current,
          { x: 0, opacity: 1 },
          { x: '18vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          accentRef.current,
          { y: 0, scale: 1, opacity: 1 },
          { y: '-10vh', scale: 0.85, opacity: 0, ease: 'power2.in' },
          0.7
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={`section-pinned overflow-hidden relative ${className}`}
      style={{
        backgroundColor: '#F0FDFA',
        backgroundImage: 'radial-gradient(circle at top left, #E0F2FE 0%, transparent 50%), radial-gradient(circle at bottom right, #E0F2FE 0%, transparent 50%)',
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

      {/* Background Particles (same as kiosk) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#0DBDB5]"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              opacity: Math.random() * 0.3 + 0.1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 8}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>
      <div className="relative w-full h-full flex items-center justify-center px-4 sm:px-6 lg:px-0">
        {/* Left Photo Card */}
        <div
          ref={photoCardRef}
          className="absolute left-[6vw] top-[14vh] w-[42vw] h-[72vh] card-white card-shadow hidden lg:flex flex-col items-center justify-center p-12 bg-white rounded-[2.5rem] border border-[#0E1116]/5 shadow-xl"
        >
          <div className="w-48 h-48 md:w-64 md:h-64 relative mb-10 group-hover:scale-105 transition-transform duration-500">
            <img
              src="/icon-512x512.png"
              alt="SecureVisit Icon"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-[#0E1116] drop-shadow-sm">
            Secure<span className="text-[#0DBDB5]">Visit</span>
          </h2>
        </div>

        {/* Mobile Photo */}
        <div className="absolute inset-0 lg:hidden flex flex-col items-center justify-center bg-white">
          <div className="w-32 h-32 relative mb-6">
            <img
              src="/icon-512x512.png"
              alt="SecureVisit Icon"
              className="w-full h-full object-contain opacity-20"
            />
          </div>
        </div>

        {/* Accent Square */}
        <div
          ref={accentRef}
          className="absolute left-[46vw] top-[46vh] w-[8vw] h-[8vw] accent-square hidden lg:block"
          style={{ zIndex: 5 }}
        />

        {/* Right Content Card */}
        <div
          ref={contentCardRef}
          className="absolute left-[52vw] top-[14vh] w-[42vw] h-[72vh] card-white hidden lg:flex flex-col justify-between p-[6vh_3.5vw]"
          style={{ zIndex: 10 }}
        >
          {/* Top Content */}
          <div>
            <span
              ref={(el) => { textRefs.current[0] = el; }}
              className="eyebrow block mb-6"
            >
              SYSTÈME DE GESTION DES VISITEURS
            </span>
            <h1
              ref={(el) => { textRefs.current[1] = el; }}
              className="text-4xl xl:text-5xl font-semibold text-teal-800 leading-tight tracking-tight mb-6"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Gérez vos visiteurs en toute sécurité
            </h1>
            <p
              ref={(el) => { textRefs.current[2] = el; }}
              className="text-lg text-[#6B7280] leading-relaxed mb-8"
            >
              Enregistrement en quelques secondes. Alertes instantanées aux hôtes. Journaux conformes aux normes.
            </p>

            <div
              ref={(el) => { textRefs.current[3] = el; }}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <Button
                asChild
                className="bg-[#0DBDB5] hover:bg-[#0CA8A0] text-white px-10 py-7 md:py-8 rounded-full text-base md:text-xl font-black btn-hover shadow-lg shadow-[#0DBDB5]/20"
              >
                <Link href="/sign-up">Créer un compte </Link>
              </Button>
            </div>
          </div>

        </div>

        {/* Mobile Content */}
        <div className="relative z-10 lg:hidden px-6 py-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 relative">
              <img src="/icon-512x512.png" alt="Icon" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-[#0E1116]">
              Secure<span className="text-[#0DBDB5]">Visit</span>
            </h2>
          </div>
          <span className="eyebrow block mb-4 font-bold tracking-[0.2em]">SYSTÈME DE GESTION DES VISITEURS</span>
          <h1
            className="text-3xl sm:text-4xl font-semibold text-[#0E1116] leading-tight tracking-tight mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Une réception plus calme et plus sécurisée.
          </h1>
          <p className="text-base text-[#6B7280] leading-relaxed mb-6">
            Enregistrement en quelques secondes. Alertes instantanées aux hôtes. Journaux conformes aux normes.
          </p>
          <div className="flex flex-col gap-3 mb-6">
            <Button
              asChild
              className="bg-[#0DBDB5] hover:bg-[#0CA8A0] text-white px-8 py-7 rounded-full text-lg font-black shadow-lg shadow-[#0DBDB5]/20"
            >
              <Link href="/sign-up">Créer un compte </Link>
            </Button>
            <button
              onClick={() => scrollToSection('#howitworks')}
              className="flex items-center justify-center gap-2 text-sm font-medium text-[#6B7280] hover:text-[#0DBDB5] transition-colors"
            >
              <Play className="w-4 h-4" />
              Voir comment ça marche
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0DBDB5]/10 flex items-center justify-center flex-shrink-0">
                <Tablet className="w-5 h-5 text-[#0DBDB5]" />
              </div>
              <span className="text-sm font-medium text-[#0E1116]">
                Borne libre-service
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0DBDB5]/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-[#0DBDB5]" />
              </div>
              <span className="text-sm font-medium text-[#0E1116]">
                Notification auto
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0DBDB5]/10 flex items-center justify-center flex-shrink-0">
                <Printer className="w-5 h-5 text-[#0DBDB5]" />
              </div>
              <span className="text-sm font-medium text-[#0E1116]">
                Impression de badges
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Centered Footer Attribution */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-3 opacity-80 hover:opacity-100 transition-all duration-300">
          <div className="w-8 h-8 relative overflow-hidden rounded-lg border border-[#0DBDB5]/20 p-1.5 bg-white shadow-sm ring-1 ring-black/5">
            <img
              src="/images/logo.png"
              alt="MOKENGELI Logo"
              className="w-full h-full object-contain grayscale hover:grayscale-0 transition-all"
            />
          </div>
          <span className="text-teal-700 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase">
            Powered by <span className="text-teal-950 font-black">Mokengeli Sarlu</span>
          </span>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.2; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.4; }
          50% { transform: translateY(-40px) translateX(-10px); opacity: 0.6; }
          75% { transform: translateY(-20px) translateX(15px); opacity: 0.3; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
