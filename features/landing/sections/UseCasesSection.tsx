import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

interface UseCasesSectionProps {
  className?: string;
}

const UseCasesSection = ({ className = '' }: UseCasesSectionProps) => {
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
            { y: 60, opacity: 0 },
            {
              y: 0,
              opacity: 1,
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
              { y: -12, scale: 1.03 },
              {
                y: 12,
                scale: 1.03,
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

  const useCases = [
    {
      title: 'Bureaux d\'entreprise',
      image: '/images/usecase_corporate.jpg',
    },
    {
      title: 'Santé',
      image: '/images/usecase_healthcare.jpg',
    },
    {
      title: 'Éducation',
      image: '/images/usecase_education.jpg',
    },
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
      id="usecases"
      className={`section-flowing bg-[#E8EDF2] node-pattern ${className}`}
    >
      <div className="w-full px-6 lg:px-12 py-20 lg:py-24">
        {/* Heading */}
        <div ref={headingRef} className="max-w-3xl mx-auto text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0E1116] leading-tight tracking-tight mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Conçu pour chaque réception
          </h2>
          <p className="text-lg text-[#6B7280] leading-relaxed">
            Paramètres flexibles, conformité constante—dans tous les secteurs.
          </p>
        </div>

        {/* Use Case Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-10">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              ref={(el) => { cardsRef.current[index] = el; }}
              className="relative h-80 lg:h-96 rounded-2xl lg:rounded-[28px] overflow-hidden card-shadow group cursor-pointer"
            >
              {/* Image */}
              <img
                src={useCase.image}
                alt={useCase.title}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1116]/80 via-[#0E1116]/20 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3
                  className="text-xl lg:text-2xl font-semibold text-white mb-2"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {useCase.title}
                </h3>
                <div className="flex items-center gap-2 text-white/80 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  En savoir plus
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={() => scrollToSection('#contact')}
            variant="outline"
            className="border-[#0E1116]/20 text-[#0E1116] hover:bg-[#0E1116]/5 px-6 py-3 rounded-full text-sm font-medium"
          >
            Explorer les cas d'usage
          </Button>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
