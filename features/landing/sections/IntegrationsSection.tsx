import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface IntegrationsSectionProps {
  className?: string;
}

const IntegrationsSection = ({ className = '' }: IntegrationsSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<(HTMLDivElement | null)[]>([]);

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

      // Tiles animation with stagger
      tilesRef.current.forEach((tile, index) => {
        if (tile) {
          gsap.fromTo(
            tile,
            { y: 40, opacity: 0, scale: 0.98 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.5,
              delay: index * 0.05,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: tile,
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

  const integrations = [
    { name: 'Active Directory', icon: 'AD' },
    { name: 'Google Workspace', icon: 'GW' },
    { name: 'Okta', icon: 'OK' },
    { name: 'Slack', icon: 'SL' },
    { name: 'Microsoft Teams', icon: 'MT' },
    { name: 'Cisco Meraki', icon: 'CM' },
    { name: 'HID / Lenel', icon: 'HL' },
    { name: 'Salesforce', icon: 'SF' },
  ];

  return (
    <section
      ref={sectionRef}
      className={`section-flowing bg-[#F4F6F8] node-pattern ${className}`}
    >
      <div className="w-full px-6 lg:px-12 py-20 lg:py-24">
        {/* Heading */}
        <div ref={headingRef} className="max-w-3xl mx-auto text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0E1116] leading-tight tracking-tight mb-4"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            Fonctionne avec votre infrastructure
          </h2>
          <p className="text-lg text-[#6B7280] leading-relaxed">
            Synchronisez les annuaires, calendriers et contrôles d'accès en quelques minutes.
          </p>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 max-w-5xl mx-auto mb-10">
          {integrations.map((integration, index) => (
            <div
              key={index}
              ref={(el) => { tilesRef.current[index] = el; }}
              className="bg-white border border-[#0E1116]/8 rounded-2xl lg:rounded-[22px] p-6 lg:p-8 flex flex-col items-center justify-center gap-4 hover:-translate-y-1 transition-transform duration-200 cursor-pointer"
            >
              <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-[#F4F6F8] flex items-center justify-center">
                <span
                  className="text-lg lg:text-xl font-bold text-[#1E6EE6]"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {integration.icon}
                </span>
              </div>
              <span className="text-sm font-medium text-[#0E1116] text-center">
                {integration.name}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button className="inline-flex items-center gap-2 text-sm font-medium text-[#1E6EE6] hover:text-[#1a5fcc] transition-colors">
            Voir toutes les intégrations
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
