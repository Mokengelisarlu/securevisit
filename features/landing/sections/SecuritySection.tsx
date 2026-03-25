import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Eye, Camera, Lock, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface SecuritySectionProps {
  className?: string;
}

const SecuritySection = ({ className = '' }: SecuritySectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftPhotoRef = useRef<HTMLDivElement>(null);
  const rightCardRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<(HTMLElement | null)[]>([]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0% - 30%)
      scrollTl
        .fromTo(
          leftPhotoRef.current,
          { x: '-60vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo(
          rightCardRef.current,
          { x: '40vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo(
          accentRef.current,
          { scale: 0.5, rotation: -8, opacity: 0 },
          { scale: 1, rotation: 0, opacity: 1, ease: 'none' },
          0.1
        )
        .fromTo(
          textRefs.current,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.02, ease: 'none' },
          0.1
        );

      // SETTLE (30% - 70%) - hold positions

      // EXIT (70% - 100%)
      scrollTl
        .fromTo(
          leftPhotoRef.current,
          { x: 0, opacity: 1 },
          { x: '-10vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          rightCardRef.current,
          { x: 0, opacity: 1 },
          { x: '10vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          accentRef.current,
          { y: 0, opacity: 1 },
          { y: '-10vh', opacity: 0, ease: 'power2.in' },
          0.7
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const securityFeatures = [
    { icon: Eye, text: 'Dépistage de listes de surveillance' },
    { icon: Camera, text: 'Correspondance ID et capture photo' },
    { icon: Lock, text: 'Journaux chiffrés avec horodatage' },
    { icon: Users, text: 'Accès basé sur les rôles' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="security"
      className={`section-pinned bg-[#F4F6F8] node-pattern ${className}`}
    >
      <div className="relative w-full h-full flex items-center justify-center px-4 sm:px-6 lg:px-0">
        {/* Large Left Photo */}
        <div
          ref={leftPhotoRef}
          className="absolute left-[6vw] top-[14vh] w-[56vw] h-[72vh] card-media card-shadow hidden lg:block"
        >
          <img
            src="/images/security_id_check.jpg"
            alt="Professionnel de sécurité à la réception"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Accent Square */}
        <div
          ref={accentRef}
          className="absolute left-[58vw] top-[44vh] w-[8vw] h-[8vw] accent-square hidden lg:block"
          style={{ zIndex: 5 }}
        />

        {/* Right White Info Card */}
        <div
          ref={rightCardRef}
          className="absolute left-[64vw] top-[14vh] w-[30vw] h-[72vh] card-white hidden lg:flex flex-col p-[5vh_2.5vw]"
          style={{ zIndex: 10 }}
        >
          <span
            ref={(el) => { textRefs.current[0] = el; }}
            className="eyebrow block mb-4"
          >
            SÉCURITÉ
          </span>
          <h2
            ref={(el) => { textRefs.current[1] = el; }}
            className="text-2xl xl:text-3xl font-semibold text-[#0E1116] leading-tight tracking-tight mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Conçu pour garder votre lieu de travail sécurisé.
          </h2>
          <p
            ref={(el) => { textRefs.current[2] = el; }}
            className="text-sm text-[#6B7280] leading-relaxed mb-6"
          >
            Vérifications de listes de surveillance, vérification d'identité et journaux inviolables—sans ralentir le hall.
          </p>

          {/* Security Features */}
          <div
            ref={(el) => { textRefs.current[3] = el; }}
            className="space-y-3 mb-6"
          >
            {securityFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#1E6EE6]/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-[#1E6EE6]" />
                </div>
                <span className="text-sm text-[#0E1116]">{feature.text}</span>
              </div>
            ))}
          </div>

          <div ref={(el) => { textRefs.current[4] = el; }}>
            <Button
              onClick={() => scrollToSection('#contact')}
              className="bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white px-6 py-3 rounded-full text-sm font-medium btn-hover"
            >
              Voir les détails de sécurité
            </Button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="relative z-10 lg:hidden px-6 py-20 w-full">
          <div className="card-media card-shadow h-64 mb-6">
            <img
              src="/images/security_id_check.jpg"
              alt="Professionnel de sécurité"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="card-white p-6">
            <span className="eyebrow block mb-4">SÉCURITÉ</span>
            <h2
              className="text-2xl sm:text-3xl font-semibold text-[#0E1116] leading-tight tracking-tight mb-4"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Conçu pour garder votre lieu de travail sécurisé.
            </h2>
            <p className="text-base text-[#6B7280] leading-relaxed mb-6">
              Vérifications de listes de surveillance, vérification d'identité et journaux inviolables—sans ralentir le hall.
            </p>

            <div className="space-y-3 mb-6">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#1E6EE6]/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-[#1E6EE6]" />
                  </div>
                  <span className="text-sm text-[#0E1116]">{feature.text}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => scrollToSection('#contact')}
              className="bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white px-6 py-3 rounded-full text-sm font-medium"
            >
              Voir les détails de sécurité
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
