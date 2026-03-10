import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Check, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

gsap.registerPlugin(ScrollTrigger);

interface AccountCTASectionProps {
  className?: string;
}

const AccountCTASection = ({ className = '' }: AccountCTASectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

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

      // Card animation
      gsap.fromTo(
        cardRef.current,
        { y: 50, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 85%',
            end: 'top 60%',
            scrub: 1,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const benefits = [
    '14 jours d\'essai gratuit',
    'Aucune carte de crédit requise',
    'Toutes les fonctionnalités incluses',
    'Support prioritaire',
  ];

  const scrollToContact = () => {
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      id="account"
      className={`section-flowing bg-[#F4F6F8] node-pattern ${className}`}
    >
      <div className="w-full px-6 lg:px-12 py-20 lg:py-24">
        {/* Heading */}
        <div ref={headingRef} className="max-w-3xl mx-auto text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0E1116] leading-tight tracking-tight mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Prêt à moderniser votre réception ?
          </h2>
          <p className="text-lg text-[#6B7280] leading-relaxed">
            Créez votre compte gratuit et commencez à gérer vos visiteurs dès aujourd'hui.
          </p>
        </div>

        {/* CTA Card */}
        <div
          ref={cardRef}
          className="max-w-2xl mx-auto card-white p-8 lg:p-12 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#1E6EE6]/10 flex items-center justify-center mx-auto mb-6">
            <UserPlus className="w-8 h-8 text-[#1E6EE6]" />
          </div>

          <h3
            className="text-2xl font-semibold text-[#0E1116] mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Créez votre compte gratuit
          </h3>

          <p className="text-[#6B7280] mb-8">
            Rejoignez des milliers d'entreprises qui font confiance à SecureVisit pour sécuriser leurs locaux.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#1E6EE6]/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[#1E6EE6]" />
                </div>
                <span className="text-sm text-[#0E1116]">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              className="bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white px-8 py-4 rounded-full text-base font-medium btn-hover"
            >
              <Link href="/sign-up">
                Créer un compte gratuit
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              onClick={scrollToContact}
              variant="outline"
              className="border-[#0E1116]/20 text-[#0E1116] hover:bg-[#0E1116]/5 px-8 py-4 rounded-full text-base font-medium"
            >
              Nous contacter
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccountCTASection;
