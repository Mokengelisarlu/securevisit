import { useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingUp, Server, FileCheck } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface TestimonialSectionProps {
  className?: string;
}

const TestimonialSection = ({ className = '' }: TestimonialSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftCardRef = useRef<HTMLDivElement>(null);
  const rightPhotoRef = useRef<HTMLDivElement>(null);
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
          leftCardRef.current,
          { x: '-55vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
        )
        .fromTo(
          rightPhotoRef.current,
          { x: '55vw', opacity: 0 },
          { x: 0, opacity: 1, ease: 'none' },
          0
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
          leftCardRef.current,
          { x: 0, opacity: 1 },
          { x: '-12vw', opacity: 0, ease: 'power2.in' },
          0.7
        )
        .fromTo(
          rightPhotoRef.current,
          { x: 0, opacity: 1 },
          { x: '12vw', opacity: 0, ease: 'power2.in' },
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

  const metrics = [
    { icon: TrendingUp, value: '40%', label: 'enregistrement plus rapide' },
    { icon: Server, value: '99.9%', label: 'de disponibilité' },
    { icon: FileCheck, value: 'SOC 2', label: 'journaux prêts' },
  ];

  return (
    <section
      ref={sectionRef}
      className={`section-pinned bg-[#F4F6F8] node-pattern ${className}`}
    >
      <div className="relative w-full h-full flex items-center justify-center px-4 sm:px-6 lg:px-0">
        {/* Left White Quote Card */}
        <div
          ref={leftCardRef}
          className="absolute left-[6vw] top-[14vh] w-[44vw] h-[72vh] card-white hidden lg:flex flex-col p-[5vh_3vw]"
          style={{ zIndex: 10 }}
        >
          <span
            ref={(el) => { textRefs.current[0] = el; }}
            className="eyebrow block mb-6"
          >
            TÉMOIGNAGE CLIENT
          </span>

          <blockquote
            ref={(el) => { textRefs.current[1] = el; }}
            className="text-2xl xl:text-3xl font-medium text-[#0E1116] leading-snug tracking-tight mb-6"
            style={{ fontFamily: 'Sora, sans-serif' }}
          >
            "SecureVisit a transformé notre hall d'entrée d'un goulot d'étranglement en une fluidité."
          </blockquote>

          <div
            ref={(el) => { textRefs.current[2] = el; }}
            className="text-sm text-[#6B7280] mb-8"
          >
            <span className="font-medium text-[#0E1116]">Jordan Avery</span>
            <span className="mx-2">—</span>
            <span>Opérations de Bureau, Northfield Logistics</span>
          </div>

          {/* Metrics */}
          <div
            ref={(el) => { textRefs.current[3] = el; }}
            className="grid grid-cols-3 gap-4 mt-auto"
          >
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="bg-[#F4F6F8] rounded-xl p-4 text-center"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0DBDB5]/10 flex items-center justify-center mx-auto mb-2">
                  <metric.icon className="w-5 h-5 text-[#0DBDB5]" />
                </div>
                <div
                  className="text-xl font-semibold text-[#0E1116] mb-1"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {metric.value}
                </div>
                <div className="text-xs text-[#6B7280]">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Accent Square */}
        <div
          ref={accentRef}
          className="absolute left-[46vw] top-[46vh] w-[8vw] h-[8vw] accent-square hidden lg:block"
          style={{ zIndex: 5 }}
        />

        {/* Right Photo */}
        <div
          ref={rightPhotoRef}
          className="absolute left-[52vw] top-[14vh] w-[42vw] h-[72vh] card-media card-shadow hidden lg:block"
        >
          <img
            src="/images/testimonial_team.jpg"
            alt="Équipe collaborant dans un bureau moderne"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Mobile Layout */}
        <div className="relative z-10 lg:hidden px-6 py-20 w-full">
          <div className="card-white p-6 mb-6">
            <span className="eyebrow block mb-4">TÉMOIGNAGE CLIENT</span>

            <blockquote
              className="text-xl sm:text-2xl font-medium text-[#0E1116] leading-snug tracking-tight mb-4"
              style={{ fontFamily: 'Sora, sans-serif' }}
            >
              "SecureVisit a transformé notre hall d'entrée d'un goulot d'étranglement en une fluidité."
            </blockquote>

            <div className="text-sm text-[#6B7280] mb-6">
              <span className="font-medium text-[#0E1116]">Jordan Avery</span>
              <span className="mx-2">—</span>
              <span>Opérations de Bureau, Northfield Logistics</span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {metrics.map((metric, index) => (
                <div
                  key={index}
                  className="bg-[#F4F6F8] rounded-xl p-3 text-center"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0DBDB5]/10 flex items-center justify-center mx-auto mb-2">
                    <metric.icon className="w-4 h-4 text-[#0DBDB5]" />
                  </div>
                  <div
                    className="text-lg font-semibold text-[#0E1116] mb-1"
                    style={{ fontFamily: 'Sora, sans-serif' }}
                  >
                    {metric.value}
                  </div>
                  <div className="text-xs text-[#6B7280]">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-media card-shadow h-64">
            <img
              src="/images/testimonial_team.jpg"
              alt="Équipe collaborant"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
