import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface HowItWorksSectionProps {
  className?: string;
}

const HowItWorksSection = ({ className = '' }: HowItWorksSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animation
      gsap.fromTo(
        headingRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: headingRef.current,
            start: 'top 80%',
            end: 'top 55%',
            scrub: 1,
          },
        }
      );

      // Cards animation with stagger
      cardsRef.current.forEach((card) => {
        if (card) {
          gsap.fromTo(
            card,
            { y: 60, opacity: 0, scale: 0.98 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                end: 'top 60%',
                scrub: 1,
              },
            }
          );

          // Parallax for inner image
          const img = card.querySelector('img');
          if (img) {
            gsap.fromTo(
              img,
              { y: -10 },
              {
                y: 10,
                ease: 'none',
                scrollTrigger: {
                  trigger: card,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 1,
                },
              }
            );
          }
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      number: '01',
      title: 'Pré-enregistrer',
      description: 'Envoyez un lien. Le visiteur complète ses informations avant l\'arrivée.',
      image: '/images/step_preregister.jpg',
    },
    {
      number: '02',
      title: 'Enregistrer',
      description: 'Scannez un code QR. Vérification d\'identité. Le badge s\'imprime en quelques secondes.',
      image: '/images/step_checkin.jpg',
    },
    {
      number: '03',
      title: 'Notifier et suivre',
      description: 'L\'hôte est alerté instantanément. Les journaux restent prêts pour l\'audit.',
      image: '/images/step_notify.jpg',
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="howitworks"
      className={`section-flowing bg-[#E8EDF2] node-pattern ${className}`}
    >
      <div className="w-full px-6 lg:px-12 py-20 lg:py-24">
        {/* Heading */}
        <div ref={headingRef} className="max-w-3xl mx-auto text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0E1116] leading-tight tracking-tight mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Comment ça marche
          </h2>
          <p className="text-lg text-[#6B7280] leading-relaxed">
            Un parcours simple pour les visiteurs—et zéro travail supplémentaire pour votre équipe.
          </p>
        </div>

        {/* Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="card-white overflow-hidden"
            >
              {/* Image */}
              <div className="h-48 lg:h-56 overflow-hidden">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover scale-105"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold text-[#1E6EE6]">
                    {step.number}
                  </span>
                  <div className="flex-1 h-px bg-[#0E1116]/8" />
                </div>
                <h3
                  className="text-xl font-semibold text-[#0E1116] mb-2"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
