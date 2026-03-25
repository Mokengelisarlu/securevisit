import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface PricingSectionProps {
  className?: string;
}

const PricingSection = ({ className = '' }: PricingSectionProps) => {
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

      // Cards animation - center first, then sides
      const order = [1, 0, 2]; // Professional, Starter, Enterprise
      order.forEach((cardIndex, i) => {
        const card = cardsRef.current[cardIndex];
        if (card) {
          gsap.fromTo(
            card,
            { y: 50, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              delay: i * 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                end: 'top 65%',
                scrub: 1,
              },
            }
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      description: 'Up to 50 visits/month',
      features: [
        'Basic check-in',
        'Email notifications',
        'Visitor logs',
        'Basic reporting',
      ],
      cta: 'Start free',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$79',
      period: '/mo',
      description: 'Unlimited visits + priority support',
      features: [
        'Everything in Starter',
        'Unlimited visits',
        'Priority support',
        'Advanced analytics',
        'Custom branding',
        'API access',
      ],
      cta: 'Start trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'SLA, onboarding, and advanced security',
      features: [
        'Everything in Professional',
        'Dedicated support',
        'Custom integrations',
        'SLA guarantee',
        'Advanced security',
        'On-site training',
      ],
      cta: 'Contact sales',
      highlighted: false,
    },
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
      id="pricing"
      className={`section-flowing bg-[#F4F6F8] node-pattern ${className}`}
    >
      <div className="w-full px-6 lg:px-12 py-20 lg:py-24">
        {/* Heading */}
        <div ref={headingRef} className="max-w-3xl mx-auto text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0E1116] leading-tight tracking-tight mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Simple pricing
          </h2>
          <p className="text-lg text-[#6B7280] leading-relaxed">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              ref={(el) => { cardsRef.current[index] = el; }}
              className={`relative rounded-2xl lg:rounded-[28px] p-6 lg:p-8 flex flex-col ${
                plan.highlighted
                  ? 'bg-white border-t-4 border-[#1E6EE6] shadow-lg'
                  : 'bg-white border border-[#0E1116]/8'
              } hover:-translate-y-1 transition-transform duration-200`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1E6EE6] text-white text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3
                  className="text-lg font-semibold text-[#0E1116] mb-2"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className="text-3xl lg:text-4xl font-semibold text-[#0E1116]"
                    style={{ fontFamily: 'Sora, sans-serif' }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-sm text-[#6B7280]">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-[#6B7280]">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-3 mb-6">
                {plan.features.map((feature, fIndex) => (
                  <div key={fIndex} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#1E6EE6]/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-[#1E6EE6]" />
                    </div>
                    <span className="text-sm text-[#0E1116]">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                onClick={scrollToContact}
                className={`w-full py-3 rounded-full text-sm font-medium ${
                  plan.highlighted
                    ? 'bg-[#1E6EE6] hover:bg-[#1a5fcc] text-white'
                    : 'bg-[#F4F6F8] hover:bg-[#E8EDF2] text-[#0E1116]'
                }`}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
