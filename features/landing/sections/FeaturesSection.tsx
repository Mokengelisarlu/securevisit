import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Check, Link2, Shield, Eye, Bell, Printer, FileText } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface FeaturesSectionProps {
  className?: string;
}

const FeaturesSection = ({ className = '' }: FeaturesSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const topRightRef = useRef<HTMLDivElement>(null);
  const bottomRightRef = useRef<HTMLDivElement>(null);
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
          leftPanelRef.current,
          { x: '-50vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo(
          topRightRef.current,
          { x: '50vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo(
          bottomRightRef.current,
          { x: '50vw', y: '20vh', opacity: 0 },
          { x: 0, y: 0, opacity: 1, ease: 'none' },
          0.05
        )
        .fromTo(
          accentRef.current,
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, ease: 'none' },
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
          leftPanelRef.current,
          { x: 0, opacity: 1 },
          { x: '-12vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          topRightRef.current,
          { x: 0, opacity: 1 },
          { x: '12vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          bottomRightRef.current,
          { x: 0, opacity: 1 },
          { x: '12vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          accentRef.current,
          { y: 0, opacity: 1 },
          { y: '-8vh', opacity: 0, ease: 'power2.in' },
          0.7
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = [
    { icon: Link2, text: 'Liens de pré-enregistrement' },
    { icon: Shield, text: 'Vérification d\'identité' },
    { icon: Eye, text: 'Dépistage de listes de surveillance' },
    { icon: Bell, text: 'Notifications aux hôtes' },
    { icon: Printer, text: 'Impression de badges' },
    { icon: FileText, text: 'Exports de conformité' },
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
      id="features"
      className={`section-pinned bg-[#F4F6F8] node-pattern ${className}`}
    >
      <div className="relative w-full h-full flex items-center justify-center px-4 sm:px-6 lg:px-0">
        {/* Left White Panel */}
        <div
          ref={leftPanelRef}
          className="absolute left-[6vw] top-[14vh] w-[40vw] h-[72vh] card-white hidden lg:flex flex-col p-[5vh_3vw]"
          style={{ zIndex: 10 }}
        >
          <span
            ref={(el) => { textRefs.current[0] = el; }}
            className="eyebrow block mb-4"
          >
            FONCTIONNALITÉS
          </span>
          <h2
            ref={(el) => { textRefs.current[1] = el; }}
            className="text-3xl xl:text-4xl font-semibold text-[#0E1116] leading-tight tracking-tight mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Tout ce dont vous avez besoin pour gérer les visiteurs.
          </h2>
          <p
            ref={(el) => { textRefs.current[2] = el; }}
            className="text-base text-[#6B7280] leading-relaxed mb-6"
          >
            De la pré-enregistrement à la déconnexion, SecureVisit garde votre hall organisé et vos données prêtes pour l'audit.
          </p>

          {/* Checklist */}
          <div
            ref={(el) => { textRefs.current[3] = el; }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-[#1E6EE6]/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[#1E6EE6]" />
                </div>
                <span className="text-sm text-[#0E1116]">{feature.text}</span>
              </div>
            ))}
          </div>

          <div ref={(el) => { textRefs.current[4] = el; }}>
            <Button
              onClick={() => scrollToSection('#security')}
              className="bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white px-6 py-3 rounded-full text-sm font-medium btn-hover"
            >
              Explorer les fonctionnalités
            </Button>
          </div>
        </div>

        {/* Accent Pill */}
        <div
          ref={accentRef}
          className="absolute left-[44vw] top-[46vh] w-[10vw] h-[8vh] bg-[#1E6EE6] rounded-xl hidden lg:block"
          style={{ zIndex: 5 }}
        />

        {/* Top Right Photo */}
        <div
          ref={topRightRef}
          className="absolute left-[50vw] top-[14vh] w-[44vw] h-[34vh] card-media card-shadow hidden lg:block"
        >
          <img
            src="/images/features_office_collab.jpg"
            alt="Collaboration d'équipe dans un bureau moderne"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Bottom Right Photo */}
        <div
          ref={bottomRightRef}
          className="absolute left-[50vw] top-[52vh] w-[44vw] h-[34vh] card-media card-shadow hidden lg:block"
        >
          <img
            src="/images/features_laptop_closeup.jpg"
            alt="Professionnel travaillant sur un ordinateur portable"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Mobile Layout */}
        <div className="relative z-10 lg:hidden px-6 py-20 w-full">
          <div className="card-white p-6 mb-6">
            <span className="eyebrow block mb-4">FONCTIONNALITÉS</span>
            <h2
              className="text-2xl sm:text-3xl font-semibold text-[#0E1116] leading-tight tracking-tight mb-4"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              Tout ce dont vous avez besoin pour gérer les visiteurs.
            </h2>
            <p className="text-base text-[#6B7280] leading-relaxed mb-6">
              De la pré-enregistrement à la déconnexion, SecureVisit garde votre hall organisé et vos données prêtes pour l'audit.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#1E6EE6]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[#1E6EE6]" />
                  </div>
                  <span className="text-sm text-[#0E1116]">{feature.text}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => scrollToSection('#security')}
              className="bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white px-6 py-3 rounded-full text-sm font-medium"
            >
              Explorer les fonctionnalités
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card-media card-shadow h-48">
              <img
                src="/images/features_office_collab.jpg"
                alt="Collaboration d'équipe"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="card-media card-shadow h-48">
              <img
                src="/images/features_laptop_closeup.jpg"
                alt="Professionnel travaillant"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
